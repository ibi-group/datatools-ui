// @flow

import {createAction, type ActionType} from 'redux-actions'
import {ActionCreators} from 'redux-undo'
import {toast} from 'react-toastify'

import {createVoidPayloadAction, fetchGraphQL, secureFetch} from '../../common/actions'
import {snakeCaseKeys} from '../../common/util/map-keys'
import {generateUID} from '../../common/util/util'
import {shapes} from '../../gtfs/util/graphql'
import {fetchGTFSEntities, receiveGTFSEntities} from '../../manager/actions/versions'
import {getEditorNamespace} from '../util/gtfs'
import {resequenceStops, resequenceShapePoints} from '../util/map'
import {entityIsNew} from '../util/objects'
import type {ControlPoint, Pattern, PatternStop} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

import {fetchTripCounts} from './trip'
import {showEditorModal} from './editor'
import {resetActiveGtfsEntity, savedGtfsEntity, updateActiveGtfsEntity, updateEditSetting} from './active'

const fetchingTripPatterns = createVoidPayloadAction('FETCHING_TRIP_PATTERNS')
const savedTripPattern = createVoidPayloadAction('SAVED_TRIP_PATTERN')
export const setActivePatternSegment = createAction(
  'SET_ACTIVE_PATTERN_SEGMENT',
  (payload: ?number) => payload
)
export const setActiveStop = createAction(
  'SET_ACTIVE_PATTERN_STOP',
  (payload: { id: null | string, index: null | number }) => payload
)
// Toggle signals that the shape edits should be cleared from the undo history
const togglingPatternEditing = createVoidPayloadAction('TOGGLE_PATTERN_EDITING')
const undoTripPatternEdits = createAction(
  'UNDO_TRIP_PATTERN_EDITS',
  (payload: {
    controlPoints: null | Array<ControlPoint>,
    patternSegments: null | Array<Coordinates>
  }) => payload
)

export type EditorTripPatternActions = ActionType<typeof normalizeStopTimes> |
  ActionType<typeof savedTripPattern> |
  ActionType<typeof setActivePatternSegment> |
  ActionType<typeof setActiveStop> |
  ActionType<typeof undoTripPatternEdits>

/**
 * Dispatches a server call to normalize stop times for a trip pattern for a set
 * of pattern stops, beginning with the stop sequence provided. This feature
 * provides a way to bulk update existing trips when pattern stops are modified
 * (e.g., a pattern stop is inserted, removed, or its travel times modified).
 */
export function normalizeStopTimes (patternId: number, beginStopSequence: number, interpolateStopTimes: boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {data} = getState().editor
    const {feedSourceId} = data.active
    const sessionId = data.lock.sessionId || ''
    const url = `/api/editor/secure/pattern/${patternId}/stop_times?feedId=${feedSourceId || ''}&sessionId=${sessionId}&stopSequence=${beginStopSequence}&interpolateStopTimes=${interpolateStopTimes.toString()}`
    return dispatch(secureFetch(url, 'put'))
      .then(res => res.json())
      .then(json => toast.info(`ⓘ ${json.updateResult}`, {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      }))
  }
}

/**
 * Convenience action to update active pattern's pattern stops. Handles proper
 * resequencing of pattern stops to ensure they are zero-based, incrementing
 * values.
 */
export function updatePatternStops (
  pattern: Pattern,
  patternStops: Array<PatternStop>
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const sortedPatternStops = patternStops.map(resequenceStops)
    dispatch(updateActiveGtfsEntity({
      component: 'trippattern',
      entity: pattern,
      props: {patternStops: sortedPatternStops}
    }))
  }
}

export function undoActiveTripPatternEdits () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // Get most recent set of control points and pattern segments.
    const {past} = getState().editor.editSettings
    const {controlPoints, patternSegments} = past[past.length - 1]
    // Action signals to the redux-undo library to reset to the past state. The
    // control points and pattern segments are ONLY used by the data reducer to
    // reset the active trip pattern shape points.
    dispatch(undoTripPatternEdits({controlPoints, patternSegments}))
  }
}

export function togglePatternEditing () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {editGeometry} = getState().editor.editSettings.present
    // Dispatch actions that revert back to initial state and clears pattern
    // geometry undo history.
    dispatch(ActionCreators.jumpToPast(0))
    dispatch(togglingPatternEditing())
    dispatch(updateEditSetting({
      setting: 'editGeometry',
      value: !editGeometry
    }))
  }
}

/**
 * Fetch all trip patterns for the feed. Used to display pattern shapes in map
 * layer.
 */
export function fetchTripPatterns (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchingTripPatterns())
    const namespace = getEditorNamespace(feedId, getState())
    if (!namespace) {
      console.error('Cannot fetch GTFS for undefined or null namespace')
      dispatch(showEditorModal())
      return
    }
    const variables = {namespace}
    return dispatch(fetchGraphQL({query: shapes, variables}))
      .then(data => dispatch(
        receiveGTFSEntities({
          namespace,
          component: 'pattern',
          data,
          editor: true,
          id: null,
          replaceNew: true
        })
      ))
  }
}

