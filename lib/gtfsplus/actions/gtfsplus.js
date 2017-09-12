import JSZip from 'jszip'
import fetch from 'isomorphic-fetch'

import { secureFetch } from '../../common/actions'
import { getConfigProperty } from '../../common/util/config'
// import {stopsAndRoutes, compose} from '../../gtfs/util/graphql'
import { fetchFeedVersions } from '../../manager/actions/versions'
import { getFeedId } from '../../common/util/modules'

// EDIT ACTIVE GTFS+ ACTIONS

export function addGtfsPlusRow (tableId) {
  const table = getConfigProperty('modules.gtfsplus.spec').find(t => t.id === tableId)

  const rowData = {}
  for (const field of table.fields) {
    rowData[field.name] = null
  }

  return {
    type: 'ADD_GTFSPLUS_ROW',
    tableId,
    rowData
  }
}

export function updateGtfsPlusField (tableId, rowIndex, fieldName, newValue) {
  return {
    type: 'UPDATE_GTFSPLUS_FIELD',
    tableId,
    rowIndex,
    fieldName,
    newValue
  }
}

export function deleteGtfsPlusRow (tableId, rowIndex) {
  return {
    type: 'DELETE_GTFSPLUS_ROW',
    tableId,
    rowIndex
  }
}

// DOWNLOAD/RECEIVE DATA ACTIONS

export function requestingGtfsPlusContent () {
  return {
    type: 'REQUESTING_GTFSPLUS_CONTENT'
  }
}

export function clearGtfsPlusContent () {
  return {
    type: 'CLEAR_GTFSPLUS_CONTENT'
  }
}

export function receiveGtfsPlusContent (feedVersionId, filenames, fileContent, timestamp) {
  return {
    type: 'RECEIVE_GTFSPLUS_CONTENT',
    feedVersionId,
    filenames,
    fileContent,
    timestamp
  }
}

export function downloadGtfsPlusFeed (feedVersionId) {
  return function (dispatch, getState) {
    dispatch(requestingGtfsPlusContent())

    const fetchFeed = fetch('/api/manager/secure/gtfsplus/' + feedVersionId, {
      method: 'get',
      cache: 'default',
      headers: { 'Authorization': 'Bearer ' + getState().user.token }
    }).then((response) => {
      if (response.status !== 200) {
        console.log('error downloading gtfs+ feed', response.statusCode)
        dispatch(clearGtfsPlusContent())
      }
      return response.blob()
    })

    const fetchTimestamp = dispatch(secureFetch(`/api/manager/secure/gtfsplus/${feedVersionId}/timestamp`))
    .then(response => response.json())

    Promise.all([fetchFeed, fetchTimestamp]).then(([feed, timestamp]) => {
      JSZip.loadAsync(feed).then((zip) => {
        const filenames = []
        const filePromises = []
        zip.forEach((path, file) => {
          filenames.push(path)
          filePromises.push(file.async('string'))
        })
        Promise.all(filePromises).then(fileContent => {
          const cleanFileContent = fileContent.map(cleanString)
          dispatch(receiveGtfsPlusContent(feedVersionId, filenames, cleanFileContent, timestamp))
          dispatch(validateGtfsPlusFeed(feedVersionId))
        })
      })
    })
  }
}

// clean BOM from string https://en.wikipedia.org/wiki/Byte_order_mark
function cleanString (string) {
  if (string.charCodeAt(0) === 0xFEFF) {
    string = string.slice(1)
  }
  return string
}
// VALIDATION ACTIONS

export function validatingGtfsPlusFeed () {
  return {
    type: 'VALIDATING_GTFSPLUS_FEED'
  }
}

export function receiveGtfsPlusValidation (validationIssues) {
  return {
    type: 'RECEIVE_GTFSPLUS_VALIDATION',
    validationIssues
  }
}

