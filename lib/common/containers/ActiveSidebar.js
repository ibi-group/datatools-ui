import { connect } from 'react-redux'

import Sidebar from '../components/Sidebar'
import { login, logout, resetPassword, revokeToken } from '../../manager/actions/user'
import { setActiveLanguage } from '../../manager/actions/languages'
import { setJobMonitorVisible, removeRetiredJob, startJobMonitor } from '../../manager/actions/status'
import { setSidebarExpanded, setTutorialHidden } from '../../manager/actions/ui'

const mapStateToProps = (state, ownProps) => {
  return {
    expanded: state.ui.sidebarExpanded,
    hideTutorial: state.ui.hideTutorial,
    username: state.user.profile ? state.user.profile.email : null,
    // userPicture: state.user.profile ? state.user.profile.picture : null,
    userIsAdmin: state.user.profile && state.user.permissions.isApplicationAdmin(),
    profile: state.user.profile,
    projects: state.projects ? state.projects : null,
    languages: state.languages ? state.languages : ['English', 'Español', 'Français'],
    jobMonitor: state.status.jobMonitor
  }
}

const mapDispatchToProps = {
  login,
  logout,
  removeRetiredJob,
  resetPassword,
  revokeToken,
  setActiveLanguage,
  startJobMonitor,
  setJobMonitorVisible,
  setSidebarExpanded,
  setTutorialHidden
}

const ActiveSidebar = connect(mapStateToProps, mapDispatchToProps)(Sidebar)

export default ActiveSidebar
