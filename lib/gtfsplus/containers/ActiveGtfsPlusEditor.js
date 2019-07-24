// @flow

import {connect} from 'react-redux'

import GtfsPlusEditor from '../components/GtfsPlusEditor'
import {fetchFeedSourceAndProject} from '../../manager/actions/feeds'
import {
  addGtfsPlusRow,
  updateGtfsPlusField,
  deleteGtfsPlusRow,
  uploadGtfsPlusFeed,
  downloadGtfsPlusFeed,
  loadGtfsEntities,
  receiveGtfsEntities,
  setActiveTable,
  setCurrentPage,
  setVisibilityFilter
} from '../actions/gtfsplus'
import {getValidationIssuesForTable, getVisibleRows, getFilteredPageCount} from '../selectors'

import type {AppState, RouterProps} from '../../types/reducers'

export type Props = RouterProps

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {
    activeTableId,
    currentPage,
    gtfsEntityLookup,
    recordsPerPage,
    tableData,
    visibility
  } = state.gtfsplus
  const validation = getValidationIssuesForTable(state)
  const {feedSourceId, feedVersionId} = ownProps.routeParams
  const {user} = state
  // find the containing project
  const project = state.projects.all
    ? state.projects.all.find(p => p.feedSources &&
        p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1
    )
    : null
  const feedSource = project && project.feedSources
    ? project.feedSources.find(fs => fs.id === feedSourceId)
    : null
  const feedVersion = feedSource && feedSource.feedVersions
    ? feedSource.feedVersions.find(v => v.id === feedVersionId)
    : null
  return {
    activeTableId,
    currentPage,
    feedSource,
    feedSourceId,
    feedVersion,
    feedVersionId,
    gtfsEntityLookup,
    pageCount: getFilteredPageCount(state),
    project,
    recordsPerPage,
    tableData,
    user,
    validation,
    visibility,
    visibleRows: getVisibleRows(state)
  }
}

const mapDispatchToProps = {
  addGtfsPlusRow,
  deleteGtfsPlusRow,
  downloadGtfsPlusFeed,
  fetchFeedSourceAndProject,
  loadGtfsEntities,
  receiveGtfsEntities,
  setActiveTable,
  setCurrentPage,
  setVisibilityFilter,
  updateGtfsPlusField,
  uploadGtfsPlusFeed
}

const ActiveGtfsPlusEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsPlusEditor)

export default ActiveGtfsPlusEditor
