// @flow

import { getSettingsForThisClient } from '../util/user'
import type { DatatoolsSettings, ModuleType } from '../../types'

/**
 * The permission types that can be defined in the user profile object
 * and which determine a user's role and permissions within the application's
 * modules.
 */
export type PermissionType =
  // Items related to GTFS editing (NOTE: these end in -gtfs not -feed).
  'edit-gtfs' | 'approve-gtfs' |
  // Items related to feed source management.
  'manage-feed' | 'view-feed' |
  // MTC alerts module items
  'approve-alert' | 'edit-alert' |
  // Privileges related to administration of applications, organizations,
  // and projects.
  'administer-application' | 'administer-organization' | 'administer-project'

export type Permission = {
  feeds?: Array<string>,
  module?: ModuleType,
  name?: string,
  type: PermissionType
}

export type Project = {
  defaultFeeds: Array<string>,
  permissions: Array<Permission>,
  project_id: string
}

export type Organization = {
  organization_id: string,
  permissions: Array<Permission>
}

export default class UserPermissions {
  appPermissionLookup: {[string]: Permission} = {}

  organizationLookup: {[string]: Organization} = {}

  orgPermissionLookup: {[string]: Permission} = {}

  projectLookup: {[string]: Project} = {}

  constructor (datatoolsApps?: Array<DatatoolsSettings>) {
    // If missing datatoolsApp, construct an empty permissions object.
    if (!datatoolsApps) return
    else if (!Array.isArray(datatoolsApps)) {
      console.warn('L’utilisateur app_metadata est mal-configuré.', datatoolsApps)
      return
    }
    const datatoolsJson = getSettingsForThisClient(datatoolsApps)
    if (datatoolsJson) {
      const {organizations, permissions, projects} = datatoolsJson
      if (permissions) {
        for (const appPermission of permissions) {
          this.appPermissionLookup[appPermission.type] = appPermission
        }
      }
      if (organizations) {
        for (const organization of organizations) {
          this.organizationLookup[organization.organization_id] = organization
          const {permissions: orgPermissions} = organization
          // There should only be one organization per user, so there shouldn't
          // be any chance that the permission lookup is overwritten.
          for (const permission of orgPermissions) {
            this.orgPermissionLookup[permission.type] = permission
          }
        }
      }
      if (projects) {
        for (const project of projects) {
          this.projectLookup[project.project_id] = project
        }
      }
    } else {
      console.warn('L’utilisateur n’a pas les permissions requises.', datatoolsApps)
    }
  }

  isApplicationAdmin () {
    return ('administer-application' in this.appPermissionLookup)
  }

  hasOrganization (orgId: string) {
    if (this.isApplicationAdmin()) return true
    return (orgId in this.organizationLookup)
  }

  getOrganizationId () {
    const keys = Object.keys(this.organizationLookup)
    return keys && keys.length ? keys[0] : null
  }

  // as opposed to the specific isOrganizationAdmin, this method checks for generic admin access to some organization
  canAdministerAnOrganization () {
    if (this.isApplicationAdmin()) return true
    return ('administer-organization' in this.orgPermissionLookup)
  }

  isOrganizationAdmin (orgId: ?string) {
    if (this.isApplicationAdmin()) return true
    return orgId &&
      this.hasOrganization(orgId) &&
      this.getOrganizationPermission(orgId, 'administer-organization') != null
  }

  getOrganizationPermission (organizationId: string, permissionType: PermissionType) {
    if (!this.hasOrganization(organizationId)) return null
    for (const permission of this.getOrganizationPermissions(organizationId)) {
      if (permission.type === permissionType) return permission
    }
    return null
  }

  getOrganizationPermissions (organizationId: string): Array<Permission> {
    if (!this.hasOrganization(organizationId)) return []
    return this.organizationLookup[organizationId].permissions
  }

  hasProject (projectId: string, organizationId: ?string) {
    if (this.isOrganizationAdmin(organizationId)) return true
    return (projectId in this.projectLookup)
  }

  isProjectAdmin (projectId: string, organizationId: ?string) {
    if (this.isApplicationAdmin()) return true
    // TODO: make project admin subject to org admin
    if (this.isOrganizationAdmin(organizationId)) return true
    return this.hasProject(projectId) && this.getProjectPermission(projectId, 'administer-project') != null
  }

  getProjectPermissions (projectId: string): Array<Permission> {
    if (!this.hasProject(projectId)) return []
    return this.projectLookup[projectId].permissions
  }

  getProjectDefaultFeeds (projectId: string): Array<string> {
    if (!this.hasProject(projectId)) return []
    return this.projectLookup[projectId].defaultFeeds || []
  }

  hasProjectPermission (organizationId: ?string, projectId: string, permissionType: PermissionType) {
    if (this.isProjectAdmin(projectId, organizationId)) return true
    const p = this.getProjectPermission(projectId, permissionType)
    return (p !== null)
  }

  getProjectPermission (projectId: string, permissionType: PermissionType): ?Permission {
    if (!this.hasProject(projectId)) return null
    var projectPermissions = this.getProjectPermissions(projectId)
    for (const permission of projectPermissions) {
      if (permission.type === permissionType) return permission
    }
    return null
  }

  hasFeed (listOfFeeds: Array<string>, feedId: string) {
    if (listOfFeeds.indexOf('*') > -1) return true
    else if (listOfFeeds.indexOf(feedId) > -1) return true
    return null
  }

  hasFeedPermission (organizationId: ?string, projectId: string, feedId: string, permissionType: PermissionType) {
    if (this.isProjectAdmin(projectId, organizationId)) return true
    const permission = this.getProjectPermission(projectId, permissionType)
    if (permission) {
      const defaultFeeds = this.getProjectDefaultFeeds(projectId)
      const permissionFeeds = permission.feeds || []
      if (this.hasFeed(defaultFeeds, feedId)) return true
      if (this.hasFeed(permissionFeeds, feedId)) return true
    }
    return null
  }
}
