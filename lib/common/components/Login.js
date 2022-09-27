// @flow

import { useAuth0 } from '@auth0/auth0-react'
// $FlowFixMe useEffect not recognized by flow.
import { useEffect } from 'react'
import { browserHistory } from 'react-router'

type Props = {
  redirectOnSuccess?: string
}

/**
 * This component handles the `/login` route by redirecting the browser to the location specified
 * in the `redirectOnSuccess` prop (or to the previously active URL or `/home` if none is specified).
 */
export default function Login ({
  redirectOnSuccess = window.location.path || '/home'
}: Props) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
  useEffect(() => {
    if (!isLoading && redirectOnSuccess) {
      if (!isAuthenticated) {
        // Show the login page if the user state is not logged in.
        loginWithRedirect({
          appState: {
            returnTo: redirectOnSuccess
          }
        })
      } else {
        // Otherwise just go to the target url.
        browserHistory.push(redirectOnSuccess)
      }
    }
  }, [isAuthenticated, isLoading, redirectOnSuccess])

  // Component renders nothing.
  return null
}
