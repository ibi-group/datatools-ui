import fetch from 'isomorphic-fetch'

import { clearStops } from './stops'
import { clearPatterns } from './patterns'
import { clearRoutes } from './routes'
import { stopsAndRoutes, compose, patternsAndStopsForBoundingBox } from '../util/graphql'
import { getFeedId } from '../../common/util/modules'
import {getActiveProject} from '../../manager/selectors'

export function clearGtfsElements () {
  return function (dispatch, getState) {
    dispatch(clearRoutes())
    dispatch(clearStops())
    dispatch(clearPatterns())
  }
}

function requestGtfsElements (feedIds, entities) {
  return {
    type: 'REQUESTING_GTFS_ELEMENTS',
    feedIds,
    entities
  }
}

function receivedGtfsElements (feedIds, stops, patterns) {
  return {
    type: 'RECEIVED_GTFS_ELEMENTS',
    feedIds,
    stops,
    patterns
  }
}

export const requestStopsAndRoutes = (feedIds, routeids, stopIds, module) => {
  return {
    type: 'REQUEST_GTFS_STOPS_AND_ROUTES',
    feedIds,
    routeids,
    stopIds,
    module
  }
}

export const receivedStopsAndRoutes = (results, module) => {
  return {
    type: 'RECEIVED_GTFS_STOPS_AND_ROUTES',
    results,
    module
  }
}

export function fetchStopsAndRoutes (entities, module) {
  return function (dispatch, getState) {
    const activeProject = getActiveProject(getState())
    const feedId = []
    const routeId = []
    const stopId = []
    // map entities to entity IDs requested
    entities.map(e => {
      const feed = activeProject.feedSources.find(f => {
        return getFeedId(f) === e.entity.AgencyId
      })
      const id = getFeedId(feed)
      if (feedId.indexOf(id) === -1) {
        feedId.push(id)
      }
      if (routeId.indexOf(e.entity.RouteId) === -1) {
        routeId.push(e.entity.RouteId)
      }
      if (stopId.indexOf(e.entity.StopId) === -1) {
        stopId.push(e.entity.StopId)
      }
    })
    const method = 'post'
    const body = JSON.stringify({
      query: stopsAndRoutes(feedId, routeId, stopId),
      variables: JSON.stringify({feedId, routeId, stopId})
    })
    dispatch(requestStopsAndRoutes(feedId, routeId, stopId, module))
    return fetch(`/api/manager/graphql`, {method, body})
      .then(response => response.json())
      .then(results => dispatch(receivedStopsAndRoutes(results, module)))
  }
}

export function refreshGtfsElements (feedId, entities) {
  return function (dispatch, getState) {
    dispatch(requestGtfsElements(feedId, entities))
    const bounds = getState().gtfs.filter.map.bounds
    // if (!bounds) return
    const maxLat = bounds.getNorth()
    const maxLon = bounds.getEast()
    const minLat = bounds.getSouth()
    const minLon = bounds.getWest()
    const vars = {
      feedId,
      max_lat: maxLat,
      max_lon: maxLon,
      min_lat: minLat,
      min_lon: minLon
    }
    return fetch(compose(patternsAndStopsForBoundingBox(feedId, entities, maxLat, maxLon, minLat, minLon), vars))
      .then((response) => {
        return response.json()
      })
      .then(results => {
        return dispatch(receivedGtfsElements(feedId, results.stops, results.patterns))
      })
  }
}
