// @flow

// minified file is imported because of https://github.com/bugsnag/bugsnag-js/issues/366
import bugsnag from 'bugsnag-js/dist/bugsnag.min'
import createPlugin from 'bugsnag-react'
import omit from 'lodash/omit'
import * as React from 'react'
import {connect} from 'react-redux'
import { Router, Route, browserHistory } from 'react-router'
import { toast } from 'react-toastify'

import AdminPage from '../../admin/components/AdminPage'
import MainAlertsViewer from '../../alerts/containers/MainAlertsViewer'
import ActiveAlertEditor from '../../alerts/containers/ActiveAlertEditor'
import PageNotFound from '../components/PageNotFound'
import ActiveGtfsEditor from '../../editor/containers/ActiveGtfsEditor'
import Login from './Login'
import * as statusActions from '../../manager/actions/status'
import * as userActions from '../../manager/actions/user'
import ActiveFeedSourceViewer from '../../manager/containers/ActiveFeedSourceViewer'
import ActiveProjectsList from '../../manager/containers/ActiveProjectsList'
import ScriptNamingStop from '../../manager/containers/ScriptNamingStop'
import ActiveProjectViewer from '../../manager/containers/ActiveProjectViewer'
import ActivePublicLandingPage from '../../public/containers/ActivePublicLandingPage'
import ActiveUserAccount from '../../public/containers/ActiveUserAccount'
import ActiveUserHomePage from '../../manager/containers/ActiveUserHomePage'
import CreateProject from '../../manager/containers/CreateProject'
import ActiveGtfsPlusEditor from '../../gtfsplus/containers/ActiveGtfsPlusEditor'
import {logPageView} from '../util/analytics'
import type {dispatchFn, getStateFn, AppState, ManagerUserState} from '../../types/reducers'

type AuthWrapperProps = {
  checkLogin: typeof userActions.checkLogin,
  fetchAppInfo: typeof statusActions.fetchAppInfo,
  login: typeof userActions.login,
  user: ManagerUserState
}

function wrapComponentInAuthStrategy (
  ComponentToWrap: React.Component<*>,
  requireAuth?: boolean,
  requireAdmin?: boolean
): React.Component<AuthWrapperProps> {
  class AuthStrategyWrapper extends React.Component<AuthWrapperProps> {
    componentWillMount () {
      const {checkLogin, fetchAppInfo, user} = this.props
      const userIsLoggedIn: boolean = !!user.token
      // Fetch app info before component mounts in order to ensure that checks
      // for enabled modules result use the correct config data.
      fetchAppInfo()
        .then(() => {
          checkLogin(userIsLoggedIn)
          if (userIsLoggedIn) {
            this._checkIfAdmin()
          }
        })
    }

    componentWillReceiveProps (nextProps) {
      const {login, user} = nextProps
      // First check to see if admin privileges are needed.
      this._checkIfAdmin()
      if (
        // Auth required and user is not logged in.
        (requireAuth && !user.isCheckingLogin && !user.token) // ||
        // Token existed previously, but was removed in next props.
        // FIXME: Is this second condition needed here?
        // (this.props.user.token && !user.token)
      ) {
        // If auth is required and the user is not logged in, trigger a log in,
        // which will change the route to '/login' and show the auth0 lock.
        const redirectUrl: string = window.location.pathname
        login(redirectUrl)
      }
    }

    _userHasAdminViewPrivileges () {
      const {user} = this.props
      if (!user || !user.permissions) return false
      if (user.permissions.isApplicationAdmin()) return true
      if (user.permissions && user.permissions.canAdministerAnOrganization()) return true
    }

    _checkIfAdmin () {
      if (requireAdmin &&
        !this.props.user.isCheckingLogin &&
        !this._userHasAdminViewPrivileges()
      ) {
        // If an authenticated, non-admin user attempts to visit an admin page,
        // send them back to the root page.
        browserHistory.push('/')
      }
    }

    render () {
      const {user} = this.props
      if (requireAuth && !user.token) {
        // If user is not authenticated and the page requires it, return the
        // unauthorized user page. We should only get to this point if there is
        // a slight delay in the component lifecycle.
        // When the component receives props, a check for auth will trigger the
        // login with lock.
        return null
      } else {
        // Otherwise, check for admin access and finally just return the page.
        if (requireAdmin && !this._userHasAdminViewPrivileges()) {
          // If admin privileges are required, but the user is not authorized.
          return (
            <div>
              <p>You have attempted to view a restricted page without proper credentials</p>
            </div>
          )
        } else {
          // User is authenticated to view page or it is a public route.
          return (
            // Below Flow issue is related to a mismatch between the
            // React.Component return type and React.Element. This has something
            // to do with the possibility for an iterable to exist here.
            // $FlowFixMe
            <ComponentToWrap
              // Pass props to wrapped component except for auth-specific props
              {...omit(this.props, ['checkLogin', 'children', 'user'])} />
          )
        }
      }
    }
  }
  const {checkLogin, login} = userActions
  const {fetchAppInfo} = statusActions
  return connect(
    // state to props
    (state: AppState) => ({user: state.user}),
    // dispatch to props
    {checkLogin, fetchAppInfo, login}
  )(AuthStrategyWrapper)
}

