// @flow

import {connect} from 'react-redux'

import {createDeploymentFromFeedSource} from '../actions/deployments'
import {
  createFeedSource,
  deleteFeedSource,
  runFetchFeed,
  updateFeedSource
} from '../actions/feeds'
import {uploadFeed} from '../actions/versions'
import FeedSourceTableRow from '../components/FeedSourceTableRow'
import {getVersionValidationSummaryByFilterStrategy} from '../util/version'
import type {Feed, Project} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  feedSource: Feed,
  project: Project
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {projects, user} = state
  const {feedSource, project} = ownProps
  const comparisonColumn = projects.filter.feedSourceTableComparisonColumn

  return {
    comparisonColumn,
    comparisonValidationSummary: getVersionValidationSummaryByFilterStrategy(
      project,
      feedSource,
      comparisonColumn
    ),
    user
  }
}

const mapDispatchToProps = {
  createDeploymentFromFeedSource,
  createFeedSource,
  deleteFeedSource,
  runFetchFeed,
  updateFeedSource,
  uploadFeed
}

export default connect(mapStateToProps, mapDispatchToProps)(FeedSourceTableRow)
