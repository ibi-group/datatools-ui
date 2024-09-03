// @flow

import {createAction, type ActionType} from 'redux-actions'

import {secureFetch} from '../../common/actions'
import {getConfigProperty} from '../../common/util/config'
import {handleJobResponse} from '../../manager/actions/status'
import type {Feed, Snapshot} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

const creatingSnapshot = createAction('CREATING_SNAPSHOT')
const deletingSnapshot = createAction('DELETING_SNAPSHOT')
const loadingFeedVersionForEditing = createAction('LOADING_FEEDVERSION_FOR_EDITING')
const receiveSnapshots = createAction(
  'RECEIVE_GTFSEDITOR_SNAPSHOTS',
  (payload: { feedSource: Feed, snapshots: Array<Snapshot> }) => payload
)
const requestingSnapshots = createAction('REQUESTING_GTFSEDITOR_SNAPSHOTS')
const restoringSnapshot = createAction('RESTORING_SNAPSHOT')

export type SnapshotActions = ActionType<typeof creatingSnapshot> |
  ActionType<typeof deletingSnapshot> |
  ActionType<typeof loadingFeedVersionForEditing> |
  ActionType<typeof receiveSnapshots> |
  ActionType<typeof requestingSnapshots> |
  ActionType<typeof restoringSnapshot>

export function fetchSnapshots (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingSnapshots())
    const url = `/api/editor/secure/snapshot?feedId=${feedSource.id}`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(snapshots => dispatch(receiveSnapshots({feedSource, snapshots})))
  }
}

/**
 * Restores a snapshot into the active editor buffer. On the backend, this is
 * creating a copy of the snapshotted tables and then setting the feed source's
 * active buffer to those new tables.
 */
export function restoreSnapshot (feedSource: Feed, snapshot: Snapshot) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(restoringSnapshot())
    const url = `/api/editor/secure/snapshot/${snapshot.id}/restore?feedId=${feedSource.id}`
    return dispatch(secureFetch(url, 'post'))
      .then(res => dispatch(handleJobResponse(res, 'Erreur lors de la restauration de l\'instantané.')))
  }
}

/**
 * Initializes download snapshot job, which handles converting an editor snapshot
 * into a GTFS file. After the job is complete, the UI will handle downloading
 * the file.
 */
export function downloadSnapshot (feedSource: Feed, snapshot: Snapshot) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/editor/secure/snapshot/${snapshot.id}/download?feedId=${feedSource.id}`
    return dispatch(secureFetch(url))
      .then(res => dispatch(handleJobResponse(res, 'Erreur lors du téléchargement de l\'instantané.')))
  }
}

/**
 * Download a GTFS file for a snapshot using credentials supplied by backend.
 */
export function downloadSnapshotViaCredentials (snapshot: Snapshot, isPublic: boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const route = isPublic ? 'public' : 'secure'
    const url = `/api/editor/${route}/snapshot/${snapshot.id}/downloadtoken?feedId=${snapshot.feedSourceId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(json => {
        if (getConfigProperty('application.data.use_s3_storage')) {
          // Download object using presigned S3 URL.
          window.location.assign(json.url)
        } else {
          // Use token to download feed
          window.location.assign(`/api/editor/downloadsnapshot/${json.id}`)
        }
      })
  }
}

/**
 * Create a new snapshot from the data currently present in the editor buffer.
 */
export function createSnapshot (feedSource: Feed, name: string, comment?: ?string, publishNewVersion?: boolean, publishProprietaryFiles?: boolean) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/editor/secure/snapshot?feedId=${feedSource.id}${publishNewVersion ? '&publishNewVersion=true' : ''}${publishProprietaryFiles ? '&publishProprietaryFiles=true' : ''}`
    const snapshot = {
      feedId: feedSource.id,
      name,
      comment
    }
    dispatch(creatingSnapshot())
    return dispatch(secureFetch(url, 'post', snapshot))
      .then(res => dispatch(handleJobResponse(res, 'Erreur lors de la création de l\'instantané.')))
  }
}

/**
 * Fetch call to permanently delete the snapshot specified.
 */
export function deleteSnapshot (feedSource: Feed, snapshot: Snapshot) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(deletingSnapshot())
    const url = `/api/editor/secure/snapshot/${snapshot.id}?feedId=${feedSource.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then((response) => response.json())
      .then(snapshot => dispatch(fetchSnapshots(feedSource)))
  }
}

/**
 * "Imports" specified feed version into the editor. On the back end, this is
 * triggers a snapshot of the feed version's tables and sets the editor namespace
 * for the version's parent feed source.
 */
export function loadFeedVersionForEditing ({
  feedSourceId,
  feedVersionId
}: {
  feedSourceId: string,
  feedVersionId: string
}) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(loadingFeedVersionForEditing())
    const url = `/api/editor/secure/snapshot/import?feedId=${feedSourceId}&feedVersionId=${feedVersionId}`
    return dispatch(secureFetch(url, 'post'))
      .then(res => dispatch(handleJobResponse(res, 'erreur lors du chargement de la version pour édition')))
  }
}
