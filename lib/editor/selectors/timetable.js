// @flow
import { createSelector } from 'reselect'
import objectPath from 'object-path'

import { getAbbreviatedStopName, getTableById } from '../util/gtfs'
import { isTimeFormat } from '../util/timetable'
import type {
  GtfsStop,
  Pattern,
  TimetableColumn,
  Trip
} from '../../types'
import type { AppState } from '../../types/reducers'
import type { EditorValidationIssue } from '../util/validation'

export type TripValidationIssues = {[rowCol: string]: EditorValidationIssue}

const getActivePattern = (state: AppState) => state.editor.data.active.subEntity
const getStops = (state: AppState) => getTableById(state.editor.data.tables, 'stop')
const getTrips = (state: AppState) => state.editor.timetable.trips

/**
 * Constructs the timetable columns from a trip pattern (especially its pattern
 * stops) and the set of all stops for the GTFS feed.
 */
export const getTimetableColumns = createSelector(
  [ getActivePattern, getStops ],
  (pattern: ?Pattern, stops: Array<GtfsStop>): Array<TimetableColumn> => {
    const columns = [
      {
        name: 'Block ID',
        width: 60,
        key: 'blockId',
        type: 'TEXT',
        placeholder: '300'
      },
      {
        name: 'Trip ID',
        width: 200,
        key: 'tripId',
        type: 'TEXT',
        placeholder: '12345678'
      },
      {
        name: 'Trip Headsign',
        width: 200,
        key: 'tripHeadsign',
        type: 'TEXT',
        placeholder: 'Destination via Transfer Center'
      },
      {
        name: 'Trip Short Name',
        width: 120,
        key: 'tripShortName',
        type: 'TEXT',
        placeholder: '801'
      }
    ]
    if (pattern && pattern.patternStops) {
      if (!pattern.useFrequency) {
        pattern.patternStops.map((ps, index) => {
          const stop = stops ? stops.find(st => st.stop_id === ps.stopId) : null
          const stopName = stop ? stop.stop_name : ps.stopId
          const stopId = stop && stop.stop_code
            ? stop.stop_code
            : stop && stop.stop_id
              ? stop.stop_id
              : ''
          const abbreviatedStopName = stop
            ? getAbbreviatedStopName(stop)
            : ps.stopId
          const TIME_WIDTH = 80
          columns.push({
            name: abbreviatedStopName,
            title: `${stopName} (${stopId})`,
            width: TIME_WIDTH,
            key: `stopTimes.${index}.arrivalTime`,
            colSpan: '2',
            type: 'ARRIVAL_TIME',
            placeholder: 'HH:MM:SS'
          })
          columns.push({
            key: `stopTimes.${index}.departureTime`,
            width: TIME_WIDTH,
            type: 'DEPARTURE_TIME',
            placeholder: 'HH:MM:SS'
          })
        })
      } else {
        // columns added if using freqency schedule type
        columns.push({
          name: 'Start time',
          width: 100,
          key: 'frequencies.0.startTime',
          type: 'TIME',
          placeholder: 'HH:MM:SS'
        })
        columns.push({
          name: 'End time',
          width: 100,
          key: 'frequencies.0.endTime',
          type: 'TIME',
          placeholder: 'HH:MM:SS'
        })
        columns.push({
          name: 'Headway',
          width: 60,
          key: 'frequencies.0.headwaySecs',
          type: 'SECONDS',
          placeholder: '900 (sec)'
        })
        // columns.push({
        //   name: 'Exact times',
        //   width: 60,
        //   key: 'frequencies.0.exactTimes',
        //   type: 'MINUTES',
        //   placeholder: '15 (min)'
        // })
      }
    }
    return columns
  }
)

// FIXME: This is the value currently set in gtfs-lib, but is it too low?
// see https://github.com/conveyal/gtfs-lib/issues/148
const MAX_HEADWAY_SECONDS = 60 * 60 * 2

/**
 * Utility function that checks whether any individual cell (value) for an editor
 * trip or frequency is valid. Returns an EditorValidationIssue or null if the
 * cell value is OK.
 */
