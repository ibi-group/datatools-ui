// @flow

import clone from 'lodash/cloneDeep'
import moment from 'moment'
import validator from 'validator'

import type {Entity, GtfsSpecField, ScheduleException, ServiceCalendar} from '../../types'
import type {EditorTables} from '../../types/reducers'
import { getComponentMessages } from '../../common/util/config'

import type {EditorValidationIssue, validationIssue} from './common'
import {validateBookingRule} from './bookingRuleValidation'
import {getTableById} from './gtfs'

import { EXCEPTION_EXEMPLARS } from '.'

export function doesNotExist (value: any): boolean {
  return value === '' || value === null || typeof value === 'undefined'
}

/**
 * Validate if a value is ok.
 *
 * Returns false if the value is ok.
 * Returns an EditorValidationIssue object if the value is not ok.
 */
export function validate (
  field: GtfsSpecField,
  value: any,
  entities: ?Array<Entity>,
  entity: ?Entity,
  tableData: EditorTables
): EditorValidationIssue | false | Array<EditorValidationIssue> {
  const messages = getComponentMessages('Validation') // TODO: move all strings to components, errors should use codes
  const {inputType, required, name} = field
  const valueDoesNotExist = doesNotExist(value)
  const isRequiredButEmpty = required && valueDoesNotExist
  const isOptionalAndEmpty = !required && valueDoesNotExist
  const agencies = getTableById(tableData, 'agency')
  let locationType: ?number = null

  // entity.locationtype is a string.  Convert to number for conditinals later on.
  if (entity && entity.location_type !== null) {
    locationType = parseInt(entity.location_type, 10)
  }

  // setting as a variable here because of eslint bug
  type CheckPositiveOutput = {
    num?: number,
    result: false | EditorValidationIssue
  }

  /**
   * Construct an EditorValidationIssue for this field, used if it is required
   * and has an empty value.
   */
  function emptyFieldValidationIssue (field = name) {
    return validationIssue(messages('requiredFieldEmpty'), field)
  }

  /**
   * Checks whether value is a positive number
   */
  function checkPositiveNumber (): CheckPositiveOutput {
    if (isRequiredButEmpty) {
      return {
        result: emptyFieldValidationIssue()
      }
    } else if (isOptionalAndEmpty) {
      return {
        result: false
      }
    }
    const num = parseFloat(value)

    // make sure value is parseable to a number
    if (isNaN(num)) {
      return {
        result: validationIssue(messages('mustBeValidNumber'))
      }
    }

    // make sure value is positive
    if (num < 0) {
      return {
        result: validationIssue(messages('mustBePositiveNumber'))
      }
    }

    return {
      num,
      result: false
    }
  }

  /**
   * Checks whether value is a positive number
   */
  function checkGtfsRouteType (): CheckPositiveOutput {
    // Route type should meet required/optional criteria and be positive.
    const positiveNumberCheck = checkPositiveNumber()
    const { num, result } = positiveNumberCheck

    if (result !== false) return positiveNumberCheck

    // Make sure positive number value is one of those defined for route type options.
    // (force string comparison to avoid number/string ambiguities)
    const isValid = num !== undefined && num !== null && field.options && field.options.find(
      opt => opt.value.toString() === num.toString()
    )
    if (!isValid) {
      return {
        result: validationIssue(messages('invalidRouteType'))
      }
    }

    return {
      num,
      result: false
    }
  }

  function getExceptionServiceIds (exception) {
    return [
      ...(exception.added_service || []),
      ...(exception.removed_service || []),
      ...(exception.custom_schedule || [])
    ]
  }

  switch (inputType) {
    case 'GTFS_ID':
      // Indices contains list of all indexes of occurrences of the ID value.
      const indices = []
      const idList = entities ? entities.map(e => {
        // $FlowFixMe too many unions for flow to handle
        return name in e ? e[name] : null
      }) : []
      let idx = idList.indexOf(value)
      while (idx !== -1) {
        indices.push(idx)
        idx = idList.indexOf(value, idx + 1)
      }
      const isNotUnique = !!(
        entities &&
        entity &&
        value &&
        (indices.length > 1 ||
          (indices.length > 0 && entities[indices[0]].id !== entity.id))
      )
      if (
        name === 'agency_id' &&
        idList.length > 1 &&
        valueDoesNotExist
      ) {
        return validationIssue(messages('idRequired'))
      }
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else if (isNotUnique) {
        return validationIssue(messages('idMustBeUnique'))
      } else {
        return false
      }
    case 'TEXT':
      if (
        name === 'stop_name' &&
        !value &&
        locationType !== null &&
        (typeof locationType === 'number' && locationType <= 2)
      ) {
        return validationIssue(messages('stopNameRequired'))
      }
      if (name === 'route_short_name' && !value && entity && entity.route_long_name) {
        return false
      } else if (
        name === 'route_long_name' &&
        !value &&
        entity &&
        entity.route_short_name
      ) {
        return false
      } else {
        if (isRequiredButEmpty) {
          return emptyFieldValidationIssue()
        } else {
          return false
        }
      }
    case 'GTFS_TRIP':
    case 'GTFS_SHAPE':
    case 'GTFS_BLOCK':
    case 'GTFS_FARE':
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else {
        return false
      }
    case 'GTFS_SERVICE':
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else {
        return false
      }
    case 'GTFS_SERVICE_DROPDOWN':
      if (entity && entity.booking_type) {
        return validateBookingRule(entity, field, value)
      } else {
        return false
      }
    case 'URL':
      const isNotUrl = value && !validator.isURL(value)
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else if (isNotUrl) {
        return validationIssue(messages('invalidUrl'))
      } else {
        return false
      }
    case 'EMAIL':
      const isNotEmail = value && !validator.isEmail(value)
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else if (isNotEmail) {
        return validationIssue(messages('invalidEmail'))
      } else {
        return false
      }
    case 'GTFS_ZONE':
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else {
        return false
      }
    case 'TIMEZONE':
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else {
        return false
      }
    case 'LANGUAGE':
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else {
        return false
      }
    case 'LATITUDE':
      const isNotLat = value > 90 || value < -90
      if (isNotLat) {
        return validationIssue(messages('invalidLatitude'))
      }
      if (isOptionalAndEmpty && locationType !== null && (typeof locationType === 'number' && locationType <= 2)) {
        return validationIssue(messages('latLonRequired'))
      }
      return false
    case 'LONGITUDE':
      const isNotLng = value > 180 || value < -180
      if (isNotLng) {
        return validationIssue(messages('invalidLongitude'))
      }
      if (isOptionalAndEmpty && typeof locationType === 'number' && locationType <= 2) {
        return validationIssue(messages('latLonRequired'))
      }
      return false
    case 'TIME':
      const isValid = moment(value, 'HH:mm:ss', true).isValid()
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else if (!valueDoesNotExist && !isValid) {
        return validationIssue('Field must be valid time', field.name)
      } else if (entity && entity.booking_type) {
        return validateBookingRule(entity, field, value)
      } else {
        return false
      }

    case 'NUMBER':
      const isNotANumber = isNaN(value)
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      } else if (isNotANumber) {
        return validationIssue(messages('mustBeValidNumber'))
      } else {
        return false
      }
    case 'DAY_OF_WEEK_BOOLEAN':
      let hasService = false
      const DAYS_OF_WEEK: Array<string> = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]
      for (var i = 0; i < DAYS_OF_WEEK.length; i++) {
        if (entity && entity[DAYS_OF_WEEK[i]]) {
          hasService = true
        }
      }
      if (!hasService && name === 'monday') {
        // only add validation issue for one day of week (monday)
        return validationIssue(messages('serviceRequired'))
      }
      return false
    case 'DROPDOWN':
      if (
        isRequiredButEmpty &&
        field.options &&
        field.options.findIndex(o => o.value === '') === -1
      ) {
        return emptyFieldValidationIssue()
      } else {
        return false
      }
    case 'GTFS_AGENCY':
      if (
        name === 'agency_id' &&
        agencies.length > 1
      ) {
        if (valueDoesNotExist) {
          return validationIssue(messages('agencyRequired'))
        }
      }
      return false
    case 'EXCEPTION_DATE': // a date cannot be selected more than once (for all exceptions)
      const valErrors = []
      const exceptionMap = {}
      const entityServiceIds = []
      // Clone exceptions to avoid mutating table in store.
      const scheduleExceptions: Array<ScheduleException> = clone(getTableById(tableData, 'scheduleexception'))
      if (entity) {
        const entityId = entity.id
        const exceptionIndex = scheduleExceptions.findIndex(se => se.id === entityId)
        if (exceptionIndex !== -1) {
          scheduleExceptions.splice(exceptionIndex, 1)
        }
        entityServiceIds.push(...getExceptionServiceIds(entity))
        const castedScheduleException: ScheduleException = ((entity: any): ScheduleException)
        if (scheduleExceptions.map(ex => ex.name).includes(castedScheduleException.name)) {
          const reason = messages('nameAlreadyUsed').replace('%name%', castedScheduleException.name)
          valErrors.push(validationIssue(reason, 'name'))
        }
      }

      // Special validation for exception based calendars
      if (entity && entity.exemplar && entity.exemplar === EXCEPTION_EXEMPLARS.EXCEPTION_SERVICE) {
        if (!entity.custom_schedule) valErrors.push(emptyFieldValidationIssue(messages('customServiceId')))
        const calendars: Array<ServiceCalendar> = clone(getTableById(tableData, 'calendar'))

        // Check if service ID exists elsewhere
        // $FlowFixMe: Array#some confuses flow it seems.
        if (entity.custom_schedule && calendars.some(c => c.service_id === entity.custom_schedule)) {
          const reason = messages('conflictingServiceId')
          valErrors.push(validationIssue(reason, messages('customServiceId')))
        }
      }

      for (let i = 0; i < scheduleExceptions.length; i++) {
        const scheduleException = scheduleExceptions[i]
        const serviceIds = getExceptionServiceIds(scheduleException)
        if (serviceIds && scheduleExceptions[i].dates) {
          scheduleExceptions[i].dates.map(d => {
            if (typeof exceptionMap[d] === 'undefined') {
              exceptionMap[d] = new Set()
            }
            serviceIds.forEach(s => exceptionMap[d].add(s))
          })
        }
      }
      if (!value || value.length === 0) {
        valErrors.push(emptyFieldValidationIssue('dates'))
      }
      // check if date already exists in this or other exceptions
      if (entityServiceIds) {
        for (let i = 0; i < value.length; i++) {
          const dateItemName = `dates-${i}`
          const exceptionDate = value[i]
          if (exceptionMap[exceptionDate]) {
            entityServiceIds.forEach(s => {
              if (exceptionMap[exceptionDate].has(s)) {
                // eslint-disable-next-line standard/computed-property-even-spacing
                const reason = messages('dateServiceIdCombinationDuplicate')
                  .replace('%exceptionDate%', exceptionDate)
                  .replace('%serviceId%', s)
                valErrors.push(validationIssue(reason, dateItemName))
              }
            })
          } else if (!moment(exceptionDate, 'YYYYMMDD', true).isValid()) {
            valErrors.push(emptyFieldValidationIssue(dateItemName))
          }
        }
      }
      return valErrors
    case 'POSITIVE_INT':
      const positiveNumberCheck = checkPositiveNumber()
      if (positiveNumberCheck.result !== false) return positiveNumberCheck.result
      if (isOptionalAndEmpty) return false

      // check for floating value or decimal point
      if (
        typeof positiveNumberCheck.num === 'number' &&
        (
          positiveNumberCheck.num % 1 > 0 ||
          (
            value.indexOf &&
            value.indexOf('.') > -1
          )
        )
      ) {
        return validationIssue(messages('mustBePositiveInteger'))
      }
      return false
    case 'POSITIVE_NUM':
      const checkPositiveNumResult = checkPositiveNumber().result
      if (checkPositiveNumResult) return checkPositiveNumResult
      if (entity && entity.booking_type) {
        return validateBookingRule(entity, field, value)
      }
      return false
    case 'HOUR_MINUTE_INPUT':
      if (entity && entity.booking_type) {
        return validateBookingRule(entity, field, value)
      }
      return false
    case 'GTFS_ROUTE_TYPE':
      return checkGtfsRouteType().result
    case 'GTFS_ROUTE':
    case 'GTFS_STOP':
    case 'DATE':
    case 'COLOR':
    default:
      if (isRequiredButEmpty) {
        return emptyFieldValidationIssue()
      }
      return false
  }
}
