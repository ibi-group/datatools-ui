// @flow

import { secureFetch } from '../../common/actions'
import { isModuleEnabled } from '../../common/util/config'
import type { dispatchFn, getStateFn } from '../../types/reducers'
import type { Label } from '../../types'

import {fetchProjectDeployments} from './deployments'
import { fetchProject } from './projects'
import { fetchProjectFeeds } from './feeds'

// Public action used by component or other actions

const LABEL_URL = '/api/manager/secure/label'

/**
 * Create new label from provided properties.
 */
export function createLabel (label: Label) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(LABEL_URL, 'post', label))
      .then(res => res.json())
      .then(createdLabel => dispatch(refetchProject(createdLabel.projectId)))
  }
}

function refetchProject (projectId: string) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    // Wait for project to be fetched before fetching feeds/deployments.
    await dispatch(fetchProject(projectId))
    dispatch(fetchProjectFeeds(projectId))
    isModuleEnabled('deployment') && dispatch(fetchProjectDeployments(projectId))
  }
}

/**
 * Update existing label with provided properties.
 */
export function updateLabel (dirtyLabel: Label, properties: {[string]: any}) {
  // remove keys which the server doesn't like, which may be in the object
  // TODO: is there a cleaner/more dynamic way to do this? Properties can't be guaranteed to
  // include all the keys we need, so can't use that
  const { organizationId, user, ...label } = dirtyLabel

  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`${LABEL_URL}/${label.id}`, 'put', {...label}))
      .then(() => dispatch(refetchProject(label.projectId)))
  }
}

/**
 * Permanently delete single label
 */
export function deleteLabel (label: Label) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`${LABEL_URL}/${label.id}`, 'delete'))
      .then(() => dispatch(refetchProject(label.projectId)))
  }
}
