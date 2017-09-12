import update from 'react-addons-update'
import objectPath from 'object-path'
import clone from 'lodash.clonedeep'

import { sortAndFilterTrips } from '../util'
import { isTimeFormat } from '../util/timetable'

const defaultState = {
  columns: [],
  trips: [],
  edited: [],
  selected: [],
  hideDepartureTimes: false,
  offset: null
}

const timetable = (state = defaultState, action) => {
  let trips
  switch (action.type) {
    case 'RECEIVE_TRIP_PATTERNS_FOR_ROUTE':
      return update(state, {
        columns: {$set: action.activeColumns}
      })
    case 'SETTING_ACTIVE_GTFS_ENTITY':
      switch (action.subComponent) {
        case 'trippattern':
          if (action.subSubComponent === 'timetable') {
            return update(state, {
              columns: {$set: action.activeColumns},
              patternId: {$set: action.subEntityId},
              calendarId: {$set: action.subSubEntityId}
            })
          }
          break
      }
      return state
    case 'RECEIVE_TRIPS_FOR_CALENDAR':
      trips = clone(sortAndFilterTrips(action.trips, action.pattern.useFrequency))
      return update(state, {
        trips: {$set: trips},
        edited: {$set: []}
      })
    case 'OFFSET_ROWS':
      trips = clone(state.trips)
      const editedRows = []
      // console.log(`Offsetting ${action.payload.rowIndexes.length} rows by ${action.payload.offset} seconds`)
      for (var i = 0; i < action.payload.rowIndexes.length; i++) {
        editedRows.push(action.payload.rowIndexes[i])
        for (var j = 0; j < state.columns.length; j++) {
          const col = state.columns[j]
          const path = `${action.payload.rowIndexes[i]}.${col.key}`
          if (isTimeFormat(col.type)) {
            const currentVal = objectPath.get(trips, path)
            const value = currentVal + (action.payload.offset % 86399) // ensure seconds does not exceed 24 hours
            objectPath.set(trips, path, value)
          }
        }
      }
      return update(state, {
        trips: {$set: trips},
        edited: {$push: editedRows}
      })
    case 'SET_TIMETABLE_OFFSET':
      return update(state, {
        offset: {$set: action.seconds}
      })
    case 'UPDATE_TIMETABLE_CELL_VALUE':
      trips = clone(state.trips)
      objectPath.set(trips, action.key, action.value)
      return update(state, {
        trips: {$set: trips},
        edited: {$push: [action.rowIndex]}
      })
    case 'TOGGLE_ALL_TIMETABLE_ROW_SELECTION':
      const selected = []
      if (action.select) {
        for (let i = 0; i < state.trips.length; i++) {
          selected.push(i)
        }
      }
      return update(state, {
        selected: {$set: selected}
      })
    case 'TOGGLE_DEPARTURE_TIMES':
      return update(state, {
        hideDepartureTimes: {$set: !state.hideDepartureTimes}
      })
    case 'ADD_NEW_TRIP':
      return update(state, {
        trips: {$push: [action.trip]},
        edited: {$push: [state.trips.length]}
      })
    case 'REMOVE_TRIPS':
      return update(state, {
        trips: {$splice: action.indexes}
      })
    case 'TOGGLE_SINGLE_TIMETABLE_ROW_SELECTION':
      const selectIndex = state.selected.indexOf(action.rowIndex)
      if (selectIndex === -1) {
        return update(state, {
          selected: {$push: [action.rowIndex]}
        })
      } else {
        return update(state, {
          selected: {$splice: [[selectIndex, 1]]}
        })
      }
    default:
      return state
  }
}

export default timetable