function loginOptional (ComponentToWrap) {
  return wrapComponentInAuthStrategy(ComponentToWrap)
}

function authRequired (ComponentToWrap) {
  return wrapComponentInAuthStrategy(ComponentToWrap, true)
}

function adminRequired (ComponentToWrap) {
  return wrapComponentInAuthStrategy(ComponentToWrap, true, true)
}

type AppProps = {
  history: any,
  store: {
    dispatch: dispatchFn,
    getState: getStateFn
  }
}

export default class App extends React.Component<AppProps> {
  render () {
    const {history} = this.props
    const routes = [
      {
        path: '/settings(/:subpage)(/:projectId)',
        component: authRequired(ActiveUserAccount)
      },
      {
        path: '/admin(/:subpage)',
        component: adminRequired(AdminPage)
      },
      {
        path: 'alerts',
        component: authRequired(MainAlertsViewer)
      },
      {
        path: 'alerts/new',
        component: authRequired(ActiveAlertEditor)
      },
      {
        path: 'alert/:alertId',
        component: authRequired(ActiveAlertEditor)
      },
      {
        path: '/home(/:projectId)',
        component: authRequired(ActiveUserHomePage)
      },
      {path: '/login', component: Login},
      {path: '/', component: loginOptional(ActivePublicLandingPage)},
      {
        path: '/project',
        component: authRequired(ActiveProjectsList)
      },
      {
        path: '/project/new',
        component: authRequired(CreateProject)
      },
      {
        path: '/project/:projectId(/:subpage)(/:subsubpage)',
        component: authRequired(ActiveProjectViewer)
      },
      {
        path:
          '/feed/:feedSourceId/edit(/:activeComponent)(/:activeEntityId)(/:subComponent)(/:subEntityId)(/:subSubComponent)(/:activeSubSubEntity)',
        component: authRequired(ActiveGtfsEditor)
      },
      {
        path:
          '/feed/:feedSourceId(/version/:feedVersionIndex)(/:subpage)(/:subsubpage)',
        component: authRequired(ActiveFeedSourceViewer)
      },
      {
        path: '/gtfsplus/:feedSourceId/:feedVersionId',
        component: authRequired(ActiveGtfsPlusEditor)
      },
      {
        path: '/teston',
        component: authRequired(ScriptNamingStop)
      },
      {path: '*', component: loginOptional(PageNotFound)}
    ]
    const router = (
      <Router
        history={history}
        onUpdate={logPageView}>
        {routes.map((r, i) => (<Route {...r} key={i} />))}
      </Router>
    )
    // Initialize toast notifications.
    toast.configure()
    // Configure bugsnag if key is provided.
    if (process.env.BUGSNAG_KEY) {
      const bugsnagClient = bugsnag(process.env.BUGSNAG_KEY)
      const ErrorBoundary = bugsnagClient.use(createPlugin(React))
      return (
        <ErrorBoundary>
          {router}
        </ErrorBoundary>
      )
    } else {
      return router
    }
  }
}
