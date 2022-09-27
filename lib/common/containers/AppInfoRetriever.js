// @flow
// $FlowFixMe useEffect not recognized by flow.
import { useEffect } from 'react'
import { connect } from 'react-redux'

import * as statusActions from '../../manager/actions/status'

/**
 * Retrieves the app info and updates the redux state accordingly.
 */
const AppInfoRetriever = ({ fetchAppInfo }) => {
  // Fetch app info only once.
  useEffect(fetchAppInfo, [])

  // Component renders nothing.
  return null
}

const mapDispatchToProps = {
  fetchAppInfo: statusActions.fetchAppInfo
}

export default connect(null, mapDispatchToProps)(AppInfoRetriever)
