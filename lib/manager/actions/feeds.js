import { secureFetch } from '../../common/actions'
import { fetchProject, fetchProjectWithFeeds } from './projects'
import { setErrorMessage, startJobMonitor } from './status'
import { fetchFeedVersions, feedNotModified } from './versions'
import { fetchSnapshots } from '../../editor/actions/snapshots'

export function requestingFeedSources () {
  return {
    type: 'REQUESTING_FEEDSOURCES'
  }
}

export function receiveFeedSources (projectId, feedSources) {
  return {
    type: 'RECEIVE_FEEDSOURCES',
    projectId,
    feedSources
  }
}

export function fetchProjectFeeds (projectId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSources())
    const url = '/api/manager/secure/feedsource?projectId=' + projectId
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(feedSources => {
        dispatch(receiveFeedSources(projectId, feedSources))
        return feedSources
      })
  }
}

export function fetchUserFeeds (userId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSources())
    const url = '/api/manager/secure/feedsource?userId=' + userId
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(feedSources => {
        dispatch(receiveFeedSources(feedSources))
      })
  }
}

function receivePublicFeeds (feeds) {
  return {
    type: 'RECEIVE_PUBLIC_FEEDS',
    feeds
  }
}

export function createFeedSource (projectId) {
  return {
    type: 'CREATE_FEEDSOURCE',
    projectId
  }
}

export function savingFeedSource () {
  return {
    type: 'SAVING_FEEDSOURCE'
  }
}

export function saveFeedSource (props) {
  return function (dispatch, getState) {
    dispatch(savingFeedSource())
    const url = '/api/manager/secure/feedsource'
    return dispatch(secureFetch(url, 'post', props))
      .then((res) => {
        return dispatch(fetchProjectWithFeeds(props.projectId))
      })
  }
}

export function updateFeedSource (feedSource, changes) {
  return function (dispatch, getState) {
    dispatch(savingFeedSource())
    const url = '/api/manager/secure/feedsource/' + feedSource.id
    return dispatch(secureFetch(url, 'put', changes))
      .then((res) => {
        if (res.status >= 400) {
          console.log(res.json())
          dispatch(setErrorMessage('Error updating feed source.'))
        }
        // return dispatch(fetchProjectFeeds(feedSource.projectId))
        return dispatch(fetchFeedSource(feedSource.id, true))
      })
  }
}

export function updateExternalFeedResource (feedSource, resourceType, properties) {
  return function (dispatch, getState) {
    console.log('updateExternalFeedResource', feedSource, resourceType, properties)
    dispatch(savingFeedSource())
    const url = `/api/manager/secure/feedsource/${feedSource.id}/updateExternal?resourceType=${resourceType}`
    return dispatch(secureFetch(url, 'put', properties))
      .then((res) => res.json())
      .then(json => dispatch(fetchFeedSource(feedSource.id, true)))
  }
}

export function deletingFeedSource (feedSource) {
  return {
    type: 'DELETING_FEEDSOURCE',
    feedSource
  }
}

export function deleteFeedSource (feedSource, changes) {
  return function (dispatch, getState) {
    dispatch(deletingFeedSource(feedSource))
    const url = '/api/manager/secure/feedsource/' + feedSource.id
    return dispatch(secureFetch(url, 'delete'))
      .then((res) => {
        // if (res.status >= 400) {
        //   return dispatch(setErrorMessage('Error deleting feed source'))
        // }
        return dispatch(fetchProjectFeeds(feedSource.projectId))
      })
  }
}

export function requestingFeedSource () {
  return {
    type: 'REQUESTING_FEEDSOURCE'
  }
}

export function receiveFeedSource (feedSource) {
  return {
    type: 'RECEIVE_FEEDSOURCE',
    feedSource
  }
}

export function fetchFeedSource (feedSourceId, withVersions = false, withSnapshots = false) {
  return function (dispatch, getState) {
    console.log('fetchFeedSource', feedSourceId)
    dispatch(requestingFeedSource())
    const url = '/api/manager/secure/feedsource/' + feedSourceId
    return dispatch(secureFetch(url))
      .then(res => {
        if (res.status >= 400) {
          // dispatch(setErrorMessage('Error getting feed source'))
          console.log('error getting feed source')
          return null
        }
        return res.json()
      })
      .then(feedSource => {
        if (!feedSource) {
          dispatch(receiveFeedSource(feedSource))
          return feedSource
        }
        console.log('got feedSource', feedSource)
        dispatch(receiveFeedSource(feedSource))
        if (withVersions) dispatch(fetchFeedVersions(feedSource))
        if (withSnapshots) dispatch(fetchSnapshots(feedSource))
        return feedSource
      })
  }
}

export function fetchFeedSourceAndProject (feedSourceId, unsecured) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSource())
    const apiRoot = unsecured ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/feedsource/${feedSourceId}`
    return dispatch(secureFetch(url))
      .then(res => {
        if (res.status >= 400) {
          // dispatch(setErrorMessage('Error getting feed source'))
          console.log('error getting feed source')
          return null
        }
        return res.json()
      })
      .then(feedSource => {
        if (!feedSource) {
          dispatch(receiveFeedSource(feedSource))
          return feedSource
        }
        return dispatch(fetchProject(feedSource.projectId, unsecured))
          .then(proj => {
            dispatch(receiveFeedSource(feedSource))
            return feedSource
          })
      })
  }
}

export function fetchPublicFeedSource (feedSourceId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSource())
    const url = '/api/manager/public/feedsource/' + feedSourceId
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(feedSource => {
        dispatch(receivePublicFeeds())
        return feedSource
      })
  }
}

export function runningFetchFeed () {
  return {
    type: 'RUNNING_FETCH_FEED'
  }
}

export function receivedFetchFeed (feedSource) {
  return {
    type: 'RECEIVED_FETCH_FEED',
    feedSource
  }
}

export function runFetchFeed (feedSource) {
  return function (dispatch, getState) {
    dispatch(runningFetchFeed())
    const url = `/api/manager/secure/feedsource/${feedSource.id}/fetch`
    return dispatch(secureFetch(url, 'post'))
      .then(res => {
        if (res.status === 304) {
          dispatch(feedNotModified(feedSource, 'Feed fetch cancelled because it matches latest feed version.'))
        } else if (res.status >= 400) {
          dispatch(setErrorMessage('Error fetching feed source'))
        } else {
          dispatch(receivedFetchFeed(feedSource))
          dispatch(startJobMonitor())
          return res.json()
        }
      })
      .then(result => {
        console.log('fetchFeed result', result)
        // fetch feed source with versions
        return dispatch(fetchFeedSource(feedSource.id, true))
      })
  }
}
