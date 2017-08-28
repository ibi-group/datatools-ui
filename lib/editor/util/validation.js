// @flow

import moment from 'moment'
import validator from 'validator'

import type {EditorTableData, Entity, Field, ScheduleException} from '../../types'

export function doesNotExist (value: any): boolean {
  return value === '' || value === null || typeof value === 'undefined'
}

export function validate (
  field: Field,
  value: any,
  entities: Array<Entity>,
  entity: Entity,
  tableData: EditorTableData
) {
  const {inputType, required, name} = field
  const isRequiredButEmpty = required && doesNotExist(value)
  let reason = 'Required field must not be empty'
  switch (inputType) {
    case 'GTFS_ID':
      const indices = []
      const idList = entities ? entities.map(e => e[name]) : []
      let idx = idList.indexOf(value)
      while (idx !== -1) {
        indices.push(idx)
        idx = idList.indexOf(value, idx + 1)
      }
      const isNotUnique =
        value &&
        (indices.length > 1 ||
          (indices.length && entities[indices[0]].id !== entity.id))
      if (isRequiredButEmpty || isNotUnique) {
        if (isNotUnique) {
          reason = 'Identifier must be unique'
        }
        return {field: name, invalid: isRequiredButEmpty || isNotUnique, reason}
      } else {
        return false
      }
    case 'TEXT':
      if (name === 'route_short_name' && !value && entity.route_long_name) {
        return false
      } else if (
        name === 'route_long_name' &&
        !value &&
        entity.route_short_name
      ) {
        return false
      } else {
        if (isRequiredButEmpty) {
          return {field: name, invalid: isRequiredButEmpty, reason}
        } else {
          return false
        }
      }
    case 'GTFS_TRIP':
    case 'GTFS_SHAPE':
    case 'GTFS_BLOCK':
    case 'GTFS_FARE':
    case 'GTFS_SERVICE':
      if (isRequiredButEmpty) {
        return {field: name, invalid: isRequiredButEmpty, reason}
      } else {
        return false
      }
    case 'URL':
      const isNotUrl = value && !validator.isURL(value)
      if (isRequiredButEmpty || isNotUrl) {
        if (isNotUrl) {
          reason = 'Field must contain valid URL.'
        }
        return {field: name, invalid: isRequiredButEmpty || isNotUrl, reason}
      } else {
        return false
      }
    case 'EMAIL':
      const isNotEmail = value && !validator.isEmail(value)
      if (isRequiredButEmpty || isNotEmail) {
        if (isNotEmail) {
          reason = 'Field must contain valid email address.'
        }
        return {field: name, invalid: isRequiredButEmpty || isNotEmail, reason}
      } else {
        return false
      }
    case 'GTFS_ZONE':
      if (isRequiredButEmpty) {
        return {field: name, invalid: isRequiredButEmpty, reason}
      } else {
        return false
      }
    case 'TIMEZONE':
      if (isRequiredButEmpty) {
        return {field: name, invalid: isRequiredButEmpty, reason}
      } else {
        return false
      }
    case 'LANGUAGE':
      if (isRequiredButEmpty) {
        return {field: name, invalid: isRequiredButEmpty, reason}
      } else {
        return false
      }
    case 'LATITUDE':
      const isNotLat = value > 90 || value < -90
      if (isRequiredButEmpty || isNotLat) {
        if (isNotLat) {
          reason = 'Field must be valid latitude.'
        }
        return {field: name, invalid: isRequiredButEmpty || isNotLat, reason}
      } else {
        return false
      }
    case 'LONGITUDE':
      const isNotLng = value > 180 || value < -180
      if (isRequiredButEmpty || isNotLng) {
        if (isNotLng) {
          reason = 'Field must be valid longitude.'
        }
        return {field: name, invalid: isRequiredButEmpty || isNotLng, reason}
      } else {
        return false
      }
    case 'TIME':
    case 'NUMBER':
      const isNotANumber = isNaN(value)
      if (isRequiredButEmpty || isNotANumber) {
        if (isNotANumber) {
          reason = 'Field must be valid number'
        }
        return {
          field: name,
          invalid: isRequiredButEmpty || isNotANumber,
          reason
        }
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
        if (entity[DAYS_OF_WEEK[i]]) {
          hasService = true
        }
      }
      if (!hasService && name === 'monday') {
        // only add validation issue for one day of week (monday)
        reason = 'Calendar must have service for at least one day'
        return {field: name, invalid: isRequiredButEmpty, reason}
      }
      return false
    case 'DROPDOWN':
      if (
        isRequiredButEmpty &&
        field.options &&
        field.options.findIndex(o => o.value === '') === -1
      ) {
        return {field: name, invalid: isRequiredButEmpty, reason}
      } else {
        return false
      }
    case 'GTFS_AGENCY':
      if (
        name === 'agency_id' &&
        tableData.agency &&
        tableData.agency.length > 1
      ) {
        const missingId = doesNotExist(value)
        if (missingId) {
          reason =
            'Field must be populated for feeds with more than one agency.'
          return {field: name, invalid: missingId, reason}
        }
      }
      return false
    case 'EXCEPTION_DATE': // a date cannot be selected more than once (for all exceptions)
      const dateMap = {}
      let exceptions: Array<ScheduleException> = []
      if (tableData.scheduleexception) {
        exceptions = [...tableData.scheduleexception]
      }
      if (entity) {
        const exceptionIndex = exceptions.findIndex(se => se.id === entity.id)
        if (exceptionIndex !== -1) {
          exceptions.splice(exceptionIndex, 1)
        }
        const castedScheduleException: ScheduleException = ((entity: any): ScheduleException)
        exceptions.push(castedScheduleException)
      }

      for (let i = 0; i < exceptions.length; i++) {
        if (exceptions[i].dates) {
          exceptions[i].dates.map(d => {
            if (typeof dateMap[d] === 'undefined') {
              dateMap[d] = []
            }
            dateMap[d].push(exceptions[i].id)
          })
        }
      }
      if (value.length === 0) {
        return {field: `dates`, invalid: true, reason}
      }
      // check if date already exists in this or other exceptions
      for (let i = 0; i < value.length; i++) {
        if (dateMap[value[i]] && dateMap[value[i]].length > 1) {
          // eslint-disable-next-line standard/computed-property-even-spacing
          reason = `Date (${value[
            i
          ]}) cannot appear more than once for all exceptions`
          return {field: `dates-${i}`, invalid: true, reason}
        } else if (!moment(value[i], 'YYYYMMDD', true).isValid()) {
          return {field: `dates-${i}`, invalid: true, reason}
        }
      }
      return false
    case 'GTFS_ROUTE':
    case 'GTFS_STOP':
    case 'DATE':
    case 'COLOR':
    case 'POSITIVE_INT':
    case 'POSITIVE_NUM':
    default:
      if (isRequiredButEmpty) {
        return {field: name, invalid: isRequiredButEmpty, reason}
      }
      return false
  }
}
