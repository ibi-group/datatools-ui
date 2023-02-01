// @flow

import { connect } from 'react-redux'

import {setActiveEntity} from '../actions/active'
import {
  addNewTrip,
  deleteTripsForCalendar,
  fetchCalendarTripCountsForPattern,
  fetchTripsForCalendar,
  offsetRows,
  removeTrips,
  saveTripsForCalendar,
  setActiveCell,
  setOffset,
  setGenerateTripsCount,
  setScrollIndexes,
  toggleAllRows,
  toggleDepartureTimes,
  toggleRowSelection,
  updateCellValue
} from '../actions/trip'
import TimetableEditor from '../components/timetable/TimetableEditor'
import {getTableById} from '../util/gtfs'
import {findProjectByFeedSource} from '../../manager/util'
import {getTripCounts} from '../selectors'
import {getTimetableColumns, getTripValidationErrors} from '../selectors/timetable'
import type {AppState, RouteParams} from '../../types/reducers'

export type Props = {
  route: any,
  routeParams: RouteParams,
  showConfirmModal: any
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {active, tables} = state.editor.data
  const {
    subEntityId: activePatternId,
    subSubEntityId: activeScheduleId
  } = active
  const {timetable} = state.editor
  const {feedSourceId} = ownProps.routeParams
  const project = findProjectByFeedSource(state.projects.all, feedSourceId)
  const feedSource = project && project.feedSources && project.feedSources.find(fs => fs.id === feedSourceId)
  const tripCounts = getTripCounts(state)
  const columns = getTimetableColumns(state)
  const tripValidationErrors = getTripValidationErrors(state)
  const {subEntity: activePattern} = active
  const activeSchedule = getTableById(tables, 'calendar')
    .find(c => c.service_id === activeScheduleId)
  const timetableStatus = state.editor.timetable.status
  return {
    activePatternId,
    activeScheduleId,
    activePattern,
    activeSchedule,
    columns,
    feedSource,
    tableData: tables,
    timetable,
    timetableStatus,
    tripCounts,
    tripValidationErrors
  }
}

const mapDispatchToProps = {
  addNewTrip,
  deleteTripsForCalendar,
  fetchCalendarTripCountsForPattern,
  fetchTripsForCalendar,
  offsetRows,
  removeTrips,
  saveTripsForCalendar,
  setActiveCell,
  setActiveEntity,
  setOffset,
  setGenerateTripsCount,
  setScrollIndexes,
  toggleAllRows,
  toggleDepartureTimes,
  toggleRowSelection,
  updateCellValue
}

const ActiveTimetableEditor = connect(mapStateToProps, mapDispatchToProps)(TimetableEditor)

export default ActiveTimetableEditor
