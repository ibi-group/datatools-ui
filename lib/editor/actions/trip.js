// @flow
import clone from 'lodash/cloneDeep'
import {createAction, type ActionType} from 'redux-actions'

import {snakeCaseKeys} from '../../common/util/map-keys'
import {createVoidPayloadAction, fetchGraphQL, secureFetch} from '../../common/actions'
import {setErrorMessage} from '../../manager/actions/status'
import {entityIsNew} from '../util/objects'
import {getEditorNamespace} from '../util/gtfs'
import type {Pattern, TimetableColumn, Trip} from '../../types'
import type {dispatchFn, getStateFn, TripCounts} from '../../types/reducers'

export const addNewTrip = createAction(
  'ADD_NEW_TRIP',
  (payload: Trip) => payload
)
const deletingTrips = createVoidPayloadAction('DELETING_TRIPS_FOR_CALENDAR')
export const offsetRows = createAction(
  'OFFSET_ROWS',
  (payload: {columns: TimetableColumn[], offset: number, rowIndexes: number[]}) => payload
)
const receiveTripCounts = createAction(
  'RECEIVE_TRIP_COUNTS',
  (payload: { tripCounts: TripCounts }) => payload
)
const receiveTripCountsForPattern = createAction(
  'RECEIVE_TRIP_COUNTS_FOR_PATTERN',
  (payload: { patternId: string, tripCounts: TripCounts }) => payload
)
const receiveTripsForCalendar = createAction(
  'RECEIVE_TRIPS_FOR_CALENDAR',
  (payload: { pattern: Pattern, trips: Array<Trip> }) => payload
)
export const removeTrips = createAction(
  'REMOVE_TRIPS',
  (payload: Array<[number, 1]>) => payload
)
const requestingTripsForCalendar = createVoidPayloadAction('REQUESTING_TRIPS_FOR_CALENDAR')
export const setActiveCell = createAction(
  'SET_ACTIVE_TIMETABLE_CELL',
  (payload: null | string /* in format `row-col` */) => payload
)
export const setOffset = createAction(
  'SET_TIMETABLE_OFFSET',
  (payload: number) => payload
)
export const setScrollIndexes = createAction(
  'SET_TIMETABLE_SCROLL_INDEXES',
  (payload: { scrollToColumn: number, scrollToRow: number }) => payload
)
export const toggleAllRows = createAction(
  'TOGGLE_ALL_TIMETABLE_ROW_SELECTION',
  (payload: { active: boolean }) => payload
)
export const toggleDepartureTimes = createVoidPayloadAction('TOGGLE_DEPARTURE_TIMES')
export const toggleUseSeconds = createVoidPayloadAction('TOGGLE_USE_SECONDS')
export const toggleRowSelection = createAction(
  'TOGGLE_SINGLE_TIMETABLE_ROW_SELECTION',
  (payload: { active: boolean, rowIndex: number }) => payload
)
export const updateCellValue = createAction(
  'UPDATE_TIMETABLE_CELL_VALUE',
  (payload: {
    key: string,
    rowIndex: number,
    value: ?(number | string | { stopId: string })
  }) => payload
)

export type EditorTripActions = ActionType<typeof addNewTrip> |
  ActionType<typeof deletingTrips> |
  ActionType<typeof offsetRows> |
  ActionType<typeof receiveTripCounts> |
  ActionType<typeof receiveTripCountsForPattern> |
  ActionType<typeof receiveTripsForCalendar> |
  ActionType<typeof removeTrips> |
  ActionType<typeof requestingTripsForCalendar> |
  ActionType<typeof setActiveCell> |
  ActionType<typeof setOffset> |
  ActionType<typeof setScrollIndexes> |
  ActionType<typeof toggleAllRows> |
  ActionType<typeof toggleDepartureTimes> |
  ActionType<typeof toggleRowSelection> |
  ActionType<typeof updateCellValue>