export function validateGtfsPlusFeed (feedVersionId) {
  return function (dispatch, getState) {
    dispatch(validatingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}/validation`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(validationIssues => dispatch(receiveGtfsPlusValidation(validationIssues)))
  }
}

// UPLOAD ACTIONS

export function uploadingGtfsPlusFeed (feedVersionId, file) {
  return {
    type: 'UPLOADING_GTFSPLUS_FEED',
    feedVersionId,
    file
  }
}

export function uploadedGtfsPlusFeed (feedVersionId, file) {
  return {
    type: 'UPLOADED_GTFSPLUS_FEED',
    feedVersionId,
    file
  }
}

export function uploadGtfsPlusFeed (feedVersionId, file) {
  return function (dispatch, getState) {
    dispatch(uploadingGtfsPlusFeed(feedVersionId, file))
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}`
    var data = new window.FormData()
    data.append('file', file)

    return fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + getState().user.token },
      body: data
    }).then(result => {
      console.log(result)
      return dispatch(uploadedGtfsPlusFeed(feedVersionId, file))
    })
  }
}

// GTFS ENTITY LOOKUP ACTIONS

export function receiveGtfsEntities (gtfsEntities) {
  return {
    type: 'RECEIVE_GTFS_PLUS_ENTITIES',
    gtfsEntities
  }
}

export function loadGtfsEntities (tableId, rows, feedSource) {
  return function (dispatch, getState) {
    // lookup table for mapping tableId:fieldName keys to inputType values
    const typeLookup = {}
    const getDataType = function (tableId, fieldName) {
      const lookupKey = tableId + ':' + fieldName
      if (lookupKey in typeLookup) return typeLookup[lookupKey]
      const fieldInfo = getConfigProperty('modules.gtfsplus.spec')
        .find(t => t.id === tableId).fields.find(f => f.name === fieldName)
      if (!fieldInfo) return null
      typeLookup[lookupKey] = fieldInfo.inputType
      return fieldInfo.inputType
    }

    // determine which routes, stops, etc. aren't currently in the gtfsEntityLookup table and need to be loaded from the API
    const routesToLoad = []
    const stopsToLoad = []

    const currentLookup = getState().gtfsplus.gtfsEntityLookup

    for (const rowData of rows) {
      for (const fieldName in rowData) {
        switch (getDataType(tableId, fieldName)) {
          case 'GTFS_ROUTE':
            const routeId = rowData[fieldName]
            if (routeId && !(`route_${routeId}` in currentLookup)) routesToLoad.push(routeId)
            break
          case 'GTFS_STOP':
            const stopId = rowData[fieldName]
            if (stopId && !(`stop_${stopId}` in currentLookup)) stopsToLoad.push(stopId)
            break
        }
      }
    }
    // TODO: replace multiple fetches with GraphQL
    // fetch(compose(stopsAndRoutes(feedId, routesToLoad, stopsToLoad), {feedId, routeId: routesToLoad, stopId: stopsToLoad}))
    //   .then((response) => response.json())
    //   .then(results => {
    //     return dispatch(receivedStopsAndRoutes(results))
    //   })

    if (routesToLoad.length === 0 && stopsToLoad.length === 0) return
    const feedId = getFeedId(feedSource)
    var loadRoutes = Promise.all(routesToLoad.map(routeId => {
      const url = `/api/manager/routes/${routeId}?feed=${feedId}`
      return fetch(url)
      .then((response) => response.json())
    }))

    var loadStops = Promise.all(stopsToLoad.map(stopId => {
      const url = `/api/manager/stops/${stopId}?feed=${feedId}`
      return fetch(url)
      .then((response) => response.json())
    }))

    Promise.all([loadRoutes, loadStops]).then(results => {
      const loadedRoutes = results[0]
      const loadedStops = results[1]
      dispatch(receiveGtfsEntities(loadedRoutes.concat(loadedStops)))
    })
  }
}

// const receivedStopsAndRoutes = (results, module) => {
//   return {
//     type: 'RECEIVED_GTFSPLUS_STOPS_AND_ROUTES',
//     results,
//     module
//   }
// }

// PUBLISH ACTIONS

export function publishingGtfsPlusFeed () {
  return {
    type: 'PUBLISHING_GTFSPLUS_FEED'
  }
}

export function publishGtfsPlusFeed (feedVersion) {
  return function (dispatch, getState) {
    dispatch(publishingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersion.id}/publish`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => res.json())
      .then(json => dispatch(fetchFeedVersions(feedVersion.feedSource)))
  }
}
