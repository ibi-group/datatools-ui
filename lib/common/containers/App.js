// @flow

import { AppState, Auth0Provider } from '@auth0/auth0-react'
// minified file is imported because of https://github.com/bugsnag/bugsnag-js/issues/366
import bugsnag from 'bugsnag-js/dist/bugsnag.min'
import createPlugin from 'bugsnag-react'
import * as React from 'react'
import { Router, Route, browserHistory } from 'react-router'
import { toast } from 'react-toastify'

import AdminPage from '../../admin/components/AdminPage'
import MainAlertsViewer from '../../alerts/containers/MainAlertsViewer'
import ActiveAlertEditor from '../../alerts/containers/ActiveAlertEditor'
import Login from '../components/Login'
import PageNotFound from '../components/PageNotFound'
import { AUTH0_CLIENT_ID, AUTH0_DEFAULT_SCOPE, AUTH0_DISABLED, AUTH0_DOMAIN } from '../constants'
import ActiveGtfsEditor from '../../editor/containers/ActiveGtfsEditor'
import ActiveFeedSourceViewer from '../../manager/containers/ActiveFeedSourceViewer'
import ActiveProjectsList from '../../manager/containers/ActiveProjectsList'
import ActiveProjectViewer from '../../manager/containers/ActiveProjectViewer'
import ActiveLicenseTerms from '../../public/containers/ActiveLicenseTerms'
import ActivePublicLandingPage from '../../public/containers/ActivePublicLandingPage'
import ActiveUserAccount from '../../public/containers/ActiveUserAccount'
import ActiveUserHomePage from '../../manager/containers/ActiveUserHomePage'
import CreateProject from '../../manager/containers/CreateProject'
import ActiveGtfsPlusEditor from '../../gtfsplus/containers/ActiveGtfsPlusEditor'
import { logPageView } from '../util/analytics'
import type { dispatchFn, getStateFn } from '../../types/reducers'

import ActiveUserRetriever from './ActiveUserRetriever'
import AppInfoRetriever from './AppInfoRetriever'
import LocalUserRetriever from './LocalUserRetriever'
import wrapComponentInAuthStrategy from './wrapComponentInAuthStrategy'

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
  /**
   * Performs the redirect to the login-protected page after the user has entered credentials.
   */
  handleRedirect = (appState?: AppState) => {
    browserHistory.push((appState && appState.returnTo) || window.location.pathname)
  }

  render () {
    const routes = [
      {
        component: authRequired(ActiveUserAccount),
        path: '/settings(/:subpage)(/:projectId)'
      },
      {
        component: adminRequired(AdminPage),
        path: '/admin(/:subpage)'
      },
      {
        component: authRequired(MainAlertsViewer),
        path: 'alerts'
      },
      {
        component: authRequired(ActiveAlertEditor),
        path: 'alerts/new'
      },
      {
        component: authRequired(ActiveAlertEditor),
        path: 'alert/:alertId'
      },
      {
        component: authRequired(ActiveUserHomePage),
        path: '/home(/:projectId)'
      },
      {
        component: authRequired(ActiveLicenseTerms),
        path: '/license'
      },
      {
        component: Login,
        path: '/login'
      },
      {
        component: loginOptional(ActivePublicLandingPage),
        path: '/'
      },
      {
        component: authRequired(ActiveProjectsList),
        path: '/project'
      },
      {
        component: authRequired(CreateProject),
        path: '/project/new'
      },
      {
        component: authRequired(ActiveProjectViewer),
        path: '/project/:projectId(/:subpage)(/:subsubpage)'
      },
      {
        component: authRequired(ActiveGtfsEditor),
        path:
          '/feed/:feedSourceId/edit(/:activeComponent)(/:activeEntityId)(/:subComponent)(/:subEntityId)(/:subSubComponent)(/:activeSubSubEntity)'
      },
      {
        component: authRequired(ActiveFeedSourceViewer),
        path: '/feed/:feedSourceId(/version/:feedVersionIndex)(/:subpage)(/:subsubpage)'
      },
      {
        component: authRequired(ActiveGtfsPlusEditor),
        path: '/gtfsplus/:feedSourceId/:feedVersionId'
      },
      {
        component: loginOptional(PageNotFound),
        path: '*'
      }
    ]
    const appContent = (
      <>
        <AppInfoRetriever />
        <Router
          history={browserHistory}
          onUpdate={logPageView}>
          {routes.map((r, i) => (<Route {...r} key={i} />))}
        </Router>
      </>
    )
    const routerWithAuth0 = AUTH0_DISABLED ? <>
      <LocalUserRetriever />
      {appContent}
    </>
      : (
        <Auth0Provider
          audience=''
          // Continue to cache tokens in localstorage (speeds up updating login state when refreshing pages).
          cacheLocation='localstorage'
          clientId={AUTH0_CLIENT_ID}
          domain={AUTH0_DOMAIN}
          onRedirectCallback={this.handleRedirect}
          redirectUri={window.location.origin}
          scope={AUTH0_DEFAULT_SCOPE}
        >
          <ActiveUserRetriever />
          {appContent}
        </Auth0Provider>
      )
    // Initialize toast notifications.
    toast.configure()
    // Configure bugsnag if key is provided.
    if (process.env.BUGSNAG_KEY) {
      const bugsnagClient = bugsnag(process.env.BUGSNAG_KEY)
      const ErrorBoundary = bugsnagClient.use(createPlugin(React))
      return (
        <ErrorBoundary>
          {routerWithAuth0}
        </ErrorBoundary>
      )
    } else {
      return routerWithAuth0
    }
  }
}
