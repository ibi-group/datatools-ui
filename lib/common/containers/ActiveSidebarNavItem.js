import { connect } from 'react-redux'

import SidebarNavItem from '../components/SidebarNavItem'

const mapStateToProps = (state, ownProps) => {
  return {
    expanded: state.ui.sidebarExpanded
  }
}

const mapDispatchToProps = {}

var ActiveSidebarNavItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(SidebarNavItem)

export default ActiveSidebarNavItem
