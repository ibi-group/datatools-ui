// @flow

import { getComponentMessages } from '../../../common/util/config'
import type { GtfsBookingRule, GtfsSpecField } from '../../../types'

import { validationIssue } from './common'
import type { EditorValidationIssue } from './common'

const messages = getComponentMessages('BookingRuleValidation')

export const validateBookingRule = (bookingRule: GtfsBookingRule, field: GtfsSpecField, value: string): Array<EditorValidationIssue> => {
  const fieldName = field.name
  const {
    booking_type: bookingType,
    prior_notice_duration_max: priorNoticeDurationMax,
    prior_notice_last_day: priorNoticeLastDay,
    prior_notice_start_day: priorNoticeStartDay
  } = bookingRule
  const valErrors = []
  const bookingTypeString = bookingType.toString()

  switch (fieldName) {
    case 'prior_notice_duration_min':
      if (bookingTypeString === '1' && !value) {
        const reason = messages('requiredForBookingType').replace('%bookingType%', bookingType)
        valErrors.push(validationIssue(reason, fieldName))
      } else if (bookingTypeString !== '1' && value) {
        const reason = messages('forbiddenForBookingTypeOtherThan').replace('%bookingType%', '1')
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    case 'prior_notice_duration_max':
      if (value && ['0', '2'].includes(bookingTypeString)) {
        const reason = messages('forbiddenForBookingTypeOtherThan').replace('%bookingType%', '1')
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    case 'prior_notice_last_day':
      if (bookingTypeString === '2' && !value) {
        const reason = messages('requiredForBookingType').replace('%bookingType%', bookingType)
        valErrors.push(validationIssue(reason, fieldName))
      } else if (bookingTypeString !== '2' && value) {
        const reason = messages('forbiddenForBookingTypeOtherThan').replace('%bookingType%', '2')
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    case 'prior_notice_last_time':
      if (bookingTypeString === '2' && priorNoticeLastDay && !value) {
        const reason = messages('requiredIfFieldIsDefined').replace('%field%', 'prior_notice_last_day')
        valErrors.push(validationIssue(reason, fieldName))
      } else if (bookingTypeString !== '2' && value) {
        const reason = messages('forbiddenForBookingType').replace('%bookingType%', bookingType)
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    case 'prior_notice_start_day':
      if (bookingTypeString === '0' && value) {
        const reason = messages('forbiddenForBookingType').replace('%bookingType%', bookingType)
        valErrors.push(validationIssue(reason, fieldName))
      } else if (bookingTypeString === '1' && priorNoticeDurationMax && value) {
        const reason = messages('forbiddenForBookingTypeIfDefined').replace('%bookingType%', bookingType).replace('%field%', 'prior_notice_duration_max')
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    case 'prior_notice_start_time':
      if (priorNoticeStartDay && !value) {
        const reason = messages('requiredIfFieldIsDefined').replace('%field%', 'prior_notice_start_day')
        valErrors.push(validationIssue(reason, fieldName))
      } else if (!priorNoticeStartDay && value) {
        const reason = messages('forbiddenIfFieldNotDefined').replace('%field%', 'prior_notice_start_day')
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    case 'prior_notice_service_id':
      if (bookingTypeString !== '2' && value) {
        const reason = messages('forbiddenForBookingTypeOtherThan').replace('%bookingType%', '2')
        valErrors.push(validationIssue(reason, fieldName))
      }
      break
    default:
      break
  }
  return valErrors
}
