// @flow

import moment from 'moment'

import type {TimetableColumn} from '../../types'

export const TIMETABLE_FORMATS = [
  'HH:mm:ss',
  'h:mm:ss a',
  'h:mm:ssa',
  'h:mm a',
  'h:mma',
  'h:mm',
  'HHmm',
  'hmm',
  'HH:mm'
].map(format => `YYYY-MM-DDT${format}`)

export function isTimeFormat (type: string): boolean {
  return /TIME/.test(type)
}

export const getCellRenderer = (
  col: TimetableColumn,
  value: number
): string => {
  if (!isTimeFormat(col.type)) {
    return '' + value
  } else {
    if (value === 0) {
      return moment().startOf('day').seconds(value).format('HH:mm:ss')
    } else if (value && value >= 86400) {
      const text = moment().startOf('day').seconds(value).format('HH:mm:ss')
      const parts = text.split(':')
      parts[0] = '' + (parseInt(parts[0], 10) + 24)
      return parts.join(':')
    } else if (value && value > 0) {
      return moment().startOf('day').seconds(value).format('HH:mm:ss')
    } else {
      return ''
    }
  }
}

export function getHeaderColumns (
  columns: Array<TimetableColumn>
): Array<TimetableColumn> {
  return columns.filter(c => c.type !== 'DEPARTURE_TIME')
}

export function parseTime (timeString: string) {
  const date = moment().startOf('day').format('YYYY-MM-DD')
  return moment(date + 'T' + timeString, TIMETABLE_FORMATS).diff(
    date,
    'seconds'
  )
}

export const LEFT_COLUMN_WIDTH = 30
export const ROW_HEIGHT = 25
export const OVERSCAN_COLUMN_COUNT = 10
export const OVERSCAN_ROW_COUNT = 20 // See usage/performance info here: https://github.com/bvaughn/react-virtualized/blob/master/docs/overscanUsage.md

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
