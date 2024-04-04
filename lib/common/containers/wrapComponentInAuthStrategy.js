// @flow

import { withAuthenticationRequired } from '@auth0/auth0-react'
import omit from 'lodash/omit'
// $FlowFixMe useEffect not recognized by flow.
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import {getComponentMessages} from '../util/config'
import type {AppState, ManagerUserState} from '../../types/reducers'
import { AUTH0_DISABLED } from '../constants'

type AuthWrapperProps = {
  user: ManagerUserState
}

function userHasAdminViewPrivileges (user: ManagerUserState): boolean {
  const { permissions } = user || {}
  return (!!permissions &&
    (permissions.isApplicationAdmin() || permissions.canAdministerAnOrganization())
  )
}

export default function wrapComponentInAuthStrategy (
  ComponentToWrap: React.Component<*>,
  requireAuth?: boolean,
  requireAdmin?: boolean
): React.Component<AuthWrapperProps> {
  const AuthStrategyWrapper = (props: AuthWrapperProps) => {
    const { user } = props
    const userIsLoggedIn: boolean = !!user.token
    const adminTestFailed = requireAdmin && !user.isCheckingLogin && !userHasAdminViewPrivileges(user)
    const messages = getComponentMessages('WrapComponentInAuthStrategy')

    useEffect(() => {
      // Check admin privs. Redirect to landing page if logged-in user is not admin.
      if (userIsLoggedIn && adminTestFailed) {
        browserHistory.push('/')
      }
    }, [userIsLoggedIn, adminTestFailed])

    if (requireAuth && !user.token) {
      // Don't render anything while the login info is being fetched (i.e. token is null).
      return null
    } else if (adminTestFailed) {
      // If admin privileges are required, but the user is not authorized.
      return (
        <div>
          <p>{messages('adminTestFailed')}</p>
        </div>
      )
    } else {
      // User is authenticated to view page.
      return (
        // Below Flow issue is related to a mismatch between the
        // React.Component return type and React.Element. This has something
        // to do with the possibility for an iterable to exist here.
        // $FlowFixMe
        <ComponentToWrap
          // Pass props to wrapped component except for auth-specific props
          {...omit(props, ['children', 'user'])}
        />
      )
    }
  }

  const connectedComponent = connect(
    (state: AppState) => ({user: state.user})
  )(AuthStrategyWrapper)

  if (!AUTH0_DISABLED && (requireAuth || requireAdmin)) {
    return withAuthenticationRequired(connectedComponent)
  }

  return connectedComponent
}
