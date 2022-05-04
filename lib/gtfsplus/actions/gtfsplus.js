// @flow

import JSZip from 'jszip'
import fetch from 'isomorphic-fetch'
import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, fetchGraphQL, secureFetch} from '../../common/actions'
import {uploadFile} from '../../common/util/upload-file'
import {stopsAndRoutes} from '../../gtfs/util/graphql'
import {getHeaders} from '../../common/util/util'
import {VISIBILITY} from '../components/GtfsPlusTable'
import {startJobMonitor} from '../../manager/actions/status'
import type {
  FeedVersion,
  FeedVersionSummary,
  GtfsRoute,
  GtfsStop,
  GtfsPlusValidation,
  GtfsPlusValidationIssue
} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

type GTFSPlusEntity = {
  origRowIndex: number,
  route_id?: string,
  rowIndex: number,
  stop_id?: string,
  [string]: ?(number | string)
}

export const addGtfsPlusRow = createAction(
  'ADD_GTFSPLUS_ROW',
  (payload: { tableId: string }) => payload
)
export const clearGtfsPlusContent = createVoidPayloadAction(
  'CLEAR_GTFSPLUS_CONTENT'
)
export const deleteGtfsPlusRow = createAction(
  'DELETE_GTFSPLUS_ROW',
  (payload: { rowIndex: number, tableId: string }) => payload
)
export const publishingGtfsPlusFeed = createVoidPayloadAction(
  'PUBLISHING_GTFSPLUS_FEED'
)
export const receiveGtfsEntities = createAction(
  'RECEIVE_GTFS_PLUS_ENTITIES',
  (payload: {feed: {routes?: Array<GtfsRoute>, stops?: Array<GtfsStop>}}) => payload
)
export const receiveGtfsPlusContent = createAction(
  'RECEIVE_GTFSPLUS_CONTENT',
  (payload: {
    feedVersionId: null | string,
    fileContent: Array<string>,
    filenames: Array<string>,
    timestamp: number
  }) => payload
)
export const receiveGtfsPlusValidation = createAction(
  'RECEIVE_GTFSPLUS_VALIDATION',
  (payload: Array<GtfsPlusValidationIssue>) => payload
)
export const requestingGtfsPlusContent = createVoidPayloadAction(
  'REQUESTING_GTFSPLUS_CONTENT'
)
export const setActiveTable = createAction(
  'SET_ACTIVE_GTFSPLUS_TABLE',
  (payload: { activeTableId: string }) => payload
)
export const setCurrentPage = createAction(
  'SET_CURRENT_GTFSPLUS_PAGE',
  (payload: { newPage: number }) => payload
)
export const setVisibilityFilter = createAction(
  'SET_GTFSPLUS_VISIBILITY',
  (payload: { visibility: $Values<typeof VISIBILITY> }) => payload
)
export const updateGtfsPlusField = createAction(
  'UPDATE_GTFSPLUS_FIELD',
  (payload: {
    fieldName: string,
    newValue: string,
    rowIndex: number,
    tableId: string
  }) => payload
)
export const uploadedGtfsPlusFeed = createVoidPayloadAction(
  'UPLOADED_GTFSPLUS_FEED'
)
export const uploadingGtfsPlusFeed = createVoidPayloadAction(
  'UPLOADING_GTFSPLUS_FEED'
)
export const validatingGtfsPlusFeed = createVoidPayloadAction(
  'VALIDATING_GTFSPLUS_FEED'
)

export type GtfsPlusActions = ActionType<typeof addGtfsPlusRow> |
  ActionType<typeof clearGtfsPlusContent> |
  ActionType<typeof deleteGtfsPlusRow> |
  ActionType<typeof publishingGtfsPlusFeed> |
  ActionType<typeof receiveGtfsEntities> |
  ActionType<typeof receiveGtfsPlusContent> |
  ActionType<typeof receiveGtfsPlusValidation> |
  ActionType<typeof requestingGtfsPlusContent> |
  ActionType<typeof setActiveTable> |
  ActionType<typeof setCurrentPage> |
  ActionType<typeof setVisibilityFilter> |
  ActionType<typeof updateGtfsPlusField> |
  ActionType<typeof uploadedGtfsPlusFeed> |
  ActionType<typeof uploadingGtfsPlusFeed> |
  ActionType<typeof validatingGtfsPlusFeed>

export function downloadGtfsPlusFeed (feedVersionId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingGtfsPlusContent())

    const {user} = getState()
    if (!user.token) {
      console.warn('user not logged in, unable to download GtfsPlus Feed')
      return
    }
    const fetchFeed = fetch('/api/manager/secure/gtfsplus/' + feedVersionId, {
      method: 'get',
      cache: 'default',
      headers: getHeaders(user.token, false)
    }).then((response) => {
      if (response.status !== 200) {
        console.log('error downloading gtfs+ feed', response.status)
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
          dispatch(receiveGtfsPlusContent({
            feedVersionId,
            fileContent: cleanFileContent,
            filenames,
            timestamp
          }))
          dispatch(validateGtfsPlusFeed(feedVersionId))
        })
      })
    })
  }
}