// REST actions
export function fetchTripsForCalendar (
  feedId: string,
  pattern: Pattern,
  calendarId: string,
  fetchCounts?: boolean = false
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const namespace = getEditorNamespace(feedId, getState())
    if (!namespace) throw new Error('Editor namespace is undefined!')
    // This fetches patterns on the pattern_id field (rather than ID) because
    // pattern_id is needed to join on the nested trips table
    const query = `query ($namespace: String, $pattern_id: [String], $service_id: [String]) {
    feed(namespace: $namespace) {
        patterns (pattern_id: $pattern_id) {
          id: pattern_id
          trips (service_id: $service_id, limit: -1) {
            id
            frequencies {
              startTime: start_time
              endTime: end_time
              headwaySecs: headway_secs
              exactTimes: exact_times
            }
            tripId: trip_id
            tripHeadsign: trip_headsign
            tripShortName: trip_short_name
            blockId: block_id
            directionId: direction_id
            route_id
            shape_id
            wheelchair_accessible
            bikes_allowed
            pattern_id
            service_id
            stopTimes: stop_times (limit: -1) {
              stopId: stop_id
              stopSequence: stop_sequence
              arrivalTime: arrival_time
              departureTime: departure_time
              stopHeadsign: stop_headsign
              shape_dist_traveled: shape_dist_traveled
              pickup_type
              drop_off_type
              timepoint
            }
          }
        }
      }
    }`
    dispatch(requestingTripsForCalendar())
    // FIXME: string casting pattern id
    return dispatch(fetchGraphQL({
      query,
      variables: {namespace, pattern_id: pattern.patternId, service_id: calendarId},
      errorMessage: 'Impossible de récupérer les trajets associés à ce motif'
    }))
      .then(data => dispatch(receiveTripsForCalendar({trips: data.feed.patterns[0].trips, pattern})))
      .then(() => {
        fetchCounts && dispatch(fetchCalendarTripCountsForPattern(feedId, pattern.patternId))
      })
  }
}

export function saveTripsForCalendar (
  feedId: string,
  pattern: Pattern,
  calendarId: string,
  trips: Array<Trip>
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const errorIndexes = []
    const sessionId = getState().editor.data.lock.sessionId || ''
    trips = trips.map(snakeCaseKeys)
    return Promise.all(trips.filter(t => t).map((trip, index) => {
      const tripExists = !entityIsNew(trip) && trip.id !== null
      const tripCopy: any = clone((trip: any))
      // Add default value to continuous pickup if not provided
      // Editing continuous pickup/drop off is not currently supported in the schedule editor
      const defaults = {
        continuous_pickup: null,
        continuous_drop_off: null
      }
      tripCopy.stop_times = tripCopy.stop_times.map((stopTime, index) => {
        return {...defaults, ...(stopTime: any)}
      })
      const method = tripExists ? 'put' : 'post'
      const url = tripExists && trip.id
        ? `/api/editor/secure/trip/${trip.id}?feedId=${feedId}&sessionId=${sessionId}`
        : `/api/editor/secure/trip?feedId=${feedId}&sessionId=${sessionId}`
      return dispatch(secureFetch(url, method, tripCopy))
        .then(res => res.json())
        .catch(err => {
          console.warn(err)
          errorIndexes.push(index)
        })
    }))
      .then(trips => {
        // if error in saving, state will not refresh so user does not lose work
        if (!trips.includes(undefined)) {
          dispatch(fetchTripsForCalendar(feedId, pattern, calendarId, true))
        }
        return errorIndexes
      })
  }
}

// TODO: finish function to replace soft (unsaved) addNewTrip for POST API call
export function saveNewTrip (
  feedId: string,
  pattern: Pattern,
  calendarId: string,
  trip: Trip
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const sessionId = getState().editor.data.lock.sessionId || ''
    const url = `/api/editor/secure/trip?feedId=${feedId}&sessionId=${sessionId}`
    trip.id = null
    return dispatch(secureFetch(url, 'post', trip))
      .then(res => res.json())
      .then((t: any) => dispatch(addNewTrip(t)))
  }
}

