// @flow
import { useAuth0 } from '@auth0/auth0-react'
// $FlowFixMe useEffect not recognized by flow.
import { useEffect } from 'react'
import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import * as userActions from '../../manager/actions/user'
import { getAccountTypes, getSettingsFromProfile } from '../util/user'
import type { AccountTypes, UserProfile } from '../../types'
import type { AppState } from '../../types/reducers'

type Props = {
  accountTypes: AccountTypes,
  logout: typeof userActions.logout,
  receiveTokenAndProfile: typeof userActions.receiveTokenAndProfile
}

/**
 * Detect whether to show terms and conditions for the user account.
 */
function showLicenseIfNeeded (accountTypes: AccountTypes, profile: UserProfile) {
  const userSettings = getSettingsFromProfile(profile)
  if (userSettings) {
    const accountType = userSettings.account_type && accountTypes[userSettings.account_type]
    if (
      accountType &&
      // Prefer checking for boolean value true instead of anything that resolves to not-false.
      accountType.require_terms === true &&
      // Prefer checking for boolean value true instead of anything that resolves to not-false.
      userSettings.account_terms_accepted !== true
    ) {
      // Redirect to license page if account is subject to terms and the terms have not been acknowledged.
      browserHistory.push(`/license?returnTo=${window.location.pathname}`)
    }
  }
}

/**
 * Retrieves the active, authenticated user from auth0 and
 * updates the redux state accordingly.
 */
const ActiveUserRetriever = ({ accountTypes, logout, receiveTokenAndProfile }: Props) => {
  const auth0 = useAuth0()
  const {
    error,
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    user: profile
  } = auth0

  // Any time the login state reported by auth0 changes,
  // update the user info in the redux state.
  useEffect(async () => {
    if (isAuthenticated) {
      // Request a detailed response in order to get the user app permissions stored in Auth0.
      const tokenResponse = await getAccessTokenSilently({
        detailedResponse: true
      })
      // TRICKY: What we are passing to the backend is the id_token portion of the response.
      // Unlike the access_token portion, the id_token contains the app_metadata info for the user.
      receiveTokenAndProfile({ profile, token: tokenResponse.id_token })

      // After receiving profile, also detect whether to show terms and conditions for the user account.
      showLicenseIfNeeded(accountTypes, profile)
    } else if (!isLoading) {
      if (error) {
        // If login fails for "technical" reasons (e.g. incorrect settings in env.yml or in Auth0 dashboard),
        // then show the error in a basic prompt.
        alert(error)
      }
      logout(auth0)
    }
  }, [isAuthenticated, isLoading, profile])

  useEffect(() => {
    if (isAuthenticated) {
      // Detect whether to show terms and conditions for the user account.
      showLicenseIfNeeded(accountTypes, profile)
    }
  }, [isAuthenticated, profile, accountTypes])

  // Component renders nothing.
  return null
}

const mapStateToProps = (state: AppState) => {
  return {
    accountTypes: getAccountTypes(state)
  }
}

const mapDispatchToProps = {
  logout: userActions.logout,
  receiveTokenAndProfile: userActions.receiveTokenAndProfile
}

export default connect(mapStateToProps, mapDispatchToProps)(ActiveUserRetriever)
