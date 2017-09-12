import { browserHistory } from 'react-router'
import fetch from 'isomorphic-fetch'

import { getSignConfigUrl, getDisplaysUrl, getFeedId } from '../../common/util/modules'
import { secureFetch } from '../../common/actions'
import { fetchStopsAndRoutes } from '../../gtfs/actions/general'
import {getActiveProject} from '../../manager/selectors'

// signs management action

let nextSignId = 0
let nextStopEntityId = 100

export function createSign (entity, agency) {
  return function (dispatch, getState) {
    nextSignId--
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

    const sign = {
      id: nextSignId,
      title: '', // 'New Configuration',
      affectedEntities: entities,
      published: false,
      displays: []
    }
    browserHistory.push('/signs/new')
    dispatch(updateActiveSign(sign))
  }
}

export function deleteSign (sign) {
  return function (dispatch, getState) {
    console.log('deleting', sign)
    const user = getState().user
    const url = getSignConfigUrl() + '/' + sign.id
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
      console.log('status=' + res.status)
      return res.json()
    }).then(json => {
      console.log(json)
      const saveDisplays = []
      const newSignId = null
      if (sign.displays) {
        sign.displays.map(display => {
          display.DraftDisplayConfigurationId = newSignId
          saveDisplays.push(saveDisplay(display, user))
        })
      }
      return Promise.all(saveDisplays).then((results) => {
        // console.log(results)
        browserHistory.push('/signs')
        dispatch(fetchRtdSigns())
      })
    })
  }
}

export const requestRtdSigns = () => {
  return {
    type: 'REQUEST_RTD_SIGNS'
  }
}

export const requestGtfsEntities = (feedIds, routeids, stopIds) => {
  return {
    type: 'REQUEST_SIGN_GTFS_ENTITIES',
    feedIds,
    routeids,
    stopIds
  }
}

export const receivedGtfsEntities = (gtfsObjects, gtfsSigns) => {
  return {
    type: 'RECEIVED_SIGN_GTFS_ENTITIES',
    gtfsObjects,
    gtfsSigns
  }
}

export const receivedRtdSigns = (rtdSigns, activeProject) => {
  return {
    type: 'RECEIVED_RTD_SIGNS',
    rtdSigns,
    activeProject
  }
}

export const receivedRtdDisplays = (rtdDisplays, activeProject) => {
  return {
    type: 'RECEIVED_RTD_DISPLAYS',
    rtdDisplays,
    activeProject
  }
}

export function setActiveSign (signId) {
  return function (dispatch, getState) {
    const sign = getState().signs.all.find(a => a.id === signId)
    dispatch(updateActiveSign(sign))
  }
}

export function fetchRtdDisplays () {
  return function (dispatch, getState) {
    return fetch(getDisplaysUrl())
    .then((res) => res.json())
    .then((displays) => {
      dispatch(receivedRtdDisplays(displays, getActiveProject(getState())))
    })
    // .catch(error => console.log(error))
  }
}

export function fetchRtdSigns () {
  return function (dispatch, getState) {
    dispatch(requestRtdSigns())
    return fetch(getSignConfigUrl()).then((res) => {
      return res.json()
    }).then((signs) => {
      dispatch(receivedRtdSigns(signs, getActiveProject(getState())))
      dispatch(fetchRtdDisplays())
    }).then(() => {
      return dispatch(fetchStopsAndRoutes(getState().signs.entities, 'SIGNS'))
    })
  }
}

export const updateActiveSign = (sign) => {
  return {
    type: 'UPDATE_ACTIVE_SIGN',
    sign
  }
}

export function editSign (sign) {
  return function (dispatch, getState) {
    dispatch(updateActiveSign(sign))
    browserHistory.push('/signs/sign/' + sign.id)
  }
}

export const createDisplay = (name) => {
  return function (dispatch, getState) {
    console.log('creating display', name)
    const display = {
      Id: -1,
      DisplayTitle: name,
      PrimaryCptAgencyId: null,
      StopPublicId: null,
      PublishedDisplayConfigurationId: null,
      DraftDisplayConfigurationId: null,
      LocationDescription: '',
      DisplayLatitude: null,
      DisplayLongitude: null,
      ContactEmailList: null,
      DisplayStatus: 'Inactive'
    }
    return saveDisplay(display, getState().user)
  }
}

export function saveDisplay (display, user) {
  return function (dispatch, getState) {
    const url = display.Id < 0 ? getDisplaysUrl() : getDisplaysUrl() + '/' + display.Id
    console.log(url)
    const method = display.Id < 0 ? 'post' : 'put'
    return fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + user.token
      },
      body: JSON.stringify(display)
    }).then((res) => {
      console.log('status=' + res.status)
    }).catch(error => console.log(error))
  }
}

function signEntityToRtd (entity, sign) {
  return entity.route
    ? entity.route.map(r => {
      return {
        Id: entity.id,
        DisplayConfigurationId: sign.id,
        AgencyId: entity.agency ? getFeedId(entity.agency) : null,
        RouteId: r ? r.route_id : null,
        StopId: entity.stop ? entity.stop.stop_id : null
      }
    })
    : []
}

export function saveSign (sign) {
  return function (dispatch, getState) {
    const user = getState().user
    const detailsArray = sign.affectedEntities.map(entity => signEntityToRtd(entity, sign))

    // flatten display config details array
    const details = [].concat.apply([], detailsArray)
    const json = {
      Id: sign.id < 0 ? null : sign.id,
      ConfigurationDescription: sign.title || 'New Configuration',
      DraftDisplayConfigurationStatus: sign.published ? 'Published' : 'Unpublished',
      DisplayConfigurationDetails: details
    }
    const url = getSignConfigUrl() + (sign.id < 0 ? '' : '/' + sign.id)
    const method = sign.id < 0 ? 'post' : 'put'
    dispatch(secureFetch(url, method, json))
      .then(res => res.json())
      .then(json => {
        const saveDisplays = []
        const newSignId = json.SequenceId ? json.SequenceId : sign.id
        if (sign.displays) {
          sign.displays.map(display => {
            if (display.DraftDisplayConfigurationId === sign.id) {
              display.DraftDisplayConfigurationId = newSignId
            }
            if (display.PublishedDisplayConfigurationId === sign.id) {
              display.PublishedDisplayConfigurationId = newSignId
            }
            saveDisplays.push(saveDisplay(display, user))
          })
        }
        return Promise.all(saveDisplays).then((results) => {
          browserHistory.push('/signs')
          dispatch(fetchRtdSigns())
        })
      })
      .catch(error => console.log(error))
  }
}
