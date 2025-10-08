// @flow
// $FlowFixMe useEffect not recognized by flow.
import { useEffect } from 'react'
import { connect } from 'react-redux'

import * as statusActions from '../../manager/actions/status'
import type { AppState } from '../../types/reducers'

/**
 * Retrieves the app info and updates the redux state accordingly.
 */
const AppInfoRetriever = ({ children, fetchAppInfo, loaded }) => {
  // Fetch app info only once.
  useEffect(fetchAppInfo, [])

  // Component renders nothing.
  return loaded ? children : null
}

const mapStateToProps = (state: AppState) => ({
  loaded: state.status.appInfo?.config
})

const mapDispatchToProps = {
  fetchAppInfo: statusActions.fetchAppInfo
}

export default connect(mapStateToProps, mapDispatchToProps)(AppInfoRetriever)
