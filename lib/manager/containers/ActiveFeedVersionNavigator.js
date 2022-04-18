// @flow

import {connect} from 'react-redux'

import FeedVersionNavigator from '../components/version/FeedVersionNavigator'
import {
  runFetchFeed
} from '../actions/feeds'
import {
  deleteFeedVersion,
  downloadFeedViaToken,
  exportVersionShapes,
  fetchGTFSEntities,
  fetchValidationErrors,
  mergeVersions,
  publishFeedVersion,
  renameFeedVersion,
  setVersionIndex,
  uploadFeed
} from '../actions/versions'
import {postNoteForFeedVersion, fetchNotesForFeedVersion} from '../actions/notes'
import {createDeploymentFromFeedSource} from '../../manager/actions/deployments'
import {loadFeedVersionForEditing} from '../../editor/actions/snapshots'
import {downloadGtfsPlusFeed} from '../../gtfsplus/actions/gtfsplus'
import {versionsLastUpdatedComparator} from '../util/version'
import type {Feed, Project} from '../../types'
import type {AppState, RouteParams} from '../../types/reducers'

export type Props = {
  deleteDisabled?: boolean,
  disabled?: boolean,
  editDisabled?: boolean,
  feedSource: Feed,
  isPublic?: boolean,
  project: Project,
  routeParams: RouteParams,
  versionIndex?: number
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  let feedVersionIndex
  const {routeParams, feedSource} = ownProps
  const {feedVersions, feedVersionSummaries} = feedSource
  const {feedVersionIndex: fvi, subpage} = routeParams
  const routeVersionIndex = parseInt(fvi, 10)
  const hasVersionIndex = typeof fvi !== 'undefined'
  let versionIndexDoesNotExist = false
  if (feedSource && typeof feedVersionSummaries !== 'undefined') {
    if ((hasVersionIndex && isNaN(routeVersionIndex)) ||
        routeVersionIndex > feedVersionSummaries.length ||
        routeVersionIndex < 0) {
      versionIndexDoesNotExist = true
    } else {
      feedVersionIndex = hasVersionIndex
        ? routeVersionIndex
        : feedVersionSummaries.length
    }
  }
  const {gtfs} = state
  const hasVersions = feedVersionSummaries && feedVersionSummaries.length > 0
  const sortedVersions = (hasVersions && feedVersions)
    ? feedVersions.sort(versionsLastUpdatedComparator)
    : []
  const sortedSummaries = (hasVersions && feedVersionSummaries)
    ? feedVersionSummaries.sort(versionsLastUpdatedComparator)
    : []

  let comparedVersion, version

  if (
    hasVersions &&
    feedVersions &&
    typeof feedVersionIndex === 'number' &&
    feedVersions.length >= feedVersionIndex
  ) {
    version = sortedVersions[feedVersionIndex - 1]

    if (gtfs.filter.comparedVersion) {
      comparedVersion = sortedVersions.find(feedVer => feedVer && feedVer.id === gtfs.filter.comparedVersion)
    }
  }
  // FIXME: prop drilling.
  return {
    gtfs,
    hasVersions,
    feedVersionIndex,
    gtfsPlusValidation: state.gtfsplus.validation,
    sortedVersions,
    user: state.user,
    version,
    comparedVersion,
    versionIndexDoesNotExist,
    versionSection: subpage,
    versionSummaries: sortedSummaries
  }
}

const mapDispatchToProps = {
  createDeploymentFromFeedSource,
  deleteFeedVersion,
  downloadFeedViaToken,
  downloadGtfsPlusFeed,
  exportVersionShapes,
  fetchGTFSEntities,
  fetchNotesForFeedVersion,
  fetchValidationErrors,
  loadFeedVersionForEditing,
  mergeVersions,
  postNoteForFeedVersion,
  publishFeedVersion,
  renameFeedVersion,
  runFetchFeed,
  setVersionIndex,
  uploadFeed
}

const ActiveFeedVersionNavigator = connect(
  mapStateToProps,
  mapDispatchToProps
)(FeedVersionNavigator)

export default ActiveFeedVersionNavigator
