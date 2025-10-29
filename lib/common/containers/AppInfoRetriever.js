// @flow
// $FlowFixMe useEffect not recognized by flow.
import { useEffect } from 'react'
import { connect } from 'react-redux'

import * as statusActions from '../../manager/actions/status'

/**
 * Retrieves the app info and updates the redux state accordingly.
 */
const AppInfoRetriever = ({ appInfoLoaded, children, fetchAppInfo }) => {
  // Fetch app info only once.
  useEffect(fetchAppInfo, [fetchAppInfo])

  // Component renders nothing if app info is not loaded.
  return appInfoLoaded ? children : null
}

const mapStateToProps = (state) => {
  return {
    appInfoLoaded: !!state.status.appInfo
  }
}

const mapDispatchToProps = {
  fetchAppInfo: statusActions.fetchAppInfo
}

export default connect(mapStateToProps, mapDispatchToProps)(AppInfoRetriever)
