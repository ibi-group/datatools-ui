// @flow

import {connect} from 'react-redux'

import FeedVersionNavigator from '../components/version/FeedVersionNavigator'
import {
  runFetchFeed
} from '../actions/feeds'
import {
  deleteFeedVersion,
  downloadFeedViaToken,
  fetchGTFSEntities,
  fetchValidationErrors,
  fetchValidationIssueCount,
  mergeVersions,
  publishFeedVersion,
  renameFeedVersion,
  setVersionIndex,
  uploadFeed
} from '../actions/versions'
import {postNoteForFeedVersion, fetchNotesForFeedVersion} from '../actions/notes'
import {createDeploymentFromFeedSource} from '../../manager/actions/deployments'
import {loadFeedVersionForEditing} from '../../editor/actions/snapshots'
import {downloadGtfsPlusFeed, validateGtfsPlusFeed} from '../../gtfsplus/actions/gtfsplus'
import {versionsLastUpdatedComparator} from '../util/version'

import type {Feed, Project} from '../../types'
import type {AppState, RouteParams} from '../../types/reducers'

export type Props = {
  deleteDisabled?: boolean,
  disabled?: boolean,
  editDisabled?: boolean,
  feedSource: Feed,
  isPublic?: boolean,
  project?: Project,
  routeParams: RouteParams,
  versionIndex?: number
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  let feedVersionIndex
  const {routeParams, feedSource} = ownProps
  const {feedVersions} = feedSource
  const {feedVersionIndex: fvi, subpage} = routeParams
  const routeVersionIndex = parseInt(fvi, 10)
  const hasVersionIndex = typeof fvi !== 'undefined'
  let versionIndexDoesNotExist = false
  if (feedSource && typeof feedVersions !== 'undefined') {
    if ((hasVersionIndex && isNaN(routeVersionIndex)) ||
        routeVersionIndex > feedVersions.length ||
        routeVersionIndex < 0) {
      versionIndexDoesNotExist = true
    } else {
      feedVersionIndex = hasVersionIndex
        ? routeVersionIndex
        : feedVersions.length
    }
  }
  const {gtfs} = state
  const hasVersions = feedVersions && feedVersions.length > 0
  const sortedVersions = (hasVersions && feedVersions)
    ? feedVersions.sort(versionsLastUpdatedComparator)
    : []

  let version

  if (
    hasVersions &&
    feedVersions &&
    typeof feedVersionIndex === 'number' &&
    feedVersions.length >= feedVersionIndex
  ) {
    version = sortedVersions[feedVersionIndex - 1]
  }
  return {
    gtfs,
    hasVersions,
    feedVersionIndex,
    gtfsPlusValidation: state.gtfsplus.validation,
    sortedVersions,
    user: state.user,
    version,
    versionIndexDoesNotExist,
    versionSection: subpage
  }
}

const mapDispatchToProps = {
  createDeploymentFromFeedSource,
  deleteFeedVersion,
  downloadFeedViaToken,
  downloadGtfsPlusFeed,
  fetchGTFSEntities,
  fetchNotesForFeedVersion,
  fetchValidationErrors,
  fetchValidationIssueCount,
  loadFeedVersionForEditing,
  mergeVersions,
  postNoteForFeedVersion,
  publishFeedVersion,
  renameFeedVersion,
  runFetchFeed,
  setVersionIndex,
  uploadFeed,
  validateGtfsPlusFeed
}

const ActiveFeedVersionNavigator = connect(
  mapStateToProps,
  mapDispatchToProps
)(FeedVersionNavigator)

export default ActiveFeedVersionNavigator