const isCellValueInvalid = (
  val: any,
  row: Trip,
  colIndex: number,
  columns: Array<TimetableColumn>,
  patternStopMaxIndex: number,
  tripIds: Array<string>
): ?EditorValidationIssue => {
  const col = columns[colIndex]
  if (isTimeFormat(col.type)) {
    // FIXME: This does not yet support validating frequency start/end times.
    // Handle time column validation.
    if (typeof val === 'number' && val >= 0) {
      // There is a valid value for this column.
      // Check that the value is greater than the previous time entry
      // (accounting for skipped values/non-timepoints).
      let previousValue = null
      let previousIndex = colIndex - 1
      // Find previous stop time
      while (previousValue === null && previousIndex >= 0 && (columns[previousIndex].type === 'ARRIVAL_TIME' || columns[previousIndex].type === 'DEPARTURE_TIME')) {
        const previousCol = columns[previousIndex]
        previousValue = previousCol && row && objectPath.get(row, previousCol.key)
        previousIndex--
      }
      // Ensure value is increasing over previous value
      const isInvalid = val < previousValue
      return isInvalid
        ? {
          field: col.key,
          invalid: true,
          reason: 'Time value must not be less than the previous time.'
        }
        : null
    } else {
      if (col.type === 'TIME') {
        // Column is a frequency time entry. Both start and end time are required.
        const type = col.key.indexOf('end') > -1 ? 'end' : 'start'
        return {
          field: col.key,
          invalid: true,
          reason: `Frequency entry must have ${type} time defined.`
        }
      }
      if (
        col.key.indexOf('stopTimes.0.') > -1 ||
        col.key.indexOf(`stopTimes.${patternStopMaxIndex}.`) > -1
      ) {
        // First and last stop times must have times defined.
        return {
          field: col.key,
          invalid: true,
          reason: 'First and last stop times must have both arrival and departure times defined.'
        }
      }
      // If there is no valid number, there should not be a companion time
      // value (i.e., if missing a departure, arrival should be missing, too).
      const companionTime = col.type === 'DEPARTURE_TIME'
        ? objectPath.get(row, columns[colIndex - 1].key)
        : objectPath.get(row, columns[colIndex + 1].key)
      return typeof companionTime === 'number'
        ? {
          field: col.key,
          invalid: true,
          reason: 'Time must be defined if companion time has a value.'
        }
        : null
    }
  } else {
    // Column is not a time value.
    if (col.key === 'tripId' && val && tripIds.indexOf(val) !== -1) {
      // If there already exists a trip ID with the same value, it's an issue.
      // FIXME: This is only checking the trip IDs for the current pattern, so it's
      // not a true validation check. The server will handle this, but perhaps this
      // could be expanded so that for a tripID onCellChange a check is made to the
      // server for the existence of the tripID.
      return {
        field: col.key,
        invalid: true,
        reason: 'Trip ID must be dataset unique.'
      }
    } else if (col.key.indexOf('headwaySecs') > -1) {
      // Column should contain headway seconds
      if (val <= 0 || !Number.isInteger(val)) {
        return {
          field: col.key,
          invalid: true,
          reason: 'Headway seconds must be a positive integer.'
        }
      } else if (val > MAX_HEADWAY_SECONDS) {
        return {
          field: col.key,
          invalid: true,
          reason: `Headway seconds must be no greater than ${MAX_HEADWAY_SECONDS}.`
        }
      }
    }
  }
  // If none of the above return conditions are met, the value should be OK.
  return null
}

/**
 * Returns any validation errors found with editor timetable trips or frequencies.
 */
export const getTripValidationErrors = createSelector(
  [ getTimetableColumns, getTrips, getActivePattern ],
  (columns, trips, pattern): TripValidationIssues => {
    const patternStopMaxIndex = pattern ? pattern.patternStops.length - 1 : 0
    const errors = {}
    const tripIds = []
    for (let i = 0; i < trips.length; i++) {
      const row = trips[i]
      for (let j = 0; j < columns.length; j++) {
        const col = columns[j]
        const value = objectPath.get(row, col.key)
        const issue = isCellValueInvalid(value, row, j, columns, patternStopMaxIndex, tripIds)
        if (issue) errors[`${i}-${j}`] = issue
        if (col.key === 'tripId') {
          const tripId: string = ((value: any): string)
          tripIds.push(tripId)
        }
      }
    }
    return errors
  }
)
