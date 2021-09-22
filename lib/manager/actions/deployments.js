// @flow

import qs from 'qs'
import { browserHistory } from 'react-router'
import { createAction, type ActionType } from 'redux-actions'

import { createVoidPayloadAction, postFormData, secureFetch } from '../../common/actions'
import fileDownload from '../../common/util/file-download'
import type {Deployment, Feed, SummarizedFeedVersion} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

import { startJobMonitor } from './status'
import { receiveProject } from './projects'

const DEPLOYMENT_URL = `/api/manager/secure/deployments`

// Deployment Actions
export const createDeployment = createAction(
  'CREATE_DEPLOYMENT',
  (payload: string) => payload
)
const receiveDeployment = createAction(
  'RECEIVE_DEPLOYMENT',
  (payload: Deployment) => payload
)
const receiveDeployments = createAction(
  'RECEIVE_DEPLOYMENTS',
  (payload: {
    deployments: Array<Deployment>,
    feedSourceId?: string,
    projectId: string
  }) => payload
)
const requestingDeployment = createVoidPayloadAction('REQUESTING_DEPLOYMENT')
const requestingDeployments = createVoidPayloadAction('REQUESTING_DEPLOYMENTS')
const savingDeployment = createVoidPayloadAction('SAVING_DEPLOYMENT')

export type DeploymentActions = ActionType<typeof createDeployment> |
  ActionType<typeof receiveDeployment> |
  ActionType<typeof receiveDeployments> |
  ActionType<typeof requestingDeployment> |
  ActionType<typeof requestingDeployments> |
  ActionType<typeof savingDeployment>

type FeedVersionId = { id: string } | { feedSourceId: string, version: number }

export function addFeedVersion (
  deployment: Deployment,
  feedVersion: FeedVersionId
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const feedVersions = [...deployment.feedVersions, feedVersion]
    return dispatch(updateDeployment(deployment, {feedVersions}))
  }
}

export function fetchProjectDeployments (projectId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingDeployments())
    return dispatch(secureFetch(`${DEPLOYMENT_URL}?projectId=${projectId}`))
      .then(response => response.json())
      .then(deployments => {
        dispatch(receiveDeployments({projectId, deployments}))
      })
  }
}

export function fetchFeedSourceDeployments (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingDeployments())
    return dispatch(secureFetch(`${DEPLOYMENT_URL}?feedSourceId=${feedSource.id}`))
      .then(response => response.json())
      .then(deployments => dispatch(receiveDeployments({
        feedSourceId: feedSource.id,
        projectId: feedSource.projectId,
        deployments
      })))
  }
}

export function deployToTarget (deployment: Deployment, target: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = deployment
    // Ensure that target server has valid name (used as identifier currently)
    if (!target) return window.alert('OTP Server must have valid name.')
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${id}/deploy/${target}`, 'post'))
      .then(response => {
        // FIXME: Use standard handleJobResponse for deployment job
        if (response.status >= 400 || response.status === 202) {
          // If there is an issue with the deployment, return the JSON response
          // (handled be below alert)
          return response.json()
        } else {
          // If the deployment request succeeded, start monitoring the job.
          dispatch(startJobMonitor())
          dispatch(fetchProjectDeployments(deployment.projectId))
        }
      })
      .then(json => {
        // Show JSON message if there was an issue.
        json && window.alert(json.message || 'Could not process deployment')
      })
  }
}

export function fetchDeployment (id: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingDeployment())
    if (!id) {
      // TODO: replace with more UI-friendly thingy
      window.alert('Invalid deployment id to fetch')
      return
    }
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${id}`))
      .then(response => response.json())
      .then(deployment => dispatch(receiveDeployment(deployment)))
  }
}

/**
 * Download a build artifact for the deployment. Defaults to otp build log file.
 */
export function downloadBuildArtifact (deployment: Deployment, filename: ?string = 'otp-build.log', jobId: ?string = null) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const params = jobId ? {filename, jobId} : {filename}
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${deployment.id}/artifact?${qs.stringify(params)}`))
      .then(response => response.json())
      .then(json => {
        // Download object using presigned S3 URL.
        window.location.assign(json.url)
      })
  }
}

/**
 * Set a suggested file name for the given deployment.
 *
 * Note: Although a suggested file name is returned in the 'content-disposition' header of the 'download' endpoint,
 * it is still needed to set it here because we trigger the "Save As" dialog separately from the actual fetch.
 * Also, it is probably simpler to recompute the file name here instead of extracting it from the response.
 *
 * @param deployment The deployment object from which to derive the zip file name.
 * @returns The suggested zip file name ending in ".zip" for the browser "Save As" dialog.
 */
function getDeploymentZipFileName (deployment: Deployment): string {
  // Remove all spaces and special chars from deployment name.
  const zipBase = deployment.name.replace(/[^a-zA-Z0-9]/g, '')
  return `${zipBase}.zip`
}

export function downloadDeployment (deployment: Deployment) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const zipName = getDeploymentZipFileName(deployment)
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${deployment.id}/download`))
      .then(response => response.blob())
      .then(blob => fileDownload(blob, zipName, 'application/zip'))
  }
}

