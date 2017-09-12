import { connect } from 'react-redux'

import GtfsPlusEditor from '../components/GtfsPlusEditor'
import { fetchFeedSourceAndProject } from '../../manager/actions/feeds'
import {
  addGtfsPlusRow,
  updateGtfsPlusField,
  deleteGtfsPlusRow,
  uploadGtfsPlusFeed,
  downloadGtfsPlusFeed,
  loadGtfsEntities,
  receiveGtfsEntities
} from '../actions/gtfsplus'

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
  }

  return {
    tableData: state.gtfsplus.tableData,
    gtfsEntityLookup: state.gtfsplus.gtfsEntityLookup,
    validation: state.gtfsplus.validation,
    feedSource,
    project,
    user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  const feedVersionId = ownProps.routeParams.feedVersionId

  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.feedSource) dispatch(fetchFeedSourceAndProject(feedSourceId))
      if (!initialProps.tableData) dispatch(downloadGtfsPlusFeed(feedVersionId))
    },
    newRowClicked: (tableId) => dispatch(addGtfsPlusRow(tableId)),
    deleteRowClicked: (tableId, rowIndex) => dispatch(deleteGtfsPlusRow(tableId, rowIndex)),
    fieldEdited: (tableId, rowIndex, fieldName, newValue) => dispatch(updateGtfsPlusField(tableId, rowIndex, fieldName, newValue)),
    feedSaved: (file) => {
      dispatch(uploadGtfsPlusFeed(feedVersionId, file))
      .then(() => dispatch(downloadGtfsPlusFeed(feedVersionId)))
    },
    newRowsDisplayed: (tableId, rows, feedSource) => {
      if (feedSource) dispatch(loadGtfsEntities(tableId, rows, feedSource))
    },
    gtfsEntitySelected: (type, entity) => dispatch(receiveGtfsEntities([entity]))
  }
}

const ActiveGtfsPlusEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsPlusEditor)

export default ActiveGtfsPlusEditor
