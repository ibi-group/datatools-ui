// @flow

import {connect} from 'react-redux'

import {
  addFeedVersion,
  deployToTarget,
  downloadBuildArtifact,
  downloadDeployment,
  downloadDeploymentShapes,
  fetchDeployment,
  incrementAllVersionsToLatest,
  terminateEC2InstanceForDeployment,
  updateDeployment
} from '../actions/deployments'
import DeploymentViewer from '../components/deployment/DeploymentViewer'
import type {Deployment, Feed, Project} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  deployment: Deployment,
  feedSources: Array<Feed>,
  project: Project
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const user = state.user
  const deployJobs = state.status.jobMonitor.jobs
    .filter(job => job.deploymentId === ownProps.deployment.id)
  return {
    deployJobs,
    user
  }
}

const mapDispatchToProps = {
  addFeedVersion,
  deployToTarget,
  downloadBuildArtifact,
  downloadDeployment,
  downloadDeploymentShapes,
  fetchDeployment,
  incrementAllVersionsToLatest,
  terminateEC2InstanceForDeployment,
  updateDeployment
}

const ActiveDeploymentViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeploymentViewer)

export default ActiveDeploymentViewer
