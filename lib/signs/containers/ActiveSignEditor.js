import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import {
  createDisplay,
  createSign,
  deleteSign,
  fetchRtdSigns,
  saveSign,
  setActiveSign
} from '../actions/signs'
import {
  addActiveEntity,
  deleteActiveEntity,
  setActiveTitle,
  setActiveUrl,
  setActiveCause,
  setActiveEffect,
  setActiveStart,
  setActiveEnd,
  setActivePublished,
  toggleConfigForDisplay,
  updateActiveEntity,
  updateDisplays
} from '../actions/activeSign'
import SignEditor from '../components/SignEditor'
import { getFeedsForPermission } from '../../common/util/permissions'
import {updatePermissionFilter} from '../../gtfs/actions/filter'
import {getActiveFeeds} from '../../gtfs/selectors'
import { fetchProjects } from '../../manager/actions/projects'
import {getActiveProject} from '../../manager/selectors'

const mapStateToProps = (state, ownProps) => {
  return {
    sign: state.signs.active,
    activeFeeds: getActiveFeeds(state),
    project: getActiveProject(state),
    user: state.user,
    editableFeeds: getFeedsForPermission(getActiveProject(state), state.user, 'edit-etid'),
    permissionFilter: state.gtfs.filter.permissionFilter,
    publishableFeeds: getFeedsForPermission(getActiveProject(state), state.user, 'approve-etid')
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      const signId = initialProps.location.pathname.split('/sign/')[1]
      if (initialProps.sign) {
        return
      }
      let activeProject
      dispatch(fetchProjects(true))
      .then(project => {
        activeProject = project
        return dispatch(fetchRtdSigns())
      })
      // logic for creating new sign or setting active sign (and checking project permissions)
      .then(() => {
        if (!initialProps.user.permissions.hasProjectPermission(activeProject.organizationId, activeProject.id, 'edit-etid')) {
          console.log('cannot create sign!')
          browserHistory.push('/signs')
          return
        }
        if (!signId) {
          return dispatch(createSign())
        } else {
          dispatch(setActiveSign(+signId))
        }
      })
      if (initialProps.permissionFilter !== 'edit-etid') {
        dispatch(updatePermissionFilter('edit-etid'))
      }
    },
    createDisplay: (displayName) => dispatch(createDisplay(displayName)),
    updateDisplays: (displayList) => dispatch(updateDisplays(displayList)),
    toggleConfigForDisplay: (display, configType, draftConfigId) => dispatch(toggleConfigForDisplay(display, configType, draftConfigId)),
    onSaveClick: (sign) => dispatch(saveSign(sign)),
    onDeleteClick: (sign) => dispatch(deleteSign(sign)),
    onPublishClick: (sign, published) => dispatch(setActivePublished(published)),
    titleChanged: (title) => dispatch(setActiveTitle(title)),
    // descriptionChanged: (description) => dispatch(setActiveDescription(description)),
    urlChanged: (title) => dispatch(setActiveUrl(title)),
    causeChanged: (cause) => dispatch(setActiveCause(cause)),
    effectChanged: (effect) => dispatch(setActiveEffect(effect)),
    startChanged: (start) => dispatch(setActiveStart(start)),
    endChanged: (end) => dispatch(setActiveEnd(end)),
    onAddEntityClick: (type, value, agency, newEntityId) => dispatch(addActiveEntity(type, value, agency, newEntityId)),
    onDeleteEntityClick: (entity) => dispatch(deleteActiveEntity(entity)),
    entityUpdated: (entity, field, value, agency) => dispatch(updateActiveEntity(entity, field, value, agency)),

    editorStopClick: (stop, agency, newEntityId) => dispatch(addActiveEntity('STOP', stop, agency, newEntityId)),
    editorRouteClick: (route, agency, newEntityId) => dispatch(addActiveEntity('ROUTE', route, agency, newEntityId))
  }
}

const ActiveSignEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(SignEditor)

export default ActiveSignEditor
