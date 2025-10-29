// @flow

import {connect} from 'react-redux'

import GtfsPlusEditor from '../components/GtfsPlusEditor'
import * as feedActions from '../../manager/actions/feeds'
import * as gtfsPlusEditorActions from '../actions/gtfsplus'
import * as editorActions from '../../editor/actions/editor'
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
  const feedVersionSummary = feedSource && feedSource.feedVersionSummaries
    ? feedSource.feedVersionSummaries.find(v => v.id === feedVersionId)
    : null
  const feedIsLocked = !state.editor.data.lock.sessionId
  return {
    activeTableId,
    currentPage,
    feedIsLocked,
    feedSource,
    feedSourceId,
    feedVersionId,
    feedVersionSummary,
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
  addGtfsPlusRow: gtfsPlusEditorActions.addGtfsPlusRow,
  deleteGtfsPlusRow: gtfsPlusEditorActions.deleteGtfsPlusFeed,
  downloadGtfsPlusFeed: gtfsPlusEditorActions.downloadGtfsPlusFeed,
  fetchFeedSourceAndProject: feedActions.fetchFeedSourceAndProject,
  loadGtfsEntities: gtfsPlusEditorActions.loadGtfsEntities,
  lockEditorFeedSourceIfNeeded: editorActions.lockEditorFeedSourceIfNeeded,
  receiveGtfsEntities: gtfsPlusEditorActions.receiveGtfsEntities,
  removeEditorLock: editorActions.removeEditorLock,
  setActiveTable: gtfsPlusEditorActions.setActiveTable,
  setCurrentPage: gtfsPlusEditorActions.setCurrentPage,
  setVisibilityFilter: gtfsPlusEditorActions.setVisibilityFilter,
  stopLockTimer: editorActions.stopLockTimer,
  updateGtfsPlusField: gtfsPlusEditorActions.updateGtfsPlusField,
  uploadGtfsPlusFeed: gtfsPlusEditorActions.uploadGtfsPlusFeed
}

const ActiveGtfsPlusEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsPlusEditor)

export default ActiveGtfsPlusEditor
