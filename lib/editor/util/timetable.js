// @flow

import moment from 'moment'

import type {ScheduleException, ScheduleExceptionCalendar, ServiceCalendar, TimetableColumn} from '../../types'

import { EXCEPTION_EXEMPLARS } from '.'

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

export function parseCellValue (timeString: string, col: TimetableColumn, errorShown?: boolean) {
  const date = moment().startOf('day').format('YYYY-MM-DD')
  const parsedDate = moment(date + 'T' + timeString, TIMETABLE_FORMATS, true)
  if (isTimeFormat(col.type)) {
    if (!parsedDate.isValid()) {
      if (errorShown !== true) alert(`Entrer un format de temps valide.`)
      return null
    }
    return moment(date + 'T' + timeString, TIMETABLE_FORMATS).diff(date, 'seconds')
  }
  return timeString
}

// Helper function to find and return the active calendar, be it traditional or exception-based.
export function getActiveCalendar (calendars: Array<ServiceCalendar>, exceptionBasedCalendars: Array<ScheduleExceptionCalendar>, activeScheduleId: string): ?ServiceCalendar | ?ScheduleExceptionCalendar {
  const activeCalendarFilter = c => c.service_id === activeScheduleId
  return calendars.find(activeCalendarFilter) || exceptionBasedCalendars.find(activeCalendarFilter)
}

// Function to filter schedule exceptions into exemplars for exception-based service and to modify the custom_schedule and
// service_id in the format that the Timetable comoponents require.
export function getExceptionBasedCalendars (scheduleExceptions: Array<ScheduleException>): Array<ScheduleExceptionCalendar> {
  const exceptionBasedCalendars = scheduleExceptions && scheduleExceptions.reduce((calendars, exception) => {
    if (exception.exemplar === EXCEPTION_EXEMPLARS.EXCEPTION_SERVICE) {
      if (exception.custom_schedule && exception.custom_schedule[0]) {
        calendars.push({...exception, custom_schedule: exception.custom_schedule[0], service_id: exception.custom_schedule[0]})
      }
    }
    return calendars
  }, [])
  // $FlowFixMe: reduce confuses flow about custom_schedule type
  return exceptionBasedCalendars
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
