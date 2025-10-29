// @flow

import { withAuth0 } from '@auth0/auth0-react'
import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar'
import * as userActions from '../../manager/actions/user'
import * as statusActions from '../../manager/actions/status'
import type {AppState} from '../../types/reducers'

export type Props = {}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    appInfo: state.status.appInfo,
    expanded: state.ui.sidebarExpanded,
    hideTutorial: state.ui.hideTutorial,
    jobMonitor: state.status.jobMonitor,
    user: state.user
  }
}

const mapDispatchToProps = {
  logout: userActions.logout,
  removeRetiredJob: statusActions.removeRetiredJob,
  setJobMonitorVisible: statusActions.setJobMonitorVisible,
  startJobMonitor: statusActions.startJobMonitor
}

export default withAuth0(connect(mapStateToProps, mapDispatchToProps)(Sidebar))
