import React, { Component, PropTypes } from 'react'
import { Router, Route, browserHistory } from 'react-router'

import { checkExistingLogin, login } from '../../manager/actions/user'
import { isModuleEnabled } from '../util/config'

import ActiveFeedSourceViewer from '../../manager/containers/ActiveFeedSourceViewer'
import ActiveProjectViewer from '../../manager/containers/ActiveProjectViewer'
import ActiveProjectsList from '../../manager/containers/ActiveProjectsList'
import ActivePublicFeedSourceViewer from '../../public/containers/ActivePublicFeedSourceViewer'
import ActiveDeploymentViewer from '../../manager/containers/ActiveDeploymentViewer'
import ActivePublicFeedsViewer from '../../public/containers/ActivePublicFeedsViewer'
import ActiveSignupPage from '../../public/containers/ActiveSignupPage'
import ActiveUserHomePage from '../../manager/containers/ActiveUserHomePage'
import ActiveUserAccount from '../../public/containers/ActiveUserAccount'
import ActiveUserAdmin from '../../admin/containers/ActiveUserAdmin'
import MainAlertsViewer from '../../alerts/containers/MainAlertsViewer'
import ActiveAlertEditor from '../../alerts/containers/ActiveAlertEditor'
import MainSignsViewer from '../../signs/containers/MainSignsViewer'
import ActiveSignEditor from '../../signs/containers/ActiveSignEditor'
import PageNotFound from '../components/PageNotFound'
import ActiveGtfsPlusEditor from '../../gtfsplus/containers/ActiveGtfsPlusEditor'
import ActiveGtfsEditor from '../../editor/containers/ActiveGtfsEditor'

export default class App extends Component {
  static propTypes = {
    checkExistingLogin: PropTypes.func,
    store: PropTypes.object,
    user: PropTypes.object,
    login: PropTypes.func,
    history: PropTypes.object
  }

  checkLogin = (nextState, replace, callback) => {
    const {dispatch} = this.props.store
    dispatch(checkExistingLogin({required: false}))
    .then((action) => {
      callback()
    })
  }

  requireAdmin = (nextState, replace, callback) => {
    const {dispatch, getState} = this.props.store
    dispatch(checkExistingLogin({required: 'ADMIN'}))
    .then((action) => {
      // get user after action has been dispatched
      const {user} = getState()
      if (user.profile === null) {
        // user does not exist
        browserHistory.push('/')
      } else if (user.permissions.isApplicationAdmin() || user.permissions.canAdministerAnOrganization()) {
        // user is admin / success callback
        callback()
      } else {
        // user exists, but is not admin, back to home page
        browserHistory.push('/')
      }
    })
  }

  requireAuth = (nextState, replace, callback) => {
    const {dispatch, getState} = this.props.store
    dispatch(checkExistingLogin({required: 'AUTH'}))
    .then((action) => {
      // get user after action has been dispatched
      const {user} = getState()
      if (user.profile === null) {
        // user does not exist, show (un-closable) login lock
        dispatch(login(null, null, {closable: false}, callback))
        .then(() => callback())
      } else {
        // user was found / success callback
        callback()
      }
    })
  }

  render () {
    const {history} = this.props
    const routes = [
      {path: '/settings(/:subpage)(/:projectId)', component: ActiveUserAccount, onEnter: this.requireAuth},
      {path: '/admin(/:subpage)', component: ActiveUserAdmin, onEnter: this.requireAdmin},
      {path: '/signup', component: ActiveSignupPage, onEnter: this.checkLogin},
      {path: '/home(/:projectId)', component: ActiveUserHomePage, onEnter: this.requireAuth},
      {path: '/', component: ActivePublicFeedsViewer, onEnter: this.checkLogin},
      {path: '/public/feed/:feedSourceId(/version/:feedVersionIndex)', component: ActivePublicFeedSourceViewer, onEnter: this.checkLogin},
      {path: '/project', component: ActiveProjectsList, onEnter: this.requireAuth},
      {path: '/project/:projectId(/:subpage)(/:subsubpage)', component: ActiveProjectViewer, onEnter: this.requireAuth},
      {
        path: '/feed/:feedSourceId/edit(/:activeComponent)(/:activeEntityId)(/:subComponent)(/:subEntityId)(/:subSubComponent)(/:activeSubSubEntity)',
        component: ActiveGtfsEditor,
        onEnter: this.requireAuth
      },
      {path: '/feed/:feedSourceId(/version/:feedVersionIndex)(/:subpage)(/:subsubpage)', component: ActiveFeedSourceViewer, onEnter: this.requireAuth},
      {path: '/deployment/:deploymentId', component: ActiveDeploymentViewer, onEnter: this.requireAuth},
      {path: '/gtfsplus/:feedSourceId/:feedVersionId', component: ActiveGtfsPlusEditor, onEnter: this.requireAuth},
      {path: '*', component: PageNotFound, onEnter: this.checkLogin}
    ]

    // register routes if alerts module enabled (unshift so they're before wildcard route)
    if (isModuleEnabled('alerts')) {
      routes.unshift(
        {path: 'alerts', component: MainAlertsViewer, onEnter: this.requireAuth},
        {path: 'alerts/new', component: ActiveAlertEditor, onEnter: this.requireAuth},
        {path: 'alerts/alert/:alertId', component: ActiveAlertEditor, onEnter: this.requireAuth},
      )
    }

    // register routes if sign_config module enabled (unshift so they're before wildcard route)
    if (isModuleEnabled('sign_config')) {
      routes.unshift(
        {path: 'signs', component: MainSignsViewer, onEnter: this.requireAuth},
        {path: 'signs/new', component: ActiveSignEditor, onEnter: this.requireAuth},
        {path: 'signs/sign/:signId', component: ActiveSignEditor, onEnter: this.requireAuth},
      )
    }

    return <Router history={history}>
      {routes.map((r, i) => (<Route {...r} key={i} />))}
    </Router>
  }
}