export function fetchDeploymentAndProject (id: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingDeployment())
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${id}`))
      .then(response => response.json())
      .then(deployment => {
        dispatch(receiveProject(deployment.project))
        dispatch(receiveDeployment(deployment))
        return deployment
      })
  }
}

export function deleteDeployment (deployment: Deployment & { isCreating?: boolean }) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id, isCreating, projectId} = deployment
    if (isCreating) {
      return dispatch(fetchProjectDeployments(projectId))
    }
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${id}`, 'delete'))
      .then((res) => dispatch(fetchProjectDeployments(projectId)))
  }
}

export function terminateEC2InstanceForDeployment (deploymentId: string, instanceIds: Array<string>) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `${DEPLOYMENT_URL}/${deploymentId}/ec2?instanceIds=${instanceIds.join(',')}`
    return dispatch(secureFetch(url, 'delete'))
      .then((res) => dispatch(fetchDeployment(deploymentId)))
  }
}

export function deleteFeedVersion (
  deployment: Deployment,
  feedVersion: SummarizedFeedVersion
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const feedVersions = deployment.feedVersions
    const index = feedVersions.findIndex(v => v.id === feedVersion.id)
    feedVersions.splice(index, 1)
    return dispatch(updateDeployment(deployment, {feedVersions}))
  }
}

export function saveDeployment (
  props: { name: string, projectId: string }
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(savingDeployment())
    return dispatch(secureFetch(DEPLOYMENT_URL, 'post', props))
      .then(response => response.json())
      .then(deployment => dispatch(fetchProjectDeployments(deployment.projectId)))
  }
}

export function createDeploymentFromFeedSource (feedSource: Feed) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id, projectId} = feedSource
    dispatch(savingDeployment())
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/fromfeedsource/${id}`, 'post'))
      .then(response => response.json())
      .then(deployment => {
        dispatch(receiveDeployment(deployment))
        // Redirect browser page to deployment view.
        return browserHistory.push(`/project/${projectId}/deployments/${deployment.id}`)
      })
  }
}

export function togglePinFeedVersion (
  deployment: Deployment,
  version: SummarizedFeedVersion
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    let pinnedfeedVersionIds
    if (deployment.pinnedfeedVersionIds.includes(version.id)) {
      // The feed version already exists in list of pinned feed versions.
      // Therefore, the toggle outcome is to unpin the feed version.
      pinnedfeedVersionIds = deployment.pinnedfeedVersionIds.filter(
        id => id !== version.id
      )
    } else {
      // The feed version doesn't yet exist in list of pinned feed versions.
      // Therefore, the toggle outcome is to pin the feed version.
      pinnedfeedVersionIds = [...deployment.pinnedfeedVersionIds, version.id]
    }
    dispatch(updateDeployment(deployment, {pinnedfeedVersionIds}))
  }
}

export function updateDeployment (
  deployment: Deployment,
  changes: any // using the any type because $Shape<Deployment> was giving
  // errors due to how feed versions are saved as FeedVersionId types
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = deployment
    dispatch(savingDeployment())
    return dispatch(secureFetch(`${DEPLOYMENT_URL}/${id}`, 'put', changes))
      .then(response => response.json())
      .then(deployment => dispatch(receiveDeployment(deployment)))
  }
}

export function updateVersionForFeedSource (
  deployment: Deployment,
  feedSource: Feed,
  feedVersion: FeedVersionId
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const feedVersions = [...deployment.feedVersions]
    // $FlowFixMe weird error that shouldn't happen
    const index = feedVersions.findIndex(v => v.feedSource.id === feedSource.id)
    feedVersions.splice(index, 1)
    feedVersions.push(feedVersion)
    return dispatch(updateDeployment(deployment, {feedVersions}))
  }
}

/**
 * Uploads a csv file to the server, which uploads it to s3. Associates the resulting URL with
 * a deployment
 * @param {*} deployment                    The deployment to add the csv file to
 * @param {*} file                          The csv file to upload
 * @param {*} fileToDeleteOnSuccesfulUpload A URL to delete from the deployment on a successful upload
 * @returns                                 false if something fails, otherwise the deployment update
 */
export async function uploadPeliasWebhookCsvFile (deployment: Deployment, file: File, fileToDeleteOnSuccesfulUpload?: string | null) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const { user } = getState()
    if (!user || !user.token) {
      window.alert('You are not logged in. Please log in again.')
      return false
    }
    const { id } = deployment
    const url = `${DEPLOYMENT_URL}/${id}/upload`

    const headers = {}
    if (fileToDeleteOnSuccesfulUpload) {
      headers.urlToDelete = fileToDeleteOnSuccesfulUpload
    }

    const s3UploadResponse = await dispatch(postFormData(url, file, headers))
    if (s3UploadResponse) {
      const updatedDeployment = await s3UploadResponse.json()
      return dispatch(receiveDeployment(updatedDeployment))
    }
  }
}

/**
 * Increments all feed versions in the deployment to the latest version, except
 * for those that have been pinned to a specific version.
 */
export function incrementAllVersionsToLatest (deployment: Deployment) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const feedVersions = deployment.feedVersions.map(v =>
      deployment.pinnedfeedVersionIds.includes(v.id)
        ? v
        : ({id: v.feedSource.latestVersionId}))
    return dispatch(updateDeployment(deployment, {feedVersions}))
  }
}