// TODO: action is under construction...
export function saveMultipleTripsForCalendar (
  feedId: string,
  pattern: Pattern,
  calendarId: string,
  trips: Array<Trip>
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    let errorCount = 0
    const errorIndexes = []
    const newTrips = []
    const existingTrips = []
    trips.forEach(t => {
      const tripExists = entityIsNew(t) && t.id !== null
      if (tripExists) {
        existingTrips.push(t)
      } else {
        newTrips.push(t)
      }
    })
    const sessionId = getState().editor.data.lock.sessionId || ''
    const createUrl = `/api/editor/secure/trip?feedId=${feedId}&sessionId=${sessionId}`
    return dispatch(secureFetch(createUrl, 'post'))
      .then(res => {
        if (res.status >= 300) {
          errorCount++
          // errorIndexes.push(index)
          return null
        } else {
          return res.json()
        }
      })
      .then(trips => {
        // console.log(trips)
        if (errorCount) {
          dispatch(setErrorMessage({message: `Erreur inconnue lors de l'enregistrement. Impossible de sauvegarder ${errorCount} trajets`}))
        }
        dispatch(fetchTripsForCalendar(feedId, pattern, calendarId, true))
        return errorIndexes
      })
    // return result
  }
}

/**
 * Delete multiple trips. This method takes the provided trips and maps the trips'
 * IDs to a comma-separated query parameter, indicating which trips to delete.
 */
export function deleteTripsForCalendar (
  feedId: string,
  pattern: Pattern,
  calendarId: string,
  trips: Array<Trip>
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    let errorCount = 0
    const sessionId = getState().editor.data.lock.sessionId || ''
    dispatch(deletingTrips())
    const url = `/api/editor/secure/trip?feedId=${feedId}&sessionId=${sessionId}&tripIds=${trips.map(t => t.id).join(',')}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => res.json())
      .catch(error => {
        console.log(error)
        errorCount++
      })
      .then(trips => {
        // console.log(trips)
        if (errorCount) {
          dispatch(setErrorMessage({message: `Erreur inconnue lors de la suppression. Impossible de supprimer ${errorCount} trajets`}))
        }
        dispatch(fetchTripsForCalendar(feedId, pattern, calendarId, true))
      })
  }
}

/**
 * Fetch trip counts per calendar filtered by a specific pattern ID.
 */
export function fetchCalendarTripCountsForPattern (
  feedId: string,
  patternId: string
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const namespace = getEditorNamespace(feedId, getState())
    if (!namespace) throw new Error('Editor namespace is undefined!')
    // This fetches patterns on the pattern_id field (rather than ID) because
    // pattern_id is needed to join on the nested trips table
    const query = `query ($namespace: String, $pattern_id: String) {
      feed(namespace: $namespace) {
        trip_counts {
          service_id (pattern_id: $pattern_id) {
            type
            count
          }
        }
      }
    }`
    return dispatch(fetchGraphQL({
      query,
      variables: {namespace, pattern_id: patternId},
      errorMessage: 'Impossible de récupérer le nombre de trajets pour le motif.'
    }))
      .then(data => dispatch(receiveTripCountsForPattern({tripCounts: data.feed.trip_counts, patternId})))
  }
}

/**
 * Fetch all trip count categories (for each pattern, calendar, and route).
 */
export function fetchTripCounts (feedId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const namespace = getEditorNamespace(feedId, getState())
    if (!namespace) throw new Error('Editor namespace is undefined!')
    // This fetches patterns on the pattern_id field (rather than ID) because
    // pattern_id is needed to join on the nested trips table
    const query = `query ($namespace: String) {
      feed(namespace: $namespace) {
        trip_counts {
          service_id {
            type
            count
          }
          pattern_id {
            type
            count
          }
          route_id {
            type
            count
          }
        }
      }
    }`
    return dispatch(fetchGraphQL({
      query,
      variables: {namespace},
      errorMessage: 'Impossible de récupérer le nombre de trajets.'
    }))
      .then(data => dispatch(receiveTripCounts({tripCounts: data.feed.trip_counts})))
  }
}
