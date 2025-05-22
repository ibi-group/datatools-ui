// @flow

import {getComponentMessages} from '../../common/util/config'
import type { Feed } from '../../types'
import type { ManagerUserState } from '../../types/reducers'

export type GtfsIcon = {
  addable: boolean,
  hideSidebar?: boolean,
  icon: string,
  id: string,
  label: string,
  tableName: string,
  title: string
}

const messages = getComponentMessages('GtfsIcons')

export const GTFS_ICONS = [
  {
    id: 'feedinfo',
    tableName: 'feedinfo',
    icon: 'info',
    addable: false,
    title: messages('feedinfo.title'),
    label: messages('feedinfo.label')
  },
  {
    id: 'agency',
    tableName: 'agency',
    icon: 'building',
    addable: true,
    title: messages('agency.title'),
    label: messages('agency.label')
  },
  {
    id: 'route',
    tableName: 'routes',
    icon: 'bus',
    addable: true,
    title: messages('route.title'),
    label: messages('route.label')
  },
  {
    id: 'stop',
    tableName: 'stops',
    icon: 'map-marker',
    addable: true,
    title: messages('stop.title'),
    label: messages('stop.label')
  },
  {
    id: 'calendar',
    tableName: 'calendar',
    icon: 'calendar',
    addable: true,
    title: messages('calendar.title'),
    label: messages('calendar.label')
  },
  {
    id: 'scheduleexception',
    tableName: 'scheduleexception',
    icon: 'ban',
    addable: true,
    hideSidebar: true,
    title: messages('scheduleexception.title'),
    label: messages('scheduleexception.label')
  },
  {
    id: 'fare',
    tableName: 'fare',
    icon: 'ticket',
    addable: true,
    title: messages('fare.title'),
    label: messages('fare.label')
  }
]

/**
 * Returns the editor status
 * @param {*} feedSource
 */
export function getEditorEnabledState (feedSource: Feed, user: ManagerUserState, feedIsLocked: boolean) {
  let editingIsDisabled = true
  let permissionProblem = 'no feed source'
  if (feedSource) {
    // FIXME: warn user if they don't have edit privileges
    const {id, name, projectId, organizationId} = feedSource

    // check if editing is forbidden
    if (!user.permissions) {
      permissionProblem = 'undefined user privileges'
    } else if (!user.permissions.hasFeedPermission(organizationId, projectId, id, 'edit-gtfs')) {
      permissionProblem = 'insufficient user privileges'
    } else if (feedIsLocked) {
      permissionProblem = 'feed is locked'
    } else {
      permissionProblem = 'none'
      editingIsDisabled = false
    }

    if (editingIsDisabled) {
      console.warn(`User does not have permission to edit GTFS for ${name}. Problem: ${permissionProblem}`)
    }
  }

  return {
    editingIsDisabled,
    permissionProblem
  }
}
