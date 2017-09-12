import { connect } from 'react-redux'

import DeploymentViewer from '../components/DeploymentViewer'
import { fetchDeploymentAndProject,
  deployToTarget,
  updateDeployment,
  fetchDeploymentStatus,
  downloadDeployment
} from '../actions/deployments'

import { fetchProjectFeeds } from '../actions/feeds'

const mapStateToProps = (state, ownProps) => {
  const user = state.user
  return {
    user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const deploymentId = ownProps.deployment && ownProps.deployment.id
  return {
    onComponentMount: (initialProps) => {
      if (initialProps.user.profile === null) {
        return
      }
      if (!initialProps.deployment) {
        dispatch(fetchDeploymentAndProject(deploymentId))
        .then((deployment) => {
          console.log(deployment)
          dispatch(fetchProjectFeeds(deployment.project.id))
        })
      }
    },
    deployToTargetClicked: (deployment, target) => dispatch(deployToTarget(deployment, target)),
    downloadDeployment: (deployment) => dispatch(downloadDeployment(deployment)),
    getDeploymentStatus: (deployment, target) => dispatch(fetchDeploymentStatus(deployment, target)),
    updateVersionForFeedSource: (deployment, feedSource, feedVersion) => {
      const feedVersions = [...deployment.feedVersions]
      const index = feedVersions.findIndex(v => v.feedSource.id === feedSource.id)
      feedVersions.splice(index, 1)
      feedVersions.push(feedVersion)
      return dispatch(updateDeployment(deployment, {feedVersions}))
    },
    addFeedVersion: (deployment, feedVersion) => {
      const feedVersions = [...deployment.feedVersions, feedVersion]
      return dispatch(updateDeployment(deployment, {feedVersions}))
    },
    deleteFeedVersion: (deployment, feedVersion) => {
      const feedVersions = deployment.feedVersions
      const index = feedVersions.findIndex(v => v.id === feedVersion.id)
      feedVersions.splice(index, 1)
      return dispatch(updateDeployment(deployment, {feedVersions}))
    },
    updateDeployment: (deployment, changes) => dispatch(updateDeployment(deployment, changes))
  }
}

const ActiveDeploymentViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeploymentViewer)

export default ActiveDeploymentViewer
