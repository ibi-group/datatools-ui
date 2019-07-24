// @flow

import {connect} from 'react-redux'

import GtfsPlusVersionSummary from '../components/GtfsPlusVersionSummary'

import {deleteGtfsPlusFeed, downloadGtfsPlusFeed, publishGtfsPlusFeed} from '../actions/gtfsplus'
import {getValidationIssuesForTable} from '../selectors'

import type {FeedVersion} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  version: FeedVersion,
  versions: Array<FeedVersion>
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    gtfsplus: state.gtfsplus,
    issuesForTable: getValidationIssuesForTable(state),
    user: state.user
  }
}

const mapDispatchToProps = {
  deleteGtfsPlusFeed,
  downloadGtfsPlusFeed,
  publishGtfsPlusFeed
}

const ActiveGtfsPlusVersionSummary = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsPlusVersionSummary)

export default ActiveGtfsPlusVersionSummary
