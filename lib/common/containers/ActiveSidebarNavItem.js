// @flow

import { connect } from 'react-redux'

import SidebarNavItem from '../components/SidebarNavItem'

import type {AppState} from '../../types/reducers'

export type Props = {
  'data-test-id'?: string,
  active?: boolean,
  icon: string,
  label: string,
  link?: string
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    expanded: state.ui.sidebarExpanded
  }
}

const mapDispatchToProps = {}
// $FlowFixMe https://github.com/flow-typed/flow-typed/issues/2628
const ActiveSidebarNavItem = connect(
  mapStateToProps,
  mapDispatchToProps
)(SidebarNavItem)

export default ActiveSidebarNavItem
