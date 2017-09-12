import { connect } from 'react-redux'

import FeedSourceViewer from '../components/FeedSourceViewer'
import { createFeedInfo } from '../../editor/actions/feedInfo'
import {
  fetchFeedSourceAndProject,
  fetchFeedSource,
  deleteFeedSource,
  runFetchFeed,
  updateExternalFeedResource,
  updateFeedSource
} from '../actions/feeds'
import {
  deleteFeedVersion,
  downloadFeedViaToken,
  fetchFeedVersions,
  fetchValidationResult,
  uploadFeed,
  renameFeedVersion
} from '../actions/versions'
import {
  fetchNotesForFeedSource,
  fetchNotesForFeedVersion,
  postNoteForFeedSource,
  postNoteForFeedVersion
} from '../actions/notes'
import { updateTargetForSubscription } from '../../manager/actions/user'
import { createDeploymentFromFeedSource } from '../../manager/actions/deployments'
import { loadFeedVersionForEditing } from '../../editor/actions/snapshots'
import { downloadGtfsPlusFeed } from '../../gtfsplus/actions/gtfsplus'

const mapStateToProps = (state, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  const user = state.user
  // find the containing project

  const project = state.projects.all
    ? state.projects.all.find(p => {
      if (!p.feedSources) return false
      return (p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1)
    })
    : null

  let feedSource
  if (project) {
    feedSource = project.feedSources.find(fs => fs.id === feedSourceId)
  } else if (!project && !state.projects.isFetching) {
    feedSource = null
  }
  const isFetching = state.projects.isFetching

  return {
    feedSource,
    feedSourceId,
    activeComponent: ownProps.routeParams.subpage,
    activeSubComponent: ownProps.routeParams.subsubpage,
    project,
    user,
    isFetching
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  return {
    createDeployment: (feedSource) => dispatch(createDeploymentFromFeedSource(feedSource)),
    loadFeedVersionForEditing: (feedVersion) => dispatch(loadFeedVersionForEditing(feedVersion)),
    deleteFeedVersion: (feedSource, feedVersion) => dispatch(deleteFeedVersion(feedSource, feedVersion)),
    downloadFeedClicked: (feedVersion) => { dispatch(downloadFeedViaToken(feedVersion)) },
    externalPropertyChanged: (feedSource, resourceType, properties) => dispatch(updateExternalFeedResource(feedSource, resourceType, properties)),
    feedSourcePropertyChanged: (feedSource, propName, newValue) => dispatch(updateFeedSource(feedSource, { [propName]: newValue })),
    feedVersionRenamed: (feedVersion, name) => dispatch(renameFeedVersion(feedVersion, name)),
    gtfsPlusDataRequested: (feedVersionId) => dispatch(downloadGtfsPlusFeed(feedVersionId)),
    newNotePostedForFeedSource: (feedSource, note) => dispatch(postNoteForFeedSource(feedSource, note)),
    newNotePostedForVersion: (version, note) => dispatch(postNoteForFeedVersion(version, note)),
    notesRequestedForFeedSource: (feedSource) => dispatch(fetchNotesForFeedSource(feedSource)),
    notesRequestedForVersion: (feedVersion) => dispatch(fetchNotesForFeedVersion(feedVersion)),
    onComponentMount: (initialProps) => {
      let unsecured = true
      if (initialProps.user.profile !== null) {
        unsecured = false
      }
      if (!initialProps.project) {
        dispatch(fetchFeedSourceAndProject(feedSourceId, unsecured))
        .then((feedSource) => {
          // go back to projects list if no feed source found
          if (!feedSource) {
            // browserHistory.push('/project')
            return null
          }
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
      } else if (!initialProps.feedSource) {
        dispatch(fetchFeedSource(feedSourceId, unsecured))
        .then((feedSource) => {
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
      } else if (!initialProps.feedSource.versions) {
        dispatch(fetchFeedVersions(initialProps.feedSource, unsecured))
      }
    },
    componentDidUpdate: (prevProps, newProps) => {
      let unsecured = true
      if (newProps.user.profile !== null) {
        unsecured = false
      }
      if (prevProps.feedSource && newProps.feedSource && prevProps.feedSource.id !== newProps.feedSource.id) {
        dispatch(fetchFeedSource(feedSourceId, unsecured))
        .then((feedSource) => {
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
      }
    },
    fetchFeed: (feedSource) => dispatch(runFetchFeed(feedSource)),
    deleteFeedSource: (feedSource) => dispatch(deleteFeedSource(feedSource)),
    updateUserSubscription: (profile, target, subscriptionType) => dispatch(updateTargetForSubscription(profile, target, subscriptionType)),
    uploadFeed: (feedSource, file) => dispatch(uploadFeed(feedSource, file)),
    fetchValidationResult: (feedSource, feedVersion) => dispatch(fetchValidationResult(feedVersion)),
    createFeedInfo: (feedSourceId) => dispatch(createFeedInfo(feedSourceId))
  }
}

const ActiveFeedSourceViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(FeedSourceViewer)

export default ActiveFeedSourceViewer
