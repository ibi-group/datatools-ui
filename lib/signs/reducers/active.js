import update from 'react-addons-update'

const active = (state = {active: null}, action) => {
  let entities, foundIndex, displayIndex
  switch (action.type) {
    case 'UPDATE_ACTIVE_SIGN':
      return update(state, {active: {$set: action.sign}})
    case 'CREATE_SIGN':
    case 'EDIT_SIGN':
      return update(state, {active: {$set: action.sign}})
    case 'SET_ACTIVE_SIGN_TITLE':
      return update(state, {active: {title: {$set: action.title}}})
    case 'SET_ACTIVE_SIGN_DESCRIPTION':
      return update(state, {active: {description: {$set: action.description}}})
    case 'SET_ACTIVE_SIGN_URL':
      return update(state, {active: {url: {$set: action.url}}})
    case 'SET_ACTIVE_SIGN_CAUSE':
      return update(state, {active: {cause: {$set: action.cause}}})
    case 'SET_ACTIVE_SIGN_EFFECT':
      return update(state, {active: {effect: {$set: action.effect}}})
    case 'SET_ACTIVE_SIGN_START':
      return update(state, {active: {start: {$set: parseInt(action.start)}}})
    case 'SET_ACTIVE_SIGN_END':
      return update(state, {active: {end: {$set: parseInt(action.end)}}})
    case 'SET_ACTIVE_SIGN_PUBLISHED':
      return update(state, {active: {published: {$set: action.published}}})
    case 'RECEIVED_RTD_DISPLAYS':
      if (state.active) {
        const displayMap = {}
        for (var i = 0; i < action.rtdDisplays.length; i++) {
          const d = action.rtdDisplays[i]
          if (!d.DraftDisplayConfigurationId && !d.PublishedDisplayConfigurationId) {
            continue
          }
          if (d.DraftDisplayConfigurationId) {
            if (displayMap[d.DraftDisplayConfigurationId] && displayMap[d.DraftDisplayConfigurationId].findIndex(display => display.Id === d.Id) === -1) {
              displayMap[d.DraftDisplayConfigurationId].push(d)
            } else if (!displayMap[d.DraftDisplayConfigurationId]) {
              displayMap[d.DraftDisplayConfigurationId] = []
              displayMap[d.DraftDisplayConfigurationId].push(d)
            }
          }
          if (d.PublishedDisplayConfigurationId) {
            if (displayMap[d.PublishedDisplayConfigurationId] && displayMap[d.PublishedDisplayConfigurationId].findIndex(display => display.Id === d.Id) === -1) {
              displayMap[d.PublishedDisplayConfigurationId].push(d)
            } else if (!displayMap[d.PublishedDisplayConfigurationId]) {
              displayMap[d.PublishedDisplayConfigurationId] = []
              displayMap[d.PublishedDisplayConfigurationId].push(d)
            }
          }
        }
        return update(state, {active: {displays: {$set: displayMap[state.active ? state.active.id : null]}}})
      } else {
        return state
      }
    case 'RECEIVED_SIGN_GTFS_ENTITIES':
      // TODO: update GTFS entities for active sign
      if (state !== null && state.active.affectedEntities !== null) {
        for (let i = 0; i < action.gtfsObjects.length; i++) {
          const ent = action.gtfsObjects[i]
          if (typeof ent.gtfs !== 'undefined' && ent.SignId === state.active.id) {
            // let sign = action.gtfsSigns.find(a => a.id === ent.entity.SignId)
            const updatedEntity = state.active.affectedEntities.find(e => e.id === ent.entity.Id)
            updatedEntity[ent.type] = ent.gtfs
            // entities.push(selectedEnt)
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
    case 'ADD_ACTIVE_SIGN_AFFECTED_ENTITY':
      entities = [...state.active.affectedEntities, action.entity]
      return update(state, {active: {affectedEntities: {$set: entities}}})
    case 'UPDATE_DISPLAYS':
      return update(state, {active: {displays: {$set: action.displays}}})
    case 'TOGGLE_CONFIG_FOR_DISPLAY':
      displayIndex = state.active.displays.findIndex(d => d.Id === action.display.Id)
      switch (action.configType) {
        case 'DRAFT':
          return update(state, {active: {displays: {[displayIndex]: {$merge: {DraftDisplayConfigurationId: action.configId}}}}})
        case 'PUBLISHED':
          // if setting published config to new value (not null), set draft config to null
          // if (action.configId)
          //   return update(state, {active: {displays: {[displayIndex]: {$merge: {PublishedDisplayConfigurationId: action.configId, DraftDisplayConfigurationId: null}}}}})
          // else {
          return update(state, {active: {displays: {[displayIndex]: {$merge: {PublishedDisplayConfigurationId: action.configId}}}}})
          // }
      }
      return state
    case 'UPDATE_ACTIVE_SIGN_ENTITY':
      foundIndex = state.active.affectedEntities.findIndex(e => e.id === action.entity.id)
      if (foundIndex !== -1) {
        switch (action.field) {
          case 'TYPE':
            let updatedEntity = update(action.entity, {
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
          case 'ROUTES':
            updatedEntity = update(action.entity, {
              route: {$set: action.value}
            })
            entities = [
              ...state.active.affectedEntities.slice(0, foundIndex),
              updatedEntity,
              ...state.active.affectedEntities.slice(foundIndex + 1)
            ]
            return update(state, {active: {affectedEntities: {$set: entities}}})
        }
      }
      return state
    case 'DELETE_ACTIVE_SIGN_AFFECTED_ENTITY':
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
