import { secureFetch } from '../../common/actions'
import { fetchBaseGtfs } from './editor'
import { clearGtfsContent } from './active'
import { handleFetchError, startJobMonitor } from '../../manager/actions/status'
import { getConfigProperty } from '../../common/util/config'
import { downloadS3Key } from '../../manager/actions/versions'

// SNAPSHOT ACTIONS

export function requestingSnapshots () {
  return {
    type: 'REQUESTING_GTFSEDITOR_SNAPSHOTS'
  }
}

export function receiveSnapshots (feedSource, snapshots) {
  return {
    type: 'RECEIVE_GTFSEDITOR_SNAPSHOTS',
    feedSource,
    snapshots
  }
}

export function fetchSnapshots (feedSource) {
  return function (dispatch, getState) {
    dispatch(requestingSnapshots())
    const url = `/api/editor/secure/snapshot?feedId=${feedSource.id}`
    return dispatch(secureFetch(url, 'get'))
      .then((response) => {
        return response.json()
      }).then((snapshots) => {
        dispatch(receiveSnapshots(feedSource, snapshots))
      })
  }
}

export function restoringSnapshot () {
  return {
    type: 'RESTORING_SNAPSHOT'
  }
}

export function restoredSnapshot (name) {
  return {
    type: 'RESTORED_SNAPSHOT',
    name
  }
}

export function restoreSnapshot (feedSource, snapshot) {
  return function (dispatch, getState) {
    dispatch(restoringSnapshot())
    const url = `/api/editor/secure/snapshot/${snapshot.id}/restore?feedId=${feedSource.id}`
    return dispatch(secureFetch(url, 'post'))
      .then((response) => {
        return response.json()
      }).then((stops) => {
        dispatch(restoredSnapshot(snapshot.name))
        dispatch(fetchSnapshots(feedSource))
        dispatch(clearGtfsContent())
        dispatch(fetchBaseGtfs(feedSource.id))
      })
  }
}

export function downloadingSnapshot (feedSource, snapshot) {
  return {
    type: 'DOWNLOADING_SNAPSHOT',
    feedSource,
    snapshot
  }
}

export function downloadedSnapshot (name) {
  return {
    type: 'DOWNLOADED_SNAPSHOT',
    name
  }
}

export function downloadSnapshotViaToken (feedSource, snapshot) {
  return function (dispatch, getState) {
    dispatch(downloadingSnapshot(feedSource, snapshot))
    const url = `/api/editor/secure/snapshot/${snapshot.id}/downloadtoken?feedId=${feedSource.id}`
    dispatch(secureFetch(url))
    .then((response) => response.json())
    .then((credentials) => {
      if (getConfigProperty('application.data.use_s3_storage')) {
        dispatch(downloadS3Key(credentials, `${snapshot.feedId}_${snapshot.snapshotTime}.zip`, 'snapshots'))
      } else {
        // use token to download feed
        window.location.assign(`/api/editor/downloadsnapshot/${credentials.id}?feedId=${feedSource.id}`)
      }
    })
  }
}

export function creatingSnapshot () {
  return {
    type: 'CREATING_SNAPSHOT'
  }
}

export function createdSnapshot (name) {
  return {
    type: 'CREATED_SNAPSHOT',
    name
  }
}

export function createSnapshot (feedSource, name, comment) {
  return function (dispatch, getState) {
    dispatch(creatingSnapshot())
    const url = `/api/editor/secure/snapshot?feedId=${feedSource.id}`
    const payload = {
      feedId: feedSource.id,
      name,
      comment
    }
    return dispatch(secureFetch(url, 'post', payload))
      .then((response) => {
        return response.json()
      }).then(() => {
        dispatch(createdSnapshot(name))
        return dispatch(fetchSnapshots(feedSource))
      })
  }
}

export function deletingSnapshot () {
  return {
    type: 'DELETING_SNAPSHOT'
  }
}

export function deleteSnapshot (feedSource, snapshot) {
  return function (dispatch, getState) {
    dispatch(deletingSnapshot())
    const url = `/api/editor/secure/snapshot/${snapshot.id}?feedId=${feedSource.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then((response) => {
        return response.json()
      }).then(() => {
        console.log('deleted!')
        dispatch(fetchSnapshots(feedSource))
      })
  }
}

export function loadingFeedVersionForEditing (feedVersion) {
  return {
    type: 'LOADING_FEEDVERSION_FOR_EDITING',
    feedVersion
  }
}

export function loadFeedVersionForEditing (feedVersion) {
  return function (dispatch, getState) {
    dispatch(loadingFeedVersionForEditing(feedVersion))
    const url = `/api/editor/secure/snapshot/import?feedId=${feedVersion.feedSource.id}&feedVersionId=${feedVersion.id}`
    return dispatch(secureFetch(url, 'post'))
      .then((res) => {
        if (res.status >= 400) {
          return res.json()
        }
        dispatch(startJobMonitor())
        return res.json()
      }).then((json) => {
        if (json.code >= 400) {
          dispatch(handleFetchError(json.message))
        } else {
          dispatch(fetchSnapshots(feedVersion.feedSource))
        }
      })
  }
}
