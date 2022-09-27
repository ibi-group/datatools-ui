// @flow

import {connect} from 'react-redux'

import GtfsEditor from '../components/GtfsEditor'
import {
  fetchTripPatterns,
  setActiveStop,
  setActivePatternSegment,
  undoActiveTripPatternEdits,
  updatePatternStops
} from '../actions/tripPattern'
import {
  removeStopFromPattern,
  addStopAtPoint,
  addStopAtIntersection,
  addStopAtInterval,
  addStopToPattern
} from '../actions/map/stopStrategies'
import {
  handleControlPointDrag,
  handleControlPointDragEnd,
  handleControlPointDragStart,
  removeControlPoint,
  updateMapSetting,
  constructControlPoint
} from '../actions/map'
import {fetchTripsForCalendar} from '../actions/trip'
import {
  clearGtfsContent,
  deleteGtfsEntity,
  refreshBaseEditorData,
  resetActiveGtfsEntity,
  saveActiveGtfsEntity,
  setActiveEntity,
  setActiveGtfsEntity,
  updateActiveGtfsEntity,
  updateEditSetting
} from '../actions/active'
import {
  cloneGtfsEntity,
  newGtfsEntity,
  newGtfsEntities,
  removeEditorLock,
  stopLockTimer,
  uploadBrandingAsset
} from '../actions/editor'
import {createSnapshot, loadFeedVersionForEditing} from '../actions/snapshots'
import {findProjectByFeedSource} from '../../manager/util'
import {getActivePatternStops, getControlPoints, getValidationErrors} from '../selectors'
import {getTableById, getIdsFromParams} from '../util/gtfs'
import type {AppState, RouterProps} from '../../types/reducers'

export type Props = RouterProps

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {
    feedSourceId,
    activeComponent,
    subComponent,
    subSubComponent,
    activeSubSubEntity
  } = ownProps.routeParams
  // Cast IDs to integers to match data type of fields returned by the SQL database
  const {activeEntityId, subEntityId} = getIdsFromParams(ownProps.routeParams)
  const {data, editSettings: editSettingsState, mapState} = state.editor
  const {present: editSettings} = editSettingsState
  const {active, tables, tripPatterns, status} = data
  // FIXME: entityId is now a non-string line number and somewhere the number is
  // being cast to a string.
  const activeEntity = active.entity && active.entity.id === activeEntityId
    ? active.entity
    : active.entity && activeComponent === 'feedinfo'
      ? active.entity
      : null
  const activePattern = active.subEntity
  const entityEdited = active.edited
  const patternEdited = Boolean(active.patternEdited)
  const {controlPoints, patternSegments: patternCoordinates} = getControlPoints(state)
  // console.log(controlPoints, patternCoordinates)
  // controlPoints.forEach((cp, i) => {
  //   console.log(i, cp.stopId, cp.distance)
  // })
  const tableView = ownProps.location.query && ownProps.location.query.table === 'true'
  // Active set of entities (e.g., stops, routes, agency)
  const entities = activeComponent && getTableById(tables, activeComponent)
  // console.log(activeEntityId, activeEntity, active, active.entity)
  const validationErrors = getValidationErrors(state)
  const user = state.user

  // find the containing project
  const project = findProjectByFeedSource(state.projects.all, feedSourceId)
  const feedSource = project && project.feedSources && project.feedSources.find(fs => fs.id === feedSourceId)
  const namespace = feedSource && feedSource.editorNamespace

  const feedInfo = getTableById(tables, 'feedinfo')[0]
  const patternStop = active.patternStop || {}
  const {patternSegment} = active
  const timetableStatus = state.editor.timetable.status
  const feedIsLocked = !state.editor.data.lock.sessionId
  const activePatternStops = getActivePatternStops(state)
  return {
    activeComponent,
    activeEntity,
    activeEntityId,
    activePattern,
    activePatternStops,
    activeSubSubEntity,
    controlPoints,
    editSettings,
    entities,
    entityEdited,
    feedInfo,
    feedIsLocked,
    feedSource,
    feedSourceId,
    hideTutorial: state.ui.hideTutorial,
    mapState,
    namespace,
    patternCoordinates,
    patternEdited,
    patternSegment,
    patternStop,
    project,
    sidebarExpanded: state.ui.sidebarExpanded,
    status,
    subComponent,
    subEntityId,
    subSubComponent,
    tableData: tables,
    tableView,
    timetableStatus,
    tripPatterns,
    user,
    validationErrors
  }
}

const mapDispatchToProps = {
  addStopAtIntersection,
  addStopAtInterval,
  addStopAtPoint,
  addStopToPattern,
  clearGtfsContent,
  cloneGtfsEntity,
  constructControlPoint,
  createSnapshot,
  deleteGtfsEntity,
  fetchTripPatterns,
  fetchTripsForCalendar,
  handleControlPointDrag,
  handleControlPointDragEnd,
  handleControlPointDragStart,
  loadFeedVersionForEditing,
  newGtfsEntities,
  newGtfsEntity,
  refreshBaseEditorData,
  removeControlPoint,
  removeEditorLock,
  removeStopFromPattern,
  resetActiveGtfsEntity,
  saveActiveGtfsEntity,
  setActiveEntity,
  setActiveGtfsEntity,
  setActivePatternSegment,
  setActiveStop,
  stopLockTimer,
  undoActiveTripPatternEdits,
  updateActiveGtfsEntity,
  updateEditSetting,
  updateMapSetting,
  updatePatternStops,
  uploadBrandingAsset
}

const ActiveGtfsEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsEditor)

export default ActiveGtfsEditor
