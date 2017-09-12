import {createAction} from 'redux-actions'

// edit active alert actions

export const setActiveProperty = createAction('SET_ACTIVE_ALERT_PROPERTY')

export const setActivePublished = (published) => {
  return {
    type: 'SET_ACTIVE_ALERT_PUBLISHED',
    published
  }
}
let nextEntityId = 0
export const addActiveEntity = (field = 'AGENCY', value = null, agency = null, newEntityId = 0) => {
  nextEntityId++
  const newEntity = {
    type: 'ADD_ACTIVE_ALERT_AFFECTED_ENTITY',
    entity: {
      id: newEntityId || nextEntityId,
      type: field
    }
  }
  // set agency of new entity
  if (agency) {
    newEntity.entity.agency = agency
  }
  newEntity.entity[field.toLowerCase()] = value
  return newEntity
}

export const deleteActiveEntity = (entity) => {
  return {
    type: 'DELETE_ACTIVE_ALERT_AFFECTED_ENTITY',
    entity
  }
}

export const updateActiveEntity = (entity, field, value, agency) => {
  return {
    type: 'UPDATE_ACTIVE_ALERT_ENTITY',
    entity,
    field,
    value,
    agency
  }
}
