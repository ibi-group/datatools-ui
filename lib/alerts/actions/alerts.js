import { browserHistory } from 'react-router'
import fetch from 'isomorphic-fetch'
import { fetchStopsAndRoutes } from '../../gtfs/actions/general'

import { secureFetch } from '../../common/actions'
import { getAlertsUrl, getFeedId } from '../../common/util/modules'
import { setErrorMessage } from '../../manager/actions/status'
import {getActiveProject} from '../../manager/selectors'

// alerts management action

let nextAlertId = 0
let nextStopEntityId = 100

export function createAlert (entity, agency) {
  return function (dispatch, getState) {
    nextAlertId--
    const entities = []

    if (entity) {
      nextStopEntityId++
      const type = typeof entity.stop_id !== 'undefined' ? 'STOP' : 'ROUTE'
      const newEntity = {
        id: nextStopEntityId,
        type: type
      }

      if (agency !== null) {
        newEntity.agency = agency
      }

      const typeKey = type.toLowerCase()
      newEntity[typeKey] = entity
      entities.push(newEntity)
    }

    const alert = {
      id: nextAlertId,
      title: '', // 'New Alert',
      affectedEntities: entities,
      published: false
    }
    dispatch(updateActiveAlert(alert))

    if (window.location.pathname !== '/alerts/new') {
      browserHistory.push('/alerts/new')
    }
  }
}

export function deleteAlert (alert) {
  return function (dispatch, getState) {
    console.log('deleting', alert)
    const user = getState().user
    const url = getAlertsUrl() + '/' + alert.id
    const method = 'delete'
    console.log('url/method', url, method)
    fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + user.token
      }
    }).then((res) => {
      if (res.status >= 300) {
        dispatch(setErrorMessage('Failed to delete alert!'))
        return
      }
      browserHistory.push('/alerts')
      dispatch(fetchRtdAlerts())
    }).catch(e => {
      console.log(e)
    })
  }
}

export const requestRtdAlerts = () => {
  return {
    type: 'REQUEST_RTD_ALERTS'
  }
}

export const receivedRtdAlerts = (rtdAlerts, activeProject) => {
  return {
    type: 'RECEIVED_RTD_ALERTS',
    rtdAlerts,
    activeProject
  }
}

export function setActiveAlert (alertId) {
  return function (dispatch, getState) {
    const alert = getState().alerts.all.find(a => a.id === alertId)
    dispatch(updateActiveAlert(alert))
  }
}

export function fetchRtdAlerts () {
  return function (dispatch, getState) {
    dispatch(requestRtdAlerts())
    return dispatch(secureFetch(getAlertsUrl()))
      .then((res) => {
        if (!res || res.status >= 400) {
          dispatch(setErrorMessage('Error fetching alerts!'))
          return []
        }
        return res.json()
      })
      .then((alerts) => {
        return dispatch(receivedRtdAlerts(alerts, getActiveProject(getState())))
      })
      .then(() => {
        return dispatch(fetchStopsAndRoutes(getState().alerts.entities, 'ALERTS'))
      })
  }
}

export const updateActiveAlert = (alert) => {
  return {
    type: 'UPDATE_ACTIVE_ALERT_ALERT',
    alert
  }
}

export function editAlert (alert) {
  return function (dispatch, getState) {
    dispatch(updateActiveAlert(alert))
    browserHistory.push(`/alerts/alert/${alert.id}`)
  }
}

export function fetchEntity (entity, activeProject) {
  const feed = activeProject.feedSources.find(f => getFeedId(f) === entity.entity.AgencyId)
  const feedId = getFeedId(feed)
  const url = entity.type === 'stop' ? `/api/manager/stops/${entity.entity.StopId}?feed=${feedId}` : `/api/manager/routes/${entity.entity.RouteId}?feed=${feedId}`
  return fetch(url)
  .then((response) => {
    return response.json()
  })
  .then((object) => {
    return object
  }).catch((error) => {
    console.log('caught', error)
  })
}

export function saveAlert (alert) {
  return function (dispatch, getState) {
    console.log('saving...')
    var json = {
      Id: alert.id < 0 ? null : alert.id,
      HeaderText: alert.title || 'New Alert',
      DescriptionText: alert.description || '',
      Url: alert.url || '',
      Cause: alert.cause || 'UNKNOWN_CAUSE',
      Effect: alert.effect || 'UNKNOWN_EFFECT',
      Published: alert.published ? 'Yes' : 'No',
      StartDateTime: alert.start / 1000 || 0,
      EndDateTime: alert.end / 1000 || 0,
      ServiceAlertEntities: alert.affectedEntities.map((entity) => {
        return {
          Id: entity.id,
          AlertId: alert.id,
          AgencyId: entity.agency ? getFeedId(entity.agency) : null,
          RouteId: entity.route ? entity.route.route_id : null,
          RouteShortName: entity.route ? entity.route.route_short_name : null,
          RouteType: entity.mode ? entity.mode.gtfsType : null,
          StopId: entity.stop ? entity.stop.stop_id : null,
          StopCode: entity.stop ? entity.stop.stop_code : null,
          TripId: null,
          ServiceAlertTrips: []
        }
      })
    }
    console.log('saving', alert.id, json)
    const url = getAlertsUrl() + (alert.id < 0 ? '' : '/' + alert.id)
    const method = alert.id < 0 ? 'post' : 'put'
    console.log('url/method', url, method)
    return dispatch(secureFetch(url, method, json))
    .then((res) => res.json())
    .then(json => {
      console.log(json)
      browserHistory.push('/alerts')
      dispatch(fetchRtdAlerts())
    })
    .catch(e => {
      console.log(e)
    })
  }
}
