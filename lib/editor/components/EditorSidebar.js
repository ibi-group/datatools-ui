import React, {Component, PropTypes} from 'react'

import { GTFS_ICONS } from '../util/ui'
import ActiveSidebarNavItem from '../../common/containers/ActiveSidebarNavItem'
import ActiveSidebar from '../../common/containers/ActiveSidebar'

export default class EditorSidebar extends Component {
  static propTypes = {
    activeComponent: PropTypes.string,
    feedSource: PropTypes.object,
    feedInfo: PropTypes.object,
    setActiveEntity: PropTypes.func
  }
  isActive (item, component) {
    return component === item.id || (component === 'scheduleexception' && item.id === 'calendar')
  }
  render () {
    const {activeComponent, feedSource} = this.props

    return (
      <ActiveSidebar>
        <ActiveSidebarNavItem
          ref='backNav'
          icon='home'
          label='Back to Feed'
          link={feedSource ? `/feed/${feedSource.id}` : `/home`} />
        {GTFS_ICONS.map(item => {
          return item.hideSidebar
            ? null
            : <ActiveSidebarNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={this.isActive(item, activeComponent)}
              link={!feedSource
                ? '/home'
                : activeComponent === item.id
                ? `/feed/${feedSource.id}/edit/`
                : `/feed/${feedSource.id}/edit/${item.id}`} />
        })}
      </ActiveSidebar>
    )
  }
}
