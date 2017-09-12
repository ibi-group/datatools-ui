import update from 'react-addons-update'
import clone from 'lodash.clonedeep'
import ll from '@conveyal/lonlat'
import SortDirection from 'react-virtualized/dist/commonjs/Table/SortDirection'

import {defaultSorter, generateUID} from '../../common/util/util'
import {gtfsSort} from '../util/gtfs'
import {stopToGtfs, routeToGtfs, agencyToGtfs, calendarToGtfs, fareToGtfs} from '../util/objects'
// import {getStopsForPattern} from '../util'

const defaultState = {
  active: {},
  tables: {},
  sort: {
    key: 'name',
    direction: SortDirection.ASC
  },
  status: {}
}
const data = (state = defaultState, action) => {
  let stateUpdate, key, newTableData, entity, subEntity, newState, routeIndex, stopIndex, patternIndex, agencyIndex, fareIndex, calendarIndex, scheduleExceptionIndex, activePattern
  const { type, component } = action
  switch (type) {
    case 'SAVING_ACTIVE_GTFS_ENTITY':
      return update(state, {status: {
        savePending: {$set: true},
        saveSuccessful: {$set: false}
      }})
    case 'REQUESTING_FEED_INFO':
      if (state.feedSourceId && action.feedId !== state.feedSourceId) {
        return defaultState
      }
      return state
    case 'CREATE_GTFS_ENTITY':
      if (component === 'trippattern') {
        entity = {
          isCreating: true,
          name: '',
          id: 'new',
          feedId: action.feedSourceId,
          ...action.props
        }
        routeIndex = state.tables.route.findIndex(r => r.id === action.props.routeId)
        return update(newState || state, {
          tables: {route: {[routeIndex]: {tripPatterns: {$unshift: [entity]}}}},
          active: {
            entity: {tripPatterns: {$unshift: [entity]}}
          }
        })
      } else {
        entity = {
          isCreating: true,
          name: '',
          id: 'new',
          feedId: action.feedSourceId,
          ...action.props
        }
        // if tables's component array is undefined, add it
        if (!state.tables[component]) {
          newState = update(state, {
            tables: {[component]: {$set: []}}
          })
        }
        return update(newState || state, {
          tables: {[component]: {$unshift: [entity]}}
        })
      }
    case 'SETTING_ACTIVE_GTFS_ENTITY':
      const {entityId, feedSourceId, subComponent, subSubComponent, subEntityId, subSubEntityId} = action
      entity = component === 'feedinfo'
        ? clone(state.tables[component])
        : state.tables[component] && action.entityId
        ? clone(state.tables[component].find(e => e.id === action.entityId))
        : null
      const edited = entity && entity.id === 'new'
      switch (subComponent) {
        case 'trippattern':
          subEntity = entity && entity.tripPatterns
            ? clone(entity.tripPatterns.find(p => p.id === action.subEntityId))
            : null
          // if (subEntity) {
          //   subEntity.stops = clone(getStopsForPattern(subEntity, state.tables.stop))
          // }
          break
      }
      const active = {
        feedSourceId,
        entity,
        entityId,
        subEntity,
        subEntityId,
        subSubEntityId,
        component,
        subComponent,
        subSubComponent,
        edited
      }
      return update(state, {
        active: {$set: active}
      })
    case 'RESET_ACTIVE_GTFS_ENTITY':
      switch (component) {
        case 'trippattern':
          patternIndex = state.active.entity.tripPatterns.findIndex(p => p.id === action.entity.id)
          entity = Object.assign({}, state.active.entity.tripPatterns[patternIndex])
          return update(state, {
            active: {
              subEntity: {$set: entity},
              patternEdited: {$set: false}
            }
          })
        case 'feedinfo':
          entity = Object.assign({}, state.tables[component])
          return update(state, {
            active: {
              entity: {$set: entity},
              edited: {$set: false}
            }
          })
        default:
          entity = state.tables[component].find(e => e.id === action.entity.id)
          return update(state, {
            active: {
              entity: {$set: entity},
              edited: {$set: false}
            }
          })
      }
    case 'SAVED_TRIP_PATTERN':
      const patternStops = action.tripPattern.patternStops.map(ps => ({...ps, id: generateUID()}))
      const pattern = {...action.tripPattern, patternStops}
      routeIndex = state.tables.route.findIndex(r => r.id === pattern.routeId)
      patternIndex = state.active.entity.tripPatterns.findIndex(p => p.id === pattern.id)
      stateUpdate = {active: {}}

      // if pattern is active
      if (pattern.id === state.active.subEntityId) {
        stateUpdate = {
          active: {
            subEntity: {$set: pattern},
            patternEdited: {$set: false}
          },
          status: {
            savePending: {$set: false},
            saveSuccessful: {$set: true}
          }
        }
      }
      // if not active, but present in active route
      if (patternIndex !== -1) {
        stateUpdate.tables = {route: {[routeIndex]: {tripPatterns: {[patternIndex]: {$set: pattern}}}}}
        stateUpdate.active.entity = {tripPatterns: {[patternIndex]: {$set: pattern}}}
      } else if (pattern.routeId === state.active.entity.id) {
        // if pattern is brand new
        const patterns = clone(state.active.entity.tripPatterns)
        patterns.push(pattern)
        return update(state, {
          tables: {route: {[routeIndex]: {tripPatterns: {$push: [pattern]}}}},
          active: {entity: {tripPatterns: {$set: patterns}}},
          status: {
            savePending: {$set: false},
            saveSuccessful: {$set: true}
          }
        })
      }
      return update(state, stateUpdate)
    case 'UPDATE_ACTIVE_GTFS_ENTITY':
      switch (component) {
        case 'trippattern':
          patternIndex = state.active.entity.tripPatterns.findIndex(p => p.id === action.entity.id)
          entity = Object.assign({}, state.active.subEntity)
          for (key in action.props) {
            entity[key] = action.props[key]
          }
          stateUpdate = {
            active: {
              subEntity: {$set: entity},
              patternEdited: {$set: true}
            }
          }
          return update(state, stateUpdate)
        default:
          entity = Object.assign({}, state.active.entity)
          for (key in action.props) {
            entity[key] = action.props[key]
          }
          return update(state, {
            active: {
              entity: {$set: entity},
              edited: {$set: true}
            }
          })
      }
    case 'RECEIVE_AGENCIES':
      const agencies = action.agencies.map(agencyToGtfs)
      agencies.sort(gtfsSort)
      agencyIndex = state.active.entity && agencies.findIndex(a => a.id === state.active.entity.id)
      if (agencyIndex !== -1) {
        return update(state, {
          tables: {agency: {$set: agencies}},
          active: {
            entity: {$set: agencies[agencyIndex]},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {agency: {$set: agencies}}
        })
      }
    case 'RECEIVE_FARES':
      const fares = action.fares.map(fareToGtfs)
      fares.sort(gtfsSort)
      fareIndex = state.active.entity && fares.findIndex(f => f.id === state.active.entity.id)
      if (fareIndex !== -1) {
        return update(state, {
          tables: {fare: {$set: fares}},
          active: {
            entity: {$set: fares[fareIndex]},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {fare: {$set: fares}}
        })
      }
    case 'RECEIVE_FEED_INFO':
      const feedInfo = action.feedInfo
      ? {
        // datatools props
        id: action.feedInfo.id,
        color: action.feedInfo.color,
        defaultLat: action.feedInfo.defaultLat,
        defaultLon: action.feedInfo.defaultLon,
        defaultRouteType: action.feedInfo.defaultRouteType,

        // gtfs spec props
        feed_end_date: action.feedInfo.feedEndDate,
        feed_start_date: action.feedInfo.feedStartDate,
        feed_lang: action.feedInfo.feedLang,
        feed_publisher_name: action.feedInfo.feedPublisherName,
        feed_publisher_url: action.feedInfo.feedPublisherUrl,
        feed_version: action.feedInfo.feedVersion
      }
      : {
        // datatools props
        id: null,
        color: null,
        defaultLat: null,
        defaultLon: null,
        defaultRouteType: null,

        // gtfs spec props
        feed_end_date: null,
        feed_start_date: null,
        feed_lang: null,
        feed_publisher_name: null,
        feed_publisher_url: null,
        feed_version: null
      }
      if (state.active.component === 'feedinfo') {
        return update(state, {
          tables: {feedinfo: {$set: feedInfo}},
          active: {
            entity: {$set: feedInfo},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {feedinfo: {$set: feedInfo}}
        })
      }
    case 'RECEIVE_CALENDARS':
      const calendars = action.calendars ? action.calendars.map(calendarToGtfs) : null
      calendars.sort(gtfsSort)
      calendarIndex = state.active.entity && calendars.findIndex(c => c.id === state.active.entity.id)
      if (calendarIndex !== -1) {
        return update(state, {
          tables: {calendar: {$set: calendars}},
          active: {
            entity: {$set: calendars[calendarIndex]},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {calendar: {$set: calendars}}
        })
      }
    case 'RECEIVE_SCHEDULE_EXCEPTIONS':
      const scheduleExceptions = action.scheduleExceptions || [] // no mapping required
      scheduleExceptionIndex = state.active.entity && action.scheduleExceptions.findIndex(se => se.id === state.active.entity.id)
      if (scheduleExceptionIndex !== -1) {
        return update(state, {
          tables: {scheduleexception: {$set: scheduleExceptions}},
          active: {
            entity: {$set: scheduleExceptions[scheduleExceptionIndex]},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {scheduleexception: {$set: scheduleExceptions}}
        })
      }
    case 'RECEIVE_ROUTES':
      const routes = action.routes ? action.routes.map(routeToGtfs) : []
      routes.sort(gtfsSort)
      routeIndex = state.active.entity && routes.findIndex(r => r.id === state.active.entity.id)
      if (routeIndex !== -1) {
        const activeRoute = routes[routeIndex]
        if (state.active.entity && state.active.entity.tripPatterns) {
          activeRoute.tripPatterns = clone(state.active.entity.tripPatterns)
        }
        return update(state, {
          tables: {route: {$set: routes}},
          active: {
            entity: {$set: activeRoute},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {route: {$set: routes}}
        })
      }
    case 'RECEIVE_TRIP_PATTERNS':
      return update(state, {
        tripPatterns: {$set:
          action.tripPatterns.map(pattern => {
            return {
              id: pattern.id,
              name: pattern.name,
              latLngs: pattern.shape ? (pattern.shape.coordinates.map(c => ll.fromCoordinates(c))) : null
            }
          })
        }
      })
    case 'RECEIVE_TRIP_PATTERNS_FOR_ROUTE':
      const tripPatterns = action.tripPatterns
        .sort(defaultSorter)
        .map(tp => {
          if (tp.patternStops) {
            tp.patternStops = tp.patternStops.map(ps => ({...ps, id: generateUID()})) // generate UID for pattern stop keys
          }
          return tp
        })
      routeIndex = state.tables.route.findIndex(r => r.id === action.routeId)
      activePattern = state.active.subEntityId && tripPatterns.find(p => p.id === state.active.subEntityId)
      if (routeIndex === -1) {
        return state
      }
      if (state.active.entity.id === action.routeId) {
        return update(state, {
          tables: {route: {[routeIndex]: {$merge: {tripPatterns}}}},
          active: {
            entity: {$merge: {tripPatterns}},
            subEntity: {$set: Object.assign({}, activePattern)}
          }
        })
      } else {
        return update(state, {
          tables: {route: {[routeIndex]: {$merge: {tripPatterns: tripPatterns}}}}
        })
      }
    case 'RECEIVE_STOPS':
      const stops = action.stops ? action.stops.map(stopToGtfs) : []
      stops.sort(gtfsSort)
      stopIndex = state.active.entity && stops.findIndex(s => s.id === state.active.entity.id)
      if (stopIndex !== -1) {
        return update(state, {
          tables: {stop: {$set: stops}},
          active: {
            entity: {$set: stops[stopIndex]},
            edited: {$set: false}
          }
        })
      } else {
        return update(state, {
          tables: {stop: {$set: stops}}
        })
      }
    case 'DELETING_STOP':
      stopIndex = state.tables.stop.findIndex(s => s.id === action.stop.id)
      return update(state, {
        tables: {stop: {$splice: [[stopIndex, 1]]}}
      })
    case 'RECEIVE_STOP':
      const stop = stopToGtfs(action.stop)
      if (!stop) {
        return state
      }
      stopIndex = state.tables.stop.findIndex(s => s.id === stop.id)

      // TODO: updated sort with stops array

      // if stop is active, update active entity
      if (stop.id === state.active.entityId && stopIndex !== -1) {
        stateUpdate = {
          tables: {stop: {[stopIndex]: {$set: stop}}},
          active: {
            entity: {$set: stop},
            edited: {$set: false}
          }
        }
      } else if (stopIndex === -1) {
        stateUpdate = {
          tables: {stop: {$push: [stop]}}
        }
      } else {
        stateUpdate = {
          tables: {stop: {[stopIndex]: {$set: stop}}}
        }
      }
      return update(state, stateUpdate)
    case 'CLEAR_GTFSEDITOR_CONTENT':
      return defaultState
    case 'RECEIVE_GTFSEDITOR_TABLE':
      newTableData = {}
      const getMappedEntities = (entities) => {
        switch (action.tableId) {
          case 'agency':
            return action.entities.map(agencyToGtfs)
          case 'route':
            return action.entities.map(routeToGtfs)
          case 'stop':
            return action.entities.map(stopToGtfs)
          case 'calendar':
            return action.entities.map(calendarToGtfs)
          case 'fare':
            return action.entities.map(fareToGtfs) // no mapping exists for fares
          default:
            return action.entities
        }
      }
      newTableData[action.tableId] = getMappedEntities(action.entities)
      return update(state, {
        tables: {$merge: newTableData}
      })
    case 'UPDATE_ENTITY_SORT':
      return update(state, {sort: {$merge: action.payload}})
    case 'SET_ACTIVE_PATTERN_STOP':
      return update(state, {active: {patternStop: {$set: action.payload}}})
    default:
      return state
  }
}

export default data
