import { browserHistory } from 'react-router'

import { secureFetch } from '../../common/actions'
import { receiveProject } from './projects'
import { startJobMonitor } from './status'
import fileDownload from '../../common/util/file-download'

// Deployment Actions

export function requestingDeployments () {
  return {
    type: 'REQUESTING_DEPLOYMENTS'
  }
}

export function receiveDeployments (projectId, deployments) {
  return {
    type: 'RECEIVE_DEPLOYMENTS',
    projectId,
    deployments
  }
}

export function fetchProjectDeployments (projectId) {
  return function (dispatch, getState) {
    dispatch(requestingDeployments())
    const url = '/api/manager/secure/deployments?projectId=' + projectId
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(deployments => {
        dispatch(receiveDeployments(projectId, deployments))
      })
  }
}

export function deployingToTarget (deployment, target) {
  return {
    type: 'DEPLOYING_TO_TARGET',
    deployment,
    target
  }
}

export function deployedToTarget (deployment, target) {
  return {
    type: 'DEPLOYED_TO_TARGET',
    deployment,
    target
  }
}

export function deployToTarget (deployment, target) {
  return function (dispatch, getState) {
    dispatch(deployingToTarget(deployment, target))
    const url = `/api/manager/secure/deployments/${deployment.id}/deploy/${target}`
    return dispatch(secureFetch(url, 'post'))
      .then(response => {
        console.log(response)
        if (response.status >= 300) {
          window.alert('Deployment error: ' + response.statusText)
        } else {
          dispatch(deployedToTarget(deployment, target))
          dispatch(startJobMonitor())
        }
      })
  }
}

export function requestingDeployment () {
  return {
    type: 'REQUESTING_DEPLOYMENT'
  }
}

export function receiveDeployment (projectId, deployment) {
  return {
    type: 'RECEIVE_DEPLOYMENT',
    projectId,
    deployment
  }
}

export function requestingDeploymentStatus () {
  return {
    type: 'REQUESTING_DEPLOYMENT_STATUS'
  }
}

export function receiveDeploymentStatus (deployment, status) {
  return {
    type: 'RECEIVE_DEPLOYMENT_STATUS',
    deployment,
    status
  }
}

export function fetchDeploymentStatus (deployment, target) {
  return function (dispatch, getState) {
    dispatch(requestingDeploymentStatus())
    const url = `/api/manager/secure/deployments/status/${deployment.id}?target=${target}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(status => {
        console.log(status)
        dispatch(receiveDeploymentStatus(deployment, status))
      })
  }
}

export function fetchDeployment (id) {
  return function (dispatch, getState) {
    dispatch(requestingDeployment())
    const url = '/api/manager/secure/deployments/' + id
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(deployment => {
        dispatch(receiveDeployment(deployment.project.id, deployment))
      })
  }
}

export function downloadDeployment (deployment) {
  return function (dispatch, getState) {
    // dispatch(downloadingDeployment())
    const url = '/api/manager/secure/deployments/' + deployment.id + '/download'
    // window.location.assign(url)
    return dispatch(secureFetch(url))
      .then(response => response.blob())
      .then(blob => fileDownload(blob, 'test.zip', 'application/zip'))
  }
}

export function fetchDeploymentAndProject (id) {
  return function (dispatch, getState) {
    dispatch(requestingDeployment())
    const url = '/api/manager/secure/deployments/' + id
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(deployment => {
        dispatch(receiveProject(deployment.project))
        dispatch(receiveDeployment(deployment.project.id, deployment))
        return deployment
      })
  }
}

export function createDeployment (projectId) {
  return {
    type: 'CREATE_DEPLOYMENT',
    projectId
  }
}

export function createdDeployment (deployment) {
  return {
    type: 'CREATED_DEPLOYMENT',
    deployment
  }
}

export function deletingDeployment (feedSource) {
  return {
    type: 'DELETING_DEPLOYMENT',
    feedSource
  }
}

export function deleteDeployment (deployment) {
  return function (dispatch, getState) {
    dispatch(deletingDeployment(deployment))
    if (deployment.isCreating) {
      return dispatch(fetchProjectDeployments(deployment.project.id))
    }
    const url = '/api/manager/secure/deployments/' + deployment.id
    return dispatch(secureFetch(url, 'delete'))
      .then((res) => {
        return dispatch(fetchProjectDeployments(deployment.project.id))
      })
  }
}

export function savingDeployment () {
  return {
    type: 'SAVING_DEPLOYMENT'
  }
}
export function saveDeployment (props) {
  return function (dispatch, getState) {
    dispatch(savingDeployment())
    const url = '/api/manager/secure/deployments'
    return dispatch(secureFetch(url, 'post', props))
      .then(response => response.json())
      .then(deployment => dispatch(fetchProjectDeployments(deployment.project.id)))
  }
}

export function createDeploymentFromFeedSource (feedSource) {
  return function (dispatch, getState) {
    dispatch(savingDeployment())
    const url = '/api/manager/secure/deployments/fromfeedsource/' + feedSource.id
    return dispatch(secureFetch(url, 'post'))
      .then(response => response.json())
      .then(deployment => {
        dispatch(receiveDeployment(deployment.project.id, deployment))
        return browserHistory.push(`/project/${feedSource.projectId}/deployments/${deployment.id}`)
      })
  }
}

export function updateDeployment (deployment, changes) {
  return function (dispatch, getState) {
    dispatch(savingDeployment(deployment))
    const url = '/api/manager/secure/deployments/' + deployment.id
    return dispatch(secureFetch(url, 'put', changes))
      .then(response => response.json())
      .then(deployment => dispatch(receiveDeployment(deployment.project.id, deployment)))
  }
}
