// @flow

import moment from 'moment'

import type {ExceptionDate, ScheduleExceptionDateRange} from '../../types'

/**
 * This method updates the current dates based on the updated range. The method determines if the range has been extended or
 * condensed and adds or subtracts dates as appropriate.
 */
export function updateDates (isStartDate: boolean, newRangeBoundary: moment, dates: Array<string>, startMoment: moment, endMoment: moment) {
  if (isStartDate) {
    const rangeExtended = startMoment.diff(newRangeBoundary) > 0
    return rangeExtended
      ? modifyRangeOfDates(dates, endMoment, newRangeBoundary, false)
      : modifyRangeOfDates(dates, newRangeBoundary.subtract(1, 'days'), startMoment, true) // Keep the end date
  } else {
    const rangeExtended = newRangeBoundary.diff(endMoment) > 0
    return rangeExtended
      ? modifyRangeOfDates(dates, newRangeBoundary, startMoment, false)
      : modifyRangeOfDates(dates, endMoment, newRangeBoundary.add(1, 'days'), true) // Keep the start date
  }
}

/**
 * This method adds or removes a range of dates from startRange to endRange to the dates array.
 */
export function modifyRangeOfDates (
  dates: Array<string>,
  endRange: moment,
  startRange: moment,
  remove: boolean
) {
  const end = endRange.format('YYYYMMDD')
  const start = startRange.format('YYYYMMDD')

  // $FlowFixMe: Flow doesn't understand sets
  if (startRange.unix() > endRange.unix()) return Array.from(new Set(dates))

  if (remove) {
    dates = dates.filter(el => el !== end && el !== start)
  } else {
    dates.push(end, start)
  }

  endRange.subtract(1, 'days')
  startRange.add(1, 'days')

  return modifyRangeOfDates(dates, endRange, startRange, remove)
}

/**
 * This method parses dates to extract ranges and individual exception dates. It assumes that dates is sorted.
 */
export function getRangesForDates (dates: Array<ExceptionDate>, ranges: Array<ScheduleExceptionDateRange> = []) {
  // If dates is empty, return ranges
  if (dates.length === 0) return ranges
  // Grab first date, iterate over ranges and see if any startRange is above the date
  const date = dates.shift()
  // New dates are stored as 0's, these will be converted back in the reducer in ScheduleExceptionForm as with a regular date
  if (date === 0) ranges.push({startDate: 0, endDate: 0})
  else {
    // Find index of range whose end date is one less than our date
    const previousDate = moment(date).subtract(1, 'days').format('YYYYMMDD')
    const rangeIndex = ranges.findIndex(range => range.endDate === previousDate)
    if (rangeIndex === -1) ranges.push({startDate: date, endDate: date})
    else ranges[rangeIndex].endDate = date
  }
  return getRangesForDates(dates, ranges)
}
