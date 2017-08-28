import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import UserAccount from '../components/UserAccount'
import { setVisibilitySearchText } from '../../manager/actions/visibilityFilter'
import { fetchProjects } from '../../manager/actions/projects'
import { fetchFeedSource } from '../../manager/actions/feeds'
import {
  updateUserData,
  fetchUser,
  updateTargetForSubscription,
  removeUserSubscription,
  resetPassword,
  unsubscribeAll
} from '../../manager/actions/user'

const mapStateToProps = (state, ownProps) => {
  return {
    visibilitySearchText: state.projects.filter.searchText,
    projects: state.projects.all,
    user: state.user,
    activeComponent: ownProps.routeParams.subpage,
    projectId: ownProps.routeParams.projectId
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      if (!ownProps.routeParams.subpage) {
        browserHistory.push('/settings/profile')
      }
      if (!initialProps.projects) {
        dispatch(fetchProjects())
        .then(() => {
          const subscriptions = initialProps.user.profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions
          if (subscriptions) {
            Promise.all(
              subscriptions.map(sub => {
                console.log(sub)
                sub.target.map(target => {
                  console.log('queuing feed source ', target)
                  return (dispatch(fetchFeedSource(target)))
                })
              })
            ).then(results => {
              console.log('got feed sources', results)
            })
          }
        })
      } else {
        const subscriptions = initialProps.user.profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions
        if (subscriptions) {
          Promise.all(
            subscriptions.map(sub => {
              console.log(sub)
              sub.target.map(target => {
                console.log('queuing feed source ', target)
                return (dispatch(fetchFeedSource(target)))
              })
            })
          ).then(results => {
            console.log('got feed sources', results)
          })
        }
      }
    },
    searchTextChanged: (text) => dispatch(setVisibilitySearchText(text)),
    updateUserName: (user, permissions) => dispatch(updateUserData(user, permissions)),
    resetPassword: () => dispatch(resetPassword()),
    updateUserSubscription: (profile, target, subscriptionType) => dispatch(updateTargetForSubscription(profile, target, subscriptionType)),
    unsubscribeAll: (profile, target, subscriptionType) => dispatch(unsubscribeAll(profile)),
    removeUserSubscription: (profile, subscriptionType) => dispatch(removeUserSubscription(profile, subscriptionType)),
    fetchUser: (user, permissions) => dispatch(fetchUser(user))
  }
}

const ActiveUserAccount = connect(
  mapStateToProps,
  mapDispatchToProps
)(UserAccount)

export default ActiveUserAccount