// clean BOM from string https://en.wikipedia.org/wiki/Byte_order_mark
function cleanString (string): string {
  if (string.charCodeAt(0) === 0xFEFF) {
    string = string.slice(1)
  }
  return string
}

// VALIDATION ACTIONS
export function validateGtfsPlusFeed (feedVersionId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(validatingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}/validation`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(validation => dispatch(receiveGtfsPlusValidation(validation)))
  }
}

// DELETE
export function deleteGtfsPlusFeed (feedVersionId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => res.json())
      // Re-fetch GTFS+ data
      .then(validation => dispatch(downloadGtfsPlusFeed(feedVersionId)))
  }
}

// UPLOAD ACTIONS
export function uploadGtfsPlusFeed (feedVersionId: string, file: File) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(uploadingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersionId}`

    const {user} = getState()
    if (!user.token) {
      console.warn('user not logged in, unable to upload GtfsPlus Feed')
      return
    }
    return uploadFile({file, url, token: user.token})
      .then(result => dispatch(uploadedGtfsPlusFeed()))
  }
}

export function loadGtfsEntities (
  tableId: string,
  rows: Array<GTFSPlusEntity>,
  feedVersionSummary: FeedVersionSummary,
  validation: GtfsPlusValidation
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const tableIssues = validation[tableId]
    // Filter out any rows that have missing identifiers. We don't want to include
    // these in the subsequent GraphQL query.
    const filteredRows = tableIssues
      ? rows.filter(row => {
        if (row.stop_id) {
          const missingIdIssue = tableIssues.find(issue =>
            issue.fieldName === 'stop_id' && issue.rowIndex === row.origRowIndex)
          if (missingIdIssue) return null
        }
        if (row.route_id) {
          const missingIdIssue = tableIssues.find(issue =>
            issue.fieldName === 'route_id' && issue.rowIndex === row.origRowIndex)
          if (missingIdIssue) return null
        }
        return row
      })
      : rows
    const {namespace} = feedVersionSummary
    const {routesToLoad, stopsToLoad} = lookupMissingEntities(filteredRows, getState().gtfsplus.gtfsEntityLookup)
    if (routesToLoad.length === 0 && stopsToLoad.length === 0) {
      return
    }
    dispatch(fetchGraphQL({
      query: stopsAndRoutes(namespace, routesToLoad.length > 0 ? routesToLoad : null, stopsToLoad.length > 0 ? stopsToLoad : null),
      variables: {namespace, routeId: routesToLoad, stopId: stopsToLoad}
    }))
      .then(results => dispatch(receiveGtfsEntities(results)))
  }
}

/**
 * Given a set of GTFS+ rows, determine (from the current state's lookup) if the
 * rows contain references to GTFS routes or stops that have not yet been fetched
 * from the GraphQL GTFS API and return the list of unfetched/missing stops and
 * routes. NOTE: only a single feed version is considered at once, so there is
 * no need to scope the route/stop IDs by feed.
 */
function lookupMissingEntities (
  gtfsPlusRows: Array<GTFSPlusEntity>,
  currentLookup: {[string]: GtfsRoute | GtfsStop}
) {
  // Determine which routes and stops aren't currently in the
  // gtfsEntityLookup table and need to be loaded from the API.
  const routesToLoad: string[] = []
  const stopsToLoad: string[] = []
  for (const rowData of gtfsPlusRows) {
    for (const fieldName in rowData) {
      // Currently, the only references to stops/routes in GTFS+ are fields named
      // route_id or stop_id. If this changes, this logic should revert to
      // commit 7d150d85e203b336147ba106eef7c3be90b39fb7 which contained a way
      // to lookup based on inputType in gtfsplus.yml.
      switch (fieldName) {
        case 'route_id':
          const {route_id: routeId} = rowData
          if (routeId && !(`route_${routeId}` in currentLookup)) routesToLoad.push(routeId)
          break
        case 'stop_id':
          const {stop_id: stopId} = rowData
          if (stopId && !(`stop_${stopId}` in currentLookup)) stopsToLoad.push(stopId)
          break
        default:
          // No entities to search for.
          break
      }
    }
  }
  return {routesToLoad, stopsToLoad}
}

// PUBLISH ACTIONS
export function publishGtfsPlusFeed (feedVersion: FeedVersion) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(publishingGtfsPlusFeed())
    const url = `/api/manager/secure/gtfsplus/${feedVersion.id}/publish`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => res.json())
      // Monitor progress of new version processing
      .then(json => dispatch(startJobMonitor()))
  }
}
