import { connect } from 'react-redux'

import { createAlert, fetchRtdAlerts } from '../actions/alerts'
import AlertsViewer from '../components/AlertsViewer'
import {updatePermissionFilter} from '../../gtfs/actions/filter'
import {getAllFeeds, getActiveFeeds} from '../../gtfs/selectors'
import {fetchProjects} from '../../manager/actions/projects'
import {getActiveProject} from '../../manager/selectors'

const mapStateToProps = (state, ownProps) => {
  return {
    activeFeeds: getActiveFeeds(state),
    alerts: state.alerts.all,
    allFeeds: getAllFeeds(state),
    fetched: state.alerts.fetched,
    isFetching: state.alerts.isFetching,
    permissionFilter: state.gtfs.filter.permissionFilter,
    project: getActiveProject(state),
    user: state.user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      const {alerts, project} = initialProps
      if (project && project.feedSources && (!alerts || alerts.length === 0)) {
        dispatch(fetchRtdAlerts())
      }
      if (!project || !project.feedSources) {
        dispatch(fetchProjects(true))
        .then(project => {
          return dispatch(fetchRtdAlerts())
        })
      }
      if (initialProps.permissionFilter !== 'edit-alert') {
        dispatch(updatePermissionFilter('edit-alert'))
      }
    },
    createAlert: () => dispatch(createAlert()),
    fetchAlerts: () => dispatch(fetchRtdAlerts()),
    onStopClick: (stop, agency) => dispatch(createAlert(stop, agency)),
    onRouteClick: (route, agency) => dispatch(createAlert(route, agency))
  }
}

const MainAlertsViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlertsViewer)

export default MainAlertsViewer
