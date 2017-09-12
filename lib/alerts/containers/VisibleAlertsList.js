import {connect} from 'react-redux'

import {
  editAlert,
  deleteAlert
} from '../actions/alerts'
import {
  setAlertAgencyFilter,
  setAlertSort,
  setVisibilityFilter,
  setVisibilitySearchText
} from '../actions/visibilityFilter'
import {getFeedsForPermission} from '../../common/util/permissions'
import AlertsList from '../components/AlertsList'
import {getActiveProject} from '../../manager/selectors'
import {getVisibleAlerts} from '../selectors'

const mapStateToProps = (state, ownProps) => {
  const activeProject = getActiveProject(state)
  return {
    fetched: state.alerts.fetched,
    isFetching: state.alerts.isFetching,
    alerts: getVisibleAlerts(state),
    visibilityFilter: state.alerts.filter,
    feeds: activeProject && activeProject.feedSources ? activeProject.feedSources : [],
    editableFeeds: getFeedsForPermission(activeProject, state.user, 'edit-alert'),
    publishableFeeds: getFeedsForPermission(activeProject, state.user, 'approve-alert'),
    filterCounts: state.alerts.counts
  }
}

const mapDispatchToProps = {
  onEditClick: editAlert,
  onDeleteClick: deleteAlert,
  searchTextChanged: setVisibilitySearchText,
  visibilityFilterChanged: setVisibilityFilter,
  agencyFilterChanged: setAlertAgencyFilter,
  sortChanged: setAlertSort
}

const VisibleAlertsList = connect(mapStateToProps, mapDispatchToProps)(AlertsList)

export default VisibleAlertsList
