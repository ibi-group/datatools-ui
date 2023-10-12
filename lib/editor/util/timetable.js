// @flow

import moment from 'moment'

import type {TimetableColumn} from '../../types'

/**
 * This object defines the timetable editor keyboard shorcuts.
 */
export const SHORTCUTS = {
  offset: ['o', 'SHIFT:+:o', 'i', 'SHIFT:+:i', '-', 'SHIFT:+:-', '+', 'SHIFT:+:+'],
  navigate: ['k:/:j', '←:/:→', 'x', 'a', 'd'],
  modify: ['#', 'n', 'c', 'SHIFT:+:\'', 'SHIFT:+:;']
}

/**
 * These are the time formats that time cells in the timetable editor can
 * handle. To handle more cases, simply add to this list.
 */
export const TIMETABLE_FORMATS: Array<string> = [
  'HH:mm:ss',
  'h:mm:ss a',
  'h:mm:ssa',
  'h:mm a',
  'h:mma',
  'h:mm',
  'HHmm',
  'hmm',
  'ha',
  'HH:mm'
].map(format => `YYYY-MM-DDT${format}`)

export function isTimeFormat (type: string): boolean {
  return /TIME/.test(type)
}

export function getHeaderColumns (
  columns: Array<TimetableColumn>
): Array<TimetableColumn> {
  return columns.filter(c => c.type !== 'DEPARTURE_TIME')
}

/**
* Handles pasted data from clipboard (e.g. from CSV file)
* If departure/arrival time cell, pastes in time format, otherwise returns string as is
 */
let alertShown = false
export function parseCellValue (timeString: string, col: TimetableColumn) {
  if (isTimeFormat(col.type)) {
    const date = moment().startOf('day').format('YYYY-MM-DD')
    const parsedDate = moment(date + 'T' + timeString, TIMETABLE_FORMATS, true)
    if (!parsedDate.isValid()) {
      if (!alertShown) {
        alert('Please enter a valid time format')
        alertShown = true
      }
      return null
    } else {
      return moment(date + 'T' + timeString, TIMETABLE_FORMATS).diff(date, 'seconds')
    }
  } else {
    return timeString
  }
}

export const LEFT_COLUMN_WIDTH = 30
export const ROW_HEIGHT = 25
export const OVERSCAN_COLUMN_COUNT = 10
export const OVERSCAN_ROW_COUNT = 20 // See usage/performance info here: https://github.com/bvaughn/react-virtualized/blob/master/docs/overscanUsage.md
// Scrollbar size defined in CSS with selector: .GtfsEditor ::-webkit-scrollbar
export const SCROLL_SIZE = 5

export const TOP_LEFT_STYLE = {
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 1 // ensures that top-left header cell is clickable
}

export const HEADER_GRID_STYLE = {
  overflowX: 'hidden',
  overflowY: 'hidden',
  outline: 'none'
}

export const HEADER_GRID_WRAPPER_STYLE = {
  height: ROW_HEIGHT,
  left: LEFT_COLUMN_WIDTH,
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column'
}

export const WRAPPER_STYLE = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'row'
}

export const LEFT_GRID_STYLE = {
  overflowX: 'hidden',
  overflowY: 'hidden',
  outline: 'none'
}

export const LEFT_GRID_WRAPPER_STYLE = {
  position: 'absolute',
  left: 0,
  top: ROW_HEIGHT
}

export const MAIN_GRID_WRAPPER_STYLE = {
  position: 'absolute',
  left: LEFT_COLUMN_WIDTH,
  top: ROW_HEIGHT
}
