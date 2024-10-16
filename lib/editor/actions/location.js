// @flow
import {secureFetch} from '../../common/actions'
import {getMapFromGtfsStrategy, entityIsNew} from '../util/objects'
import { getEditorNamespace } from '../util/gtfs'
import {fetchGTFSEntities} from '../../manager/actions/versions'
import type {dispatchFn, getStateFn} from '../../types/reducers'
import type {GtfsLocationGroup} from '../../types'

import { receivedNewEntity, savedGtfsEntity } from './active'

export function saveLocationGroup (
  feedId: ?string,
  locationGroup: GtfsLocationGroup,
  refetch: ?boolean = true
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (!feedId || !locationGroup) {
      return
    }
    // dispatch(savingActiveLocation()) //Update this?

    const notNew = !entityIsNew(locationGroup) // Checks if id is -2 or undefined
    const method = notNew ? 'put' : 'post'
    const idParam = notNew ? `/${locationGroup.id || ''}` : ''
    const {sessionId} = getState().editor.data.lock

    const mappingStrategy = getMapFromGtfsStrategy('locationGroup')
    const data = mappingStrategy(locationGroup)

    const locationGroupUrl = `/api/editor/secure/locationgroup${idParam}?feedId=${feedId}&sessionId=${sessionId || ''}`
    const locationGroupStopsUrl = `/api/editor/secure/locationgroupstop${idParam}?feedId=${feedId}&sessionId=${sessionId || ''}`

    dispatch(secureFetch(locationGroupStopsUrl, method, data))
      .then(res => res.json())
      .then(savedEntity => {
        dispatch(savedGtfsEntity())
        const namespace = getEditorNamespace(feedId, getState())
        // Refetch entity and replace in store
        if (refetch) {
          dispatch(fetchGTFSEntities({
            namespace,
            id: savedEntity.id,
            type: 'locationgroupstop',
            editor: true,
            replaceNew: !notNew
          }))
        } else {
          // Push new entity into store.
          dispatch(receivedNewEntity({component: 'locationgroupstop', entity: savedEntity}))
        }
      })
    return dispatch(secureFetch(locationGroupUrl, method, data))
      .then(res => res.json())
      .then(savedEntity => {
        dispatch(savedGtfsEntity())
        const namespace = getEditorNamespace(feedId, getState())
        // Refetch entity and replace in store
        if (refetch) {
          dispatch(fetchGTFSEntities({
            namespace,
            id: savedEntity.id,
            type: 'locationgroup',
            editor: true,
            replaceNew: !notNew
          }))
        } else {
          // Push new entity into store.
          dispatch(receivedNewEntity({component: 'locationgroup', entity: savedEntity}))
          Promise.resolve(savedEntity)
        }
      })
  }
}

export function saveLocation (
  feedId: ?string,
  location: GtfsLocation,
  refetch: ?boolean = true
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // TODO: Handle this w/in the regular saveEntity fn?
    if (!feedId || !location) {
      return
    }
    // dispatch(savingActiveLocation()) //Update this?

    const notNew = !entityIsNew(location) // Checks if id is -2 or undefined
    const method = notNew ? 'put' : 'post'
    const idParam = notNew ? `/${location.id || ''}` : ''
    const {sessionId} = getState().editor.data.lock

    const mappingStrategy = getMapFromGtfsStrategy('location')
    const data = mappingStrategy(location)

    const locationUrl = `/api/editor/secure/location${idParam}?feedId=${feedId}&sessionId=${sessionId || ''}`

    return dispatch(secureFetch(locationUrl, method, data))
      .then(res => res.json())
      .then(savedEntity => {
        dispatch(savedGtfsEntity())
        const namespace = getEditorNamespace(feedId, getState())
        // Refetch entity and replace in store
        if (refetch) {
          dispatch(fetchGTFSEntities({
            namespace,
            id: savedEntity.id,
            type: 'location',
            editor: true,
            replaceNew: !notNew
          }))
        } else {
          // Push new entity into store.
          dispatch(receivedNewEntity({component: 'location', entity: savedEntity}))
          Promise.resolve(savedEntity)
        }
      })
  }
}
