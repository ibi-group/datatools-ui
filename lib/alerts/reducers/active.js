import update from 'react-addons-update'

const active = (state = {active: null}, action) => {
  let entities, foundIndex, updatedEntity
  switch (action.type) {
    case 'UPDATE_ACTIVE_ALERT_ALERT':
      return update(state, {active: {$set: action.alert}})
    case 'SET_ACTIVE_ALERT_PROPERTY':
      const stateUpdate = {active: {}}
      // iterate over keys in payload and update alert property
      for (var key in action.payload) {
        if (action.payload.hasOwnProperty(key)) {
          stateUpdate.active[key] = {$set: action.payload[key]}
        }
      }
      return update(state, stateUpdate)
    case 'SET_ACTIVE_ALERT_PUBLISHED':
      return update(state, {active: {published: {$set: action.published}}})
    case 'RECEIVED_ALERT_GTFS_ENTITIES':
      // TODO: update GTFS entities for active alert
      if (state !== null && state.active.affectedEntities !== null) {
        for (var i = 0; i < action.gtfsObjects.length; i++) {
          const ent = action.gtfsObjects[i]
          if (typeof ent.gtfs !== 'undefined' && ent.AlertId === state.active.id) {
            updatedEntity = state.active.affectedEntities.find(e => e.id === ent.entity.Id)
            updatedEntity[ent.type] = ent.gtfs
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
          }
        }
        return update(state, {active: {affectedEntities: {$set: entities}}})
      }
      return state
    case 'ADD_ACTIVE_ALERT_AFFECTED_ENTITY':
      entities = [...state.active.affectedEntities, action.entity]
      return update(state, {active: {affectedEntities: {$set: entities}}})
    case 'UPDATE_ACTIVE_ALERT_ENTITY':
      foundIndex = state.active.affectedEntities.findIndex(e => e.id === action.entity.id)
      if (foundIndex !== -1) {
        switch (action.field) {
          case 'TYPE':
            updatedEntity = update(action.entity, {
              type: {$set: action.value},
              stop: {$set: null},
              route: {$set: null},
              stop_id: {$set: null},
              route_id: {$set: null}
            })
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
            return update(state, {active: {affectedEntities: {$set: entities}}})
          case 'AGENCY':
            updatedEntity = update(action.entity, {agency: {$set: action.value}})
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
            return update(state, {active: {affectedEntities: {$set: entities}}})
          case 'MODE':
            updatedEntity = update(action.entity, {mode: {$set: action.value}})
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
            return update(state, {active: {affectedEntities: {$set: entities}}})
          case 'STOP':
            const stopId = action.value !== null ? action.value.stop_id : null
            // set route to null if stop is updated for type stop
            if (action.entity.type === 'STOP') {
              updatedEntity = update(action.entity, {
                stop: {$set: action.value},
                stop_id: {$set: stopId},
                agency: {$set: action.agency},
                route: {$set: null},
                route_id: {$set: null}
                // TODO: update agency id from feed id?
              })
            } else {
              updatedEntity = update(action.entity, {
                stop: {$set: action.value},
                stop_id: {$set: stopId},
                agency: {$set: action.agency}
                // TODO: update agency id from feed id?
              })
            }
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
            return update(state, {active: {affectedEntities: {$set: entities}}})
          case 'ROUTE':
            const routeId = action.value !== null ? action.value.route_id : null
            // set route to null if stop is updated for type stop
            if (action.entity.type === 'ROUTE') {
              updatedEntity = update(action.entity, {
                route: {$set: action.value},
                route_id: {$set: routeId},
                agency: {$set: action.agency},
                stop: {$set: null},
                stop_id: {$set: null}
                // TODO: update agency id from feed id?
              })
            } else {
              updatedEntity = update(action.entity, {
                route: {$set: action.value},
                route_id: {$set: routeId},
                agency: {$set: action.agency}
                // TODO: update agency id from feed id?
              })
            }
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
            return update(state, {active: {affectedEntities: {$set: entities}}})
        }
      }
      return state
    case 'DELETE_ACTIVE_ALERT_AFFECTED_ENTITY':
      foundIndex = state.active.affectedEntities.findIndex(e => e.id === action.entity.id)
      if (foundIndex !== -1) {
        entities = [
          ...state.active.affectedEntities.slice(0, foundIndex),
          ...state.active.affectedEntities.slice(foundIndex + 1)
        ]
        return update(state, {active: {affectedEntities: {$set: entities}}})
      }
      return state
    default:
      return state
  }
}

export default active
