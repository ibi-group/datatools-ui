import {secureFetch} from '../../common/actions'
import {isNew, routeFromGtfs} from '../util/objects'
import {updateEditSetting, setActiveGtfsEntity} from './active'

export function savingRoute (feedId, route) {
  return {
    type: 'SAVING_ROUTE',
    feedId,
    route
  }
}

export function receiveRoute (feedId, route) {
  return {
    type: 'RECEIVE_ROUTE',
    feedId,
    route
  }
}

export function saveRoute (feedId, route) {
  return function (dispatch, getState) {
    const method = !isNew(route) ? 'put' : 'post'
    const url = `/api/editor/secure/route${!isNew(route) ? `/${route.id}` : ''}?feedId=${feedId}`
    const data = routeFromGtfs(route)
    return dispatch(secureFetch(url, method, data))
      .then(res => res.json())
      .then(r => {
        return dispatch(fetchRoutes(feedId))
          .then((routes) => {
            if (route.id === 'new') {
              dispatch(setActiveGtfsEntity(feedId, 'route', r.id))
            }
            return r
          })
      })
  }
}

export function deletingRoute (feedId, routeId) {
  return {
    type: 'DELETING_ROUTE',
    feedId,
    routeId
  }
}

export function deleteRoute (feedId, routeId) {
  return function (dispatch, getState) {
    dispatch(deletingRoute(feedId, routeId))
    if (routeId === 'new') {
      return dispatch(fetchRoutes(feedId))
    }
    const url = `/api/editor/secure/route/${routeId}?feedId=${feedId}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => res.json())
      .then(route => {
        dispatch(fetchRoutes(feedId))
      })
  }
}

export function requestingRoutes (feedId) {
  return {
    type: 'REQUESTING_ROUTES',
    feedId
  }
}

export function receiveRoutes (feedId, routes) {
  return {
    type: 'RECEIVE_ROUTES',
    feedId,
    routes
  }
}

export function fetchRoutes (feedId) {
  return function (dispatch, getState) {
    dispatch(requestingRoutes(feedId))
    const url = `/api/editor/secure/route?feedId=${feedId}`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(routes => {
        dispatch(receiveRoutes(feedId, routes))
        // update followStreets value
        // TODO: update value when setting active entity
        if (getState().editor.data.active.entity) {
          const routeIndex = getState().editor.data.active.entity && routes.findIndex(r => r.id === getState().editor.data.active.entity)
          const followStreets = routeIndex !== -1 ? routes[routeIndex].route_type === 3 || routes[routeIndex].route_type === 0 : true
          dispatch(updateEditSetting('followStreets', followStreets))
        }
        return routes
      })
  }
}
