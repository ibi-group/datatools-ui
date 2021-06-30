// @flow

import {isModuleEnabled} from './config'

import type {PermissionType} from '../user/UserPermissions'
import type {AlertEntity, Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

export function getFeedsForPermission (
  project: ?Project,
  user: ManagerUserState,
  permission: PermissionType
): Array<Feed> {
  if (project && project.feedSources) {
    const {id, organizationId} = project
    return project.feedSources.filter(
      feed =>
        user.permissions && user.permissions.hasFeedPermission(
          organizationId,
          id,
          feed.id,
          permission
        ) !== null
    )
  }
  return []
}

// ensure list of feeds contains all agency IDs for set of entities
export function checkEntitiesForFeeds (
  entities: Array<AlertEntity>,
  feeds: Array<Feed>
): boolean {
  const publishableIds: Array<string> = feeds.map(f => f.id)
  const entityIds: Array<string> = entities
    ? entities.map(entity => entity.agency ? entity.agency.id : '')
    : []
  for (var i = 0; i < entityIds.length; i++) {
    if (publishableIds.indexOf(entityIds[i]) === -1) return false
  }
  return true
}

/**
 * Checks whether it is possible for a user in this application to analyze
 * project deployments
 */
export function deploymentsEnabledAndAccessAllowedForProject (
  project: ?Project,
  user: ManagerUserState
): boolean {
  return !!project &&
    isModuleEnabled('deployment') &&
    !!user.permissions &&
    user.permissions.isProjectAdmin(project.id, project.organizationId)
}
