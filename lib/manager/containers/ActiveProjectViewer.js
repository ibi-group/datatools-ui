// @flow

import {connect} from 'react-redux'

import {fetchDeployment, fetchProjectDeployments} from '../actions/deployments'
import {createFeedSource} from '../actions/feeds'
import {
  deleteProject,
  deployPublic,
  onProjectViewerMount,
  updateProject
} from '../actions/projects'
import ProjectViewer from '../components/ProjectViewer'
import type {AppState, RouterProps} from '../../types/reducers'

export type Props = RouterProps

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {user} = state
  const {all, isFetching} = state.projects
  const {
    projectId,
    subpage: activeComponent,
    subsubpage: activeSubComponent
  } = ownProps.routeParams
  const project = all ? all.find(p => p.id === projectId) : null
  return {
    activeComponent,
    activeSubComponent,
    isFetching,
    project,
    projectId,
    user
  }
}

const mapDispatchToProps = {
  createFeedSource,
  deleteProject,
  deployPublic,
  fetchDeployment,
  fetchProjectDeployments,
  onProjectViewerMount,
  updateProject
}

const ActiveProjectViewer = connect(mapStateToProps, mapDispatchToProps)(
  ProjectViewer
)

export default ActiveProjectViewer
