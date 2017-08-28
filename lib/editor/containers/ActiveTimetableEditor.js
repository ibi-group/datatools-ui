import { connect } from 'react-redux'
import {
  saveTripsForCalendar,
  deleteTripsForCalendar,
  offsetRows,
  updateCellValue,
  toggleRowSelection,
  toggleAllRows,
  toggleDepartureTimes,
  addNewTrip,
  // saveNewTrip,
  removeTrips,
  setOffset
} from '../actions/trip'

import TimetableEditor from '../components/timetable/TimetableEditor'

const mapStateToProps = (state, ownProps) => {
  const activePattern = state.editor.data.active.subEntity
  const activeSchedule = state.editor.data.tables.calendar
    ? state.editor.data.tables.calendar.find(c => c.id === ownProps.activeScheduleId)
    : null
  return {
    activePattern,
    activeSchedule,
    timetable: state.editor.timetable
  }
}

const mapDispatchToProps = {
  // NOTE: fetchTripsForCalendar is handled in ActiveGtfsEditor where it is used to fetch trips
  saveTripsForCalendar,
  deleteTripsForCalendar,

  // TIMETABLE FUNCTIONS
  updateCellValue,
  addNewTrip, // : saveNewTrip,
  offsetRows,
  removeTrips,
  toggleAllRows,
  toggleRowSelection,
  toggleDepartureTimes,
  setOffset
}

const ActiveTimetableEditor = connect(mapStateToProps, mapDispatchToProps)(TimetableEditor)

export default ActiveTimetableEditor