export function saveTripPattern (feedId: ?string, tripPattern: Pattern) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (!feedId) {
      console.warn('feedId non défini, impossible de sauvegarder le motif de voyage.')
      return
    }
    const patternIsNew = entityIsNew(tripPattern)
    const {data} = getState().editor
    let travelTimeChanged, stopAdded, stopRemoved
    const route = data.tables.routes.find(route => tripPattern.routeId === route.route_id)
    if (route && !patternIsNew) {
      const oldPattern = route.tripPatterns &&
        route.tripPatterns.find(p => p.id === tripPattern.id)
      if (oldPattern) {
        if (oldPattern.patternStops.length > tripPattern.patternStops.length) {
          stopRemoved = true
        } else if (oldPattern.patternStops.length < tripPattern.patternStops.length) {
          stopAdded = true
        } else {
          oldPattern.patternStops.forEach((ps, i) => {
            const newPatternStop = tripPattern.patternStops[i]
            if (ps.defaultTravelTime !== newPatternStop.defaultTravelTime ||
              ps.defaultDwellTime !== newPatternStop.defaultDwellTime
            ) {
              travelTimeChanged = true
            }
          })
        }
      }
    }
    const sessionId = data.lock.sessionId || ''
    const method = patternIsNew ? 'post' : 'put'
    // Route ID needed for re-fetch is the ID field of the active entity (route)
    // NOTE: The pattern being saved is the active **sub**-entity.
    if (!data.active.entity) {
      console.warn('Pas d\'entité active définie, impossible de sauvegarder le motif de voyage.')
      return
    }
    const {id: routeId} = data.active.entity
    // Resequence shape points to ready shape_points for insertion into shapes
    // table. NOTE: if the pattern shape has been edited, the sequence should
    // already be correct. However, if it is unedited, it may not be zero-based,
    // so we prevent that here.
    // NOTE: This must be applied before snake case-ing (because
    // resequenceShapePoints updates the camelCase field shapePtSequence).
    tripPattern.patternStops = tripPattern.patternStops.map(resequenceStops)
    if (!tripPattern.shapeId && tripPattern.shapePoints && tripPattern.shapePoints.length > 0) {
      // If trip pattern has no shape ID (e.g., if the pattern was imported
      // without shapes) but it does have shape points, generate a new shape ID
      // and assign shape points to the new ID.
      const shapeId = generateUID()
      tripPattern.shapeId = shapeId
      tripPattern.shapePoints = tripPattern.shapePoints.map(sp => ({...sp, shapeId}))
    }
    tripPattern.shapePoints = tripPattern.shapePoints.map(resequenceShapePoints)
    const patternData = snakeCaseKeys(tripPattern)
    // Shape points must be assigned to shapes field in order to match back end
    // model and apply updates.
    patternData.shapes = patternData.shape_points
    // Remove large fields that are unrecognized by the back end.
    delete patternData.shape_points
    delete patternData.shape
    const url = patternIsNew
      ? `/api/editor/secure/pattern?feedId=${feedId}&sessionId=${sessionId}`
      : `/api/editor/secure/pattern/${tripPattern.id}?feedId=${feedId}&sessionId=${sessionId}`
    patternData.id = patternIsNew ? null : tripPattern.id
    return dispatch(secureFetch(url, method, patternData))
      .then(res => res.json())
      .then(newTripPattern => {
        dispatch(savedGtfsEntity())
        // If # of pattern stops, order of pattern stops, or
        // default travel/dwell time changed and show warning button to tell user
        // to normalize stop times. If a stop is added or removed, advise user
        // to adjust travel times.
        if (travelTimeChanged || stopAdded || stopRemoved) {
          const message = travelTimeChanged
            ? '⚠ Astuce: quand des modifications sont effectuées au niveau des temps de voyage, utilisez le bouton \'Normaliser les temps d\'arrêt\' pour automatiquement mettre à jour tous les temps d\'arrêt.'
            : stopAdded
              ? '⚠ Quand vous ajoutez un arrêt au motif, ajustez son temps de voyage par défaut pour assurer que le motif contiennent des temps d\'arrivée et de départ précis.'
              : '⚠ Quand vous supprimez un arrêt du motif, ajustez le temps de voyage par défaut pour les arrêts suivants si la suppression cause un changement dans le temps de voyage du segment modifié.'
          toast.warn(message, {
            position: 'top-right',
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          })

          // dispatch(showToast({title: 'Pattern update!', body: 'Travel time for a stop has changed. Consider normalizing travel/dwell times.'}))
        }
        // Signals to undo history that pattern history should be cleared.
        dispatch(savedTripPattern())
        const namespace = getEditorNamespace(feedId, getState())
        // Refetch entity and replace in store
        return dispatch(fetchGTFSEntities({
          namespace,
          id: routeId,
          type: 'route',
          editor: true,
          replaceNew: patternIsNew,
          patternId: newTripPattern.id
        }))
      })
      .catch(err => {
        console.log(err)
        dispatch(resetActiveGtfsEntity({
          entity: tripPattern,
          component: 'trippattern'
        }))
      })
  }
}

/**
 * Deletes all trips for a given pattern ID. This is used to clear the trips for
 * a pattern if/when a pattern is changed from frequency-based to timetable-baed.
 */
export function deleteAllTripsForPattern (feedId: string, patternId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const sessionId = getState().editor.data.lock.sessionId || ''
    const url = `/api/editor/secure/pattern/${patternId}/trips?feedId=${feedId}&sessionId=${sessionId}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => res.json())
      .then(json => json && json.result === 'OK')
      .then(() => dispatch(fetchTripCounts(feedId)))
  }
}
