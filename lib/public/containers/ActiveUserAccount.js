// @flow

import { connect } from 'react-redux'

import UserAccount from '../components/UserAccount'
import * as visibilityFilterActions from '../../manager/actions/visibilityFilter'
import * as feedsActions from '../../manager/actions/feeds'
import * as deploymentsActions from '../../manager/actions/deployments'
import * as projectsActions from '../../manager/actions/projects'
import * as userActions from '../../manager/actions/user'
import type {AppState, RouterProps} from '../../types/reducers'

export type Props = RouterProps

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    activeComponent: ownProps.routeParams.subpage,
    projectId: ownProps.routeParams.projectId,
    projects: state.projects.all,
    user: state.user,
    visibilitySearchText: state.projects.filter.searchText
  }
}

const mapDispatchToProps = {
  fetchProjectDeployments: deploymentsActions.fetchProjectDeployments,
  fetchProjectFeeds: feedsActions.fetchProjectFeeds,
  fetchProjects: projectsActions.fetchProjects,
  sendPasswordReset: userActions.sendPasswordReset,
  setVisibilitySearchText: visibilityFilterActions.setVisibilitySearchText,
  unsubscribeAll: userActions.unsubscribeAll,
  updateTargetForSubscription: userActions.updateTargetForSubscription,
  updateUserData: userActions.updateUserData
}

export default connect(mapStateToProps, mapDispatchToProps)(UserAccount)
