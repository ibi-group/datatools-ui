// @flow

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

export const GTFS_ICONS = [
  {
    id: 'feedinfo',
    tableName: 'feedinfo',
    icon: 'info',
    addable: false,
    title: 'Edit feed info',
    label: 'Feed Info'
  },
  {
    id: 'agency',
    tableName: 'agency',
    icon: 'building',
    addable: true,
    title: 'Edit agencies',
    label: 'Agencies'
  },
  {
    id: 'route',
    tableName: 'routes',
    icon: 'bus',
    addable: true,
    title: 'Edit routes',
    label: 'Routes'
  },
  {
    id: 'stop',
    tableName: 'stops',
    icon: 'map-marker',
    addable: true,
    title: 'Edit stops',
    label: 'Stops'
  },
  {
    id: 'calendar',
    tableName: 'calendar',
    icon: 'calendar',
    addable: true,
    title: 'Edit calendars',
    label: 'Calendars'
  },
  {
    id: 'scheduleexception',
    tableName: 'scheduleexception',
    icon: 'ban',
    addable: true,
    hideSidebar: true,
    title: 'Edit schedule exceptions',
    label: 'Schedule Exceptions'
  },
  {
    id: 'fare',
    tableName: 'fare',
    icon: 'ticket',
    addable: true,
    title: 'Edit fares',
    label: 'Fares'
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
