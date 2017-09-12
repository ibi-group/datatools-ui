import clone from 'lodash.clonedeep'
import { browserHistory } from 'react-router'

import { setErrorMessage } from '../../manager/actions/status'
import { secureFetch } from '../../common/actions'
import { saveFeedInfo } from './feedInfo'
import { saveAgency } from './agency'
import { saveStop } from './stop'
import { saveRoute } from './route'
import { saveFare } from './fare'
import { fetchTripPatternsForRoute, saveTripPattern } from './tripPattern'
// import { fetchTripsForCalendar } from './trip'
import { saveCalendar, saveScheduleException } from './calendar'
import { getGtfsTable, createGtfsEntity } from './editor'
import { componentList, subComponentList, subSubComponentList } from '../util/gtfs'
import { getStopsForPattern, getTimetableColumns } from '../util'

export function updateEditSetting (setting, value, activePattern) {
  return {
    type: 'UPDATE_EDIT_SETTING',
    setting,
    value,
    activePattern
  }
}

export function settingActiveGtfsEntity (feedSourceId, component, entityId, subComponent, subEntityId, subSubComponent, subSubEntityId, activeEntity, activeSubEntity, activeColumns) {
  return {
    type: 'SETTING_ACTIVE_GTFS_ENTITY',
    feedSourceId,
    component,
    entityId,
    subComponent,
    subEntityId,
    subSubComponent,
    subSubEntityId,
    activeEntity,
    activeSubEntity,
    activeColumns
  }
}

export function enterTimetableEditor () {
  return function (dispatch, getState) {
    dispatch(setActiveGtfsEntity(getState().editor.data.active.feedSourceId, 'route', getState().editor.data.tables.route[0].id, 'trippattern', 'new', 'timetable'))
  }
}

export function setActiveGtfsEntity (feedSourceId, component, entityId, subComponent, subEntityId, subSubComponent, subSubEntityId) {
  return function (dispatch, getState) {
    // TODO: figure out a good way to handle route changes without confirm window
    // if (getState().editor.data.active.edited && !window.confirm('You have unsaved changes. Discard changes?')) {
    //   return false
    // }
    const previousFeedSourceId = getState().editor.feedSourceId
    if (previousFeedSourceId && feedSourceId !== previousFeedSourceId) {
      dispatch(clearGtfsContent())
    }
    // stop editing geometry if currently editing
    if (getState().editor.editSettings.editGeometry) {
      dispatch(updateEditSetting('editGeometry', false, null))
    }
    const pathItems = ['feed', feedSourceId, 'edit', component, entityId, subComponent, subEntityId, subSubComponent, subSubEntityId].filter(item => item)
    let url = '/' + pathItems.join('/')
    // console.log(url)
    // ensure component is valid
    if (component && componentList.indexOf(component) === -1) {
      url = `/feed/${feedSourceId}/edit/`
    } else if (subComponent && subComponentList.indexOf(subComponent) === -1) {
      // ensure subComponent is valid
      url = `/feed/${feedSourceId}/edit/${component}/${entityId}/`
    } else if (subSubComponent && subSubComponentList.indexOf(subSubComponent) === -1) {
      // ensure subSubComponent is valid
      url = `/feed/${feedSourceId}/edit/${component}/${entityId}/${subComponent}/${subEntityId}/`
    }
    if (entityId === 'new' && (!getState().editor.data.tables[component] || getState().editor.data.tables[component].findIndex(e => e.id === 'new') === -1)) {
      dispatch(createGtfsEntity(feedSourceId, component))
    }
    if (!getState().routing.locationBeforeTransitions || !getState().routing.locationBeforeTransitions.pathname || getState().routing.locationBeforeTransitions.pathname !== url) {
      browserHistory.push(url)
    }
    const activeEntity = component === 'feedinfo'
      ? clone(getState().editor.data.tables[component])
      : getState().editor.data.tables[component] && entityId
      ? clone(getState().editor.data.tables[component].find(e => e.id === entityId))
      : null
    const activeSubEntity = activeEntity && activeEntity.tripPatterns
      ? clone(activeEntity.tripPatterns.find(p => p.id === subEntityId))
      : null
    const activePatternStops = getStopsForPattern(activeSubEntity, getState().editor.data.tables.stop)
    const activeColumns = getTimetableColumns(activeSubEntity, activePatternStops)
    dispatch(settingActiveGtfsEntity(feedSourceId, component, entityId, subComponent, subEntityId, subSubComponent, subSubEntityId, activeEntity, activeSubEntity, activeColumns))
  }
}

export function savingActiveGtfsEntity (component, entity) {
  return {
    type: 'SAVING_ACTIVE_GTFS_ENTITY',
    component,
    entity
  }
}

export function saveActiveGtfsEntity (component, optionalEntity) {
  return function (dispatch, getState) {
    let entity, feedId
    switch (component) {
      case 'stop':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveStop(feedId, entity))
      case 'route':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveRoute(feedId, entity))
      case 'agency':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveAgency(feedId, entity))
      case 'trippattern':
        // let route = getState().editor.data.active.entity
        // let patternId = getState().editor.data.active.subEntityId
        entity = optionalEntity || getState().editor.data.active.subEntity // route.tripPatterns.find(p => p.id === patternId)
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveTripPattern(feedId, entity))
      case 'calendar':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveCalendar(feedId, entity))
      case 'scheduleexception':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveScheduleException(feedId, entity))
      case 'fare':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.feedId || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveFare(feedId, entity))
      case 'feedinfo':
        entity = optionalEntity || getState().editor.data.active.entity
        feedId = entity.id || getState().editor.data.active.feedSourceId
        dispatch(savingActiveGtfsEntity(component, entity))
        return dispatch(saveFeedInfo(feedId, entity))
      default:
        console.log('no action specified!')
    }
  }
}
export function deletingEntity (feedId, component, entityId) {
  return {
    type: 'DELETING_ENTITY',
    feedId,
    component,
    entityId
  }
}

export function deleteGtfsEntity (feedId, component, entityId, routeId) {
  return function (dispatch, getState) {
    dispatch(deletingEntity(feedId, component, entityId))
    if (entityId === 'new') {
      return dispatch(getGtfsTable(component, feedId))
    }
    var error = false
    const url = `/api/editor/secure/${component}/${entityId}?feedId=${feedId}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => {
        if (res.status >= 300) {
          error = true
        }
        return res.json()
      })
      .then(json => {
        if (error) {
          dispatch(setErrorMessage(`Error deleting ${component}. ${json && json.message ? json.message : ''}`))
          return null
        }
        if (component === 'trippattern' && routeId) {
          dispatch(fetchTripPatternsForRoute(feedId, routeId))
        } else {
          dispatch(getGtfsTable(component, feedId))
        }
      })
  }
}

export function updateActiveGtfsEntity (entity, component, props) {
  return {
    type: 'UPDATE_ACTIVE_GTFS_ENTITY',
    entity,
    component,
    props
  }
}

export function resetActiveGtfsEntity (entity, component) {
  return {
    type: 'RESET_ACTIVE_GTFS_ENTITY',
    entity,
    component
  }
}

export function clearGtfsContent () {
  return {
    type: 'CLEAR_GTFSEDITOR_CONTENT'
  }
}
