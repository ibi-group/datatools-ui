// @flow

import {connect} from 'react-redux'

import {
  updateEditSetting,
  setActiveEntity,
  deleteGtfsEntity,
  saveActiveGtfsEntity,
  updateActiveGtfsEntity,
  resetActiveGtfsEntity
} from '../actions/active'
import {
  newGtfsEntity,
  cloneGtfsEntity
} from '../actions/editor'
import {addStopToPattern, removeStopFromPattern, updateShapesAfterPatternReorder} from '../actions/map/stopStrategies'
import {updateMapSetting, updatePatternGeometry} from '../actions/map'
import {setErrorMessage} from '../../manager/actions/status'
import {
  deleteAllTripsForPattern,
  normalizeStopTimes,
  setActiveStop,
  setActivePatternSegment,
  togglePatternEditing,
  updatePatternStops,
  undoActiveTripPatternEdits
} from '../actions/tripPattern'
import {findProjectByFeedSource} from '../../manager/util'
import TripPatternList from '../components/pattern/TripPatternList'
import {getTableById} from '../util/gtfs'
import {getActivePatternTripCount, getControlPoints} from '../selectors'
import type {AppState} from '../../types/reducers'

export type Props = {
  showConfirmModal: any
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {data, editSettings, mapState} = state.editor
  const {active, tables, status} = data
  const stops = getTableById(tables, 'stop')
  const {
    subEntity: activePattern,
    entity: activeEntity,
    feedSourceId,
    subEntityId: activePatternId
  } = active
  // find the containing project
  const project = findProjectByFeedSource(state.projects.all, feedSourceId)
  const {controlPoints, patternSegments} = getControlPoints(state)
  const {patternSegment} = state.editor.data.active
  const feedSource = project &&
    project.feedSources &&
    project.feedSources.find(fs => fs.id === feedSourceId)

  const patternEdited = Boolean(active.patternEdited)
  const patternStop = active.patternStop || {}
  const activePatternTripCount = getActivePatternTripCount(state)

  return {
    activeEntity,
    activePattern,
    activePatternId,
    activePatternTripCount,
    controlPoints,
    editSettings,
    feedSource,
    mapState,
    patternEdited,
    patternSegments,
    patternSegment,
    patternStop,
    status,
    stops
  }
}

const mapDispatchToProps = {
  addStopToPattern,
  cloneGtfsEntity,
  deleteAllTripsForPattern,
  deleteGtfsEntity,
  newGtfsEntity,
  normalizeStopTimes,
  removeStopFromPattern,
  resetActiveGtfsEntity,
  saveActiveGtfsEntity,
  setActiveEntity,
  setActivePatternSegment,
  setActiveStop,
  setErrorMessage,
  togglePatternEditing,
  undoActiveTripPatternEdits,
  updateActiveGtfsEntity,
  updateEditSetting,
  updateMapSetting,
  updatePatternGeometry,
  updatePatternStops,
  updateShapesAfterPatternReorder
}

const ActiveTripPatternList = connect(mapStateToProps, mapDispatchToProps)(TripPatternList)

export default ActiveTripPatternList
