// @flow

import moment from 'moment'

import type {Alert} from '../../types'

export const FILTERS = ['ACTIVE', 'FUTURE', 'ARCHIVED', 'DRAFT', 'ALL']

export const CAUSES = [
  'UNKNOWN_CAUSE',
  'TECHNICAL_PROBLEM',
  'STRIKE',
  'DEMONSTRATION',
  'ACCIDENT',
  'HOLIDAY',
  'WEATHER',
  'MAINTENANCE',
  'CONSTRUCTION',
  'POLICE_ACTIVITY',
  'MEDICAL_EMERGENCY',
  'OTHER_CAUSE'
]

export const SORT_OPTIONS = [
  {value: 'id:asc', label: 'Oldest'},
  {value: 'id:desc', label: 'Newest'},
  {value: 'title:asc', label: 'Title'},
  {value: 'title:desc', label: 'Title (reverse)'},
  {value: 'start:asc', label: 'Starts earliest'},
  {value: 'start:desc', label: 'Starts latest'},
  {value: 'end:asc', label: 'Ends earliest'},
  {value: 'end:desc', label: 'Ends latest'}
]

export const EFFECTS = [
  'UNKNOWN_EFFECT',
  'NO_SERVICE',
  'REDUCED_SERVICE',
  'SIGNIFICANT_DELAYS',
  'DETOUR',
  'ADDITIONAL_SERVICE',
  'MODIFIED_SERVICE',
  'STOP_MOVED',
  'OTHER_EFFECT'
]

export function filterAlertsByCategory (alerts: Array<Alert>, filter: string) {
  const now = moment()
  switch (filter) {
    case 'ALL':
      return alerts
    case 'ACTIVE':
      return alerts.filter((alert: Alert) =>
        moment(alert.start).isBefore(now) &&
        moment(alert.end).isAfter(now) &&
        alert.published
      )
    case 'FUTURE':
      return alerts.filter((alert: Alert) => moment(alert.start).isAfter(now))
    case 'ARCHIVED':
      return alerts.filter((alert: Alert) => moment(alert.end).isBefore(now))
    case 'DRAFT':
      return alerts.filter((alert: Alert) => !alert.published)
    default:
      return alerts
  }
}
