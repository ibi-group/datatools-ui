import fetch from 'isomorphic-fetch'
import {createAction} from 'redux-actions'

import { secureFetch, generateUID, generateRandomInt, generateRandomColor, idealTextColor } from '../../common/util/util'
import { fetchFeedInfo } from './feedInfo'
import { fetchAgencies } from './agency'
import { fetchTripsForCalendar } from './trip'
import { fetchStops } from './stop'
import { fetchRoutes } from './route'
import { fetchFares } from './fare'
import { fetchTripPatternsForRoute } from './tripPattern'
import { fetchCalendars, fetchScheduleExceptions } from './calendar'
import { saveActiveGtfsEntity, setActiveGtfsEntity } from './active'
import { componentList, findEntityByGtfsId } from '../util/gtfs'

export function createGtfsEntity (feedSourceId, component, props) {
  return {
    type: 'CREATE_GTFS_ENTITY',
    feedSourceId,
    component,
    props
  }
}

export function cloneGtfsEntity (feedSourceId, component, entityId, save) {
  return function (dispatch, getState) {
    if (entityId === 'new') {
      return null
    }
    let props
    switch (component) {
      case 'trippattern':
        props = {...getState().editor.data.active.entity.tripPatterns.find(tp => tp.id === entityId)}
        props.name = props.name + ' copy'
        break
      default:
        props = {...getState().editor.data.tables[component].find(e => e.id === entityId)}
        break
    }
    props.id = 'new'
    dispatch(newGtfsEntity(feedSourceId, component, props, save))
  }
}

export function newGtfsEntities (feedSourceId, component, propsArray, save) {
  return function (dispatch, getState) {
    Promise.all(propsArray.map(props => {
      return dispatch(newGtfsEntity(feedSourceId, component, props, save))
    })).then(results => {
      return results
    })
  }
}

const generateProps = (component, editorState) => {
  const agency = editorState.data.tables.agency ? editorState.data.tables.agency[0] : null
  const color = generateRandomColor()
  switch (component) {
    case 'route':
      return {
        route_id: generateUID(),
        agency_id: agency ? agency.id : null,
        route_short_name: generateRandomInt(1, 300),
        route_long_name: null,
        route_color: color,
        route_text_color: idealTextColor(color),
        publiclyVisible: false,
        status: 'IN_PROGRESS',
        route_type: editorState.data.tables.feedinfo && editorState.data.tables.feedinfo.defaultRouteType !== null ? editorState.data.tables.feedinfo.defaultRouteType : 3
      }
    case 'stop':
      const stopId = generateUID()
      return {
        stop_id: stopId,
        stop_name: null,
        stop_lat: 0,
        stop_lon: 0
      }
    case 'scheduleexception':
      return {
        dates: []
      }
    case 'trippattern':
      return {
        // patternStops: [],
      }
  }
}

export function newGtfsEntity (feedSourceId, component, props, save) {
  return function (dispatch, getState) {
    if (!props) {
      props = generateProps(component, getState().editor)
    }
    if (save) {
      return dispatch(saveActiveGtfsEntity(component, props))
    } else {
      dispatch(createGtfsEntity(feedSourceId, component, props))
      if (props && 'routeId' in props) {
        // console.log('setting after create')
        dispatch(setActiveGtfsEntity(feedSourceId, 'route', props.routeId, component, 'new'))
      } else {
        console.log('setting after create', feedSourceId, component, 'new')
        dispatch(setActiveGtfsEntity(feedSourceId, component, 'new'))
      }
    }
  }
}

// GENERIC TABLE ACTIONS

export function receiveGtfsTable (tableId, entities) {
  return {
    type: 'RECEIVE_GTFSEDITOR_TABLE',
    tableId,
    entities
  }
}

export function getGtfsTable (tableId, feedId) {
  return function (dispatch, getState) {
    switch (tableId) {
      case 'stop':
        return dispatch(fetchStops(feedId))
      case 'route':
        return dispatch(fetchRoutes(feedId))
      case 'agency':
        return dispatch(fetchAgencies(feedId))
      case 'calendar':
        return dispatch(fetchCalendars(feedId))
      case 'fare':
        return dispatch(fetchFares(feedId))
      case 'scheduleexception':
        return dispatch(fetchScheduleExceptions(feedId))
      case 'feedinfo':
        return dispatch(fetchFeedInfo(feedId))
      default:
        const url = `/api/editor/secure/${tableId}?feedId=${feedId}`
        return dispatch(secureFetch(url))
          .then(res => res.json())
          .then(entities => {
            console.log('got editor result', entities)
            dispatch(receiveGtfsTable(tableId, entities))
            return entities
          })
    }
  }
}

export function uploadBrandingAsset (feedId, entityId, component, file) {
  return function (dispatch, getState) {
    if (!file) return null
    var data = new window.FormData()
    data.append('file', file)
    const url = `/api/editor/secure/${component}/${entityId}/uploadbranding?feedId=${feedId}`
    return fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + getState().user.token },
      body: data
    }).then(res => res.json())
      .then(r => {
        return dispatch(getGtfsTable(component, feedId))
      })
  }
}

export function fetchBaseGtfs (feedId) {
  return function (dispatch, getState) {
    const tablesToFetch = ['calendar', 'agency', 'route', 'stop']
    dispatch(fetchFeedInfo(feedId))
    for (var i = 0; i < tablesToFetch.length; i++) {
      dispatch(getGtfsTable(tablesToFetch[i], feedId))
    }
  }
}

export function fetchActiveTable (activeTable, newId, activeEntityId, feedSourceId, subComponent, subEntityId, subSubComponent, activeSubSubEntity) {
  return function (dispatch, getState) {
    if (componentList.indexOf(activeTable) !== -1) {
      dispatch(getGtfsTable(activeTable, feedSourceId))
      // FETCH trip patterns if route selected
      .then((entities) => {
        if (activeEntityId === 'new') {
          dispatch(newGtfsEntity(feedSourceId, activeTable))
        } else if (activeEntityId && entities.findIndex(e => e.id === activeEntityId) === -1) {
          console.log('could not find ID... trying to map to GTFS ID')
          // Attempt to match against gtfsRouteId / gtfsStopId / gtfsAgencyId / etc.
          newId = findEntityByGtfsId(activeTable, activeEntityId, entities)
          if (newId === -1) {
            console.log('bad entity id, going back to ' + activeTable)
            return dispatch(setActiveGtfsEntity(feedSourceId, activeTable))
          }
        }
        dispatch(setActiveGtfsEntity(feedSourceId, activeTable, newId, subComponent, subEntityId, subSubComponent, activeSubSubEntity))
        if (activeTable === 'route' && newId) {
          dispatch(fetchTripPatternsForRoute(feedSourceId, newId))
          .then((tripPatterns) => {
            const pattern = tripPatterns && tripPatterns.find(p => p.id === subEntityId)
            if (subSubComponent === 'timetable' && activeSubSubEntity) {
              dispatch(fetchTripsForCalendar(feedSourceId, pattern, activeSubSubEntity))
            }
          })
        }
      })
    } else {
      dispatch(setActiveGtfsEntity(feedSourceId))
    }
  }
}

export const updateEntitySort = createAction('UPDATE_ENTITY_SORT')
