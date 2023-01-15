// @flow

import moment from 'moment'

import {getConfigProperty} from './config'

export function formatTimestamp (value: ?(number | string), includeTime: boolean = true): string {
  const dateFormat = getConfigProperty('application.date_format') || 'DD/MM/YYYY'
  const timeFormat = getConfigProperty('application.time_format') || 'h:mma'
  return moment(value).format(`${dateFormat}${includeTime ? `, ${timeFormat}` : ''}`)
}

export function fromNow (value: number | string): string {
  return moment(value).fromNow()
}

/**
 * Converts seconds to an hour:minute string.
 */
export function convertSecondsToHHMMString (seconds: number): string {
  const hours = Math.floor(seconds / 60 / 60)
  const minutes = Math.floor(seconds / 60) % 60
  return seconds ? `${hours}:${minutes < 10 ? '0' + minutes : minutes}` : '00:00'
}

export function convertHHMMStringToSeconds (string: string): number {
  const hourMinute = string.split(':')
  if (!isNaN(hourMinute[0]) && !isNaN(hourMinute[1])) {
    // If both hours and minutes are present
    return (Math.abs(+hourMinute[0]) * 60 * 60) + (Math.abs(+hourMinute[1]) * 60)
  } else if (isNaN(hourMinute[0])) {
    // If less than one hour
    return Math.abs(+hourMinute[1]) * 60
  } else if (isNaN(hourMinute[1])) {
    // If minutes are not present
    return Math.abs(+hourMinute[0]) * 60 * 60
  } else {
    // If no input
    return 0
  }
}

export function convertSecondsToMMSSString (seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const sec = seconds % 60
  return seconds ? `${minutes}:${sec < 10 ? '0' + sec : sec}` : '00:00'
}

export function convertMMSSStringToSeconds (string: string) {
  const minuteSecond = string.split(':')
  if (!isNaN(minuteSecond[0]) && !isNaN(minuteSecond[1])) {
    return (Math.abs(+minuteSecond[0]) * 60) + Math.abs(+minuteSecond[1])
  } else if (isNaN(minuteSecond[0])) {
    return Math.abs(+minuteSecond[1])
  } else if (isNaN(minuteSecond[1])) {
    return Math.abs(+minuteSecond[0] * 60)
  } else {
    return 0
  }
}
