// @flow

import { connect } from 'react-redux'

import * as deploymentActions from '../actions/deployments'
import * as feedActions from '../actions/feeds'
import * as projectActions from '../actions/projects'
import ProjectViewer from '../components/ProjectViewer'
import type { AppState, RouterProps } from '../../types/reducers'

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
  createFeedSource: feedActions.createFeedSource,
  deleteProject: projectActions.deleteProject,
  deployPublic: projectActions.deployPublic,
  fetchDeployment: deploymentActions.fetchDeployment,
  fetchProjectDeployments: deploymentActions.fetchProjectDeployments,
  onProjectViewerMount: projectActions.onProjectViewerMount,
  updateProject: projectActions.updateProject
}

const ActiveProjectViewer = connect(mapStateToProps, mapDispatchToProps)(
  ProjectViewer
)

export default ActiveProjectViewer
