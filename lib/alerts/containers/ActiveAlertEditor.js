import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import {
  createAlert,
  deleteAlert,
  fetchRtdAlerts,
  saveAlert,
  setActiveAlert
} from '../actions/alerts'
import {
  setActiveProperty,
  setActivePublished,
  addActiveEntity,
  deleteActiveEntity,
  updateActiveEntity
} from '../actions/activeAlert'
import AlertEditor from '../components/AlertEditor'
import { getFeedsForPermission } from '../../common/util/permissions'
import {updatePermissionFilter} from '../../gtfs/actions/filter'
import {getActiveFeeds} from '../../gtfs/selectors'
import {fetchProjects} from '../../manager/actions/projects'
import {getActiveProject} from '../../manager/selectors'

const mapStateToProps = (state, ownProps) => {
  return {
    activeFeeds: getActiveFeeds(state),
    alert: state.alerts.active,
    editableFeeds: getFeedsForPermission(getActiveProject(state), state.user, 'edit-alert'),
    permissionFilter: state.gtfs.filter.permissionFilter,
    project: getActiveProject(state),
    publishableFeeds: getFeedsForPermission(getActiveProject(state), state.user, 'approve-alert'),
    user: state.user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      const {location, alert, user} = initialProps
      const alertId = location.pathname.split('/alert/')[1]
      if (alert) return
      let activeProject
      dispatch(fetchProjects(true))
      .then(project => {
        activeProject = project
        return dispatch(fetchRtdAlerts())
      })
      // logic for creating new alert or setting active alert (and checking project permissions)
      .then(() => {
        if (!user.permissions.hasProjectPermission(activeProject.organizationId, activeProject.id, 'edit-alert')) {
          console.log('cannot create alert!')
          browserHistory.push('/alerts')
          return
        }
        if (!alertId) {
          dispatch(createAlert())
        } else {
          dispatch(setActiveAlert(+alertId))
        }
        if (initialProps.permissionFilter !== 'edit-alert') {
          dispatch(updatePermissionFilter('edit-alert'))
        }
      })
    },
    onSaveClick: (alert) => dispatch(saveAlert(alert)),
    onDeleteClick: (alert) => dispatch(deleteAlert(alert)),
    onPublishClick: (alert, published) => dispatch(setActivePublished(published)),
    propertyChanged: (payload) => dispatch(setActiveProperty(payload)),
    onAddEntityClick: (type, value, agency, newEntityId) => dispatch(addActiveEntity(type, value, agency, newEntityId)),
    onDeleteEntityClick: (entity) => dispatch(deleteActiveEntity(entity)),
    entityUpdated: (entity, field, value, agency) => dispatch(updateActiveEntity(entity, field, value, agency)),

    editorStopClick: (stop, agency, newEntityId) => dispatch(addActiveEntity('STOP', stop, agency, newEntityId)),
    editorRouteClick: (route, agency, newEntityId) => dispatch(addActiveEntity('ROUTE', route, agency, newEntityId))
  }
}

const ActiveAlertEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlertEditor)

export default ActiveAlertEditor
