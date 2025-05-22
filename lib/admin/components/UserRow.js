// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Button, Image, Label as BsLabel } from 'react-bootstrap'
import { connect } from 'react-redux'
import uuidv4 from 'uuid/v4'

import * as adminActions from '../actions/admin'
import ConfirmModal from '../../common/components/ConfirmModal'
import UserPermissions from '../../common/user/UserPermissions'
import { getComponentMessages } from '../../common/util/config'
import { getAccountTypes, getSettingsFromProfile } from '../../common/util/user'
import * as feedActions from '../../manager/actions/feeds'
import * as managerUserActions from '../../manager/actions/user'
import type { AccountTypes, Organization, Project, UserProfile } from '../../types'
import type { AppState, ManagerUserState } from '../../types/reducers'

import UserSettings from './UserSettings'

// Generate random value to avoid conflicting with an existing project name/id.
const MISSING_PROJECT_VALUE = uuidv4()

type Props = {
  accountTypes: AccountTypes,
  creatingUser: ManagerUserState,
  deleteUser: typeof adminActions.deleteUser,
  fetchProjectFeeds: typeof feedActions.fetchProjectFeeds,
  organizations: Array<Organization>,
  projects: Array<Project>,
  updateUserData: typeof managerUserActions.updateUserData,
  user: UserProfile
}

type State = {
  isEditing: boolean
}

class UserRow extends Component<Props, State> {
  messages = getComponentMessages('UserRow')
  state = {
    isEditing: false
  }

  toggleExpansion = () => this.setState({ isEditing: !this.state.isEditing })

  cancel () {
    this.toggleExpansion()
  }

  _getOrgLabel = (permissions: UserPermissions) => {
    const { creatingUser, organizations } = this.props
    if (!organizations) return null
    const userOrganization = organizations.find(o => o.id === permissions.getOrganizationId())
    const creatorIsApplicationAdmin = creatingUser.permissions &&
      creatingUser.permissions.isApplicationAdmin()
    return userOrganization && creatorIsApplicationAdmin
      ? <BsLabel bsStyle='default'>{userOrganization.name}</BsLabel>
      : null
  }

  /**
   * Constructs label indicating user authorization level (e.g., app/org admin)
   * or listing the projects the user has access to.
   */
  _getUserPermissionLabel = (permissions: UserPermissions) => {
    const { projects } = this.props
    // Default label to no projects found.
    let labelText = this.messages('noProjectsFound')
    let missingProjectCount = 0
    let labelStyle, title
    if (permissions.isApplicationAdmin()) {
      labelStyle = 'danger'
      labelText = this.messages('appAdmin')
    } else if (permissions.canAdministerAnOrganization()) {
      labelStyle = 'warning'
      labelText = this.messages('orgAdmin')
    } else {
      const missingProjectIds = []
      // Find project names for any projects that exist.
      const projectNames = Object.keys(permissions.projectLookup)
        .map(id => {
          const project = projects.find(p => p.id === id)
          // Use name of project for label (or track missing project with uuid).
          // A missing project can occur when the same Auth0 tenant is used for
          // multiple instances of Data Tools or if a project is deleted (but
          // the permission is still attached to the user).
          if (project) return project.name
          missingProjectCount++
          missingProjectIds.push(id)
          return MISSING_PROJECT_VALUE
        })
        .filter(name => name)
      const uniqueProjectNames = Array.from(new Set(projectNames))
      // Build message based on number of projects.
      if (uniqueProjectNames.length > 0) {
        if (missingProjectCount > 0) {
          // If any missing project ids, use warning label and show in title.
          labelStyle = 'warning'
          title = `${this.messages('missingProject')}: ${missingProjectIds.join(', ')}`
        } else {
          labelStyle = 'info'
        }
        labelText = uniqueProjectNames
          // Replace uuid with missing project count message.
          .map(name => name === MISSING_PROJECT_VALUE
            ? `${missingProjectCount} ${this.messages('missingProject')}`
            : name
          )
          .join(', ')
      }
    }
    return <BsLabel title={title} bsStyle={labelStyle}>{labelText}</BsLabel>
  }

  save = () => {
    const settings = this.refs.userSettings.getSettings()
    this.props.updateUserData(this.props.user, settings)
    this.toggleExpansion()
  }

  delete = () => {
    this.refs.confirm.open({
      title: `${this.messages('delete')} ${this.props.user.email}?`,
      body: this.messages('deleteConfirm'),
      onConfirm: () => {
        this.props.deleteUser(this.props.user)
        this.toggleExpansion()
      }
    })
  }

  render () {
    const {
      accountTypes,
      creatingUser,
      fetchProjectFeeds,
      organizations,
      projects,
      user
    } = this.props
    const { isEditing } = this.state
    const permissions = new UserPermissions(user.app_metadata && user.app_metadata.datatools)
    const creatorIsApplicationAdmin = creatingUser.permissions &&
      creatingUser.permissions.isApplicationAdmin()
    const creatorDoesNotHaveOrg = !creatingUser.permissions ||
      // $FlowFixMe
      !creatingUser.permissions.hasOrganization(permissions.getOrganizationId())
    // return null if creating user is not app admin and list item user is part of a different org
    if (!creatorIsApplicationAdmin && creatorDoesNotHaveOrg) {
      return null
    }
    const userEmailDataSlug = user.email.split('@')[0]
    const userSettings = getSettingsFromProfile(user)
    const accountType = userSettings && userSettings.account_type

    const accountTypeKeys = Object.keys(accountTypes)
    const hasDefaultKey = accountTypeKeys.includes('default')
    const accountTypeUnknown = accountType && !accountTypeKeys.includes(accountType)

    const isDefault = accountType === 'default'
    const displayName = !accountType || accountTypeUnknown
      ? hasDefaultKey
        ? accountTypes.default.name
        : `${this.messages('unknownAccount')} (${accountType || ''})`
      : accountTypes[accountType].name

    return (
      <>
        <tr>
          <td>
            <Image
              alt='Avatar'
              rounded
              src={user.picture}
              style={{ width: '42px' }}
            />
          </td>
          <td>
            {user.email}
          </td>
          <td>
            {permissions.isApplicationAdmin()
              ? <BsLabel bsStyle='danger'>{this.messages('appAdmin')}</BsLabel>
              // Display non-admin account types if more than one are configured.
              : accountTypeKeys.length > 1 && (
                <BsLabel bsStyle={accountTypeUnknown ? 'warning' : isDefault ? 'default' : 'primary'}>{displayName}</BsLabel>
              )
            }
          </td>
          <td>
            {!permissions.isApplicationAdmin() && this._getUserPermissionLabel(permissions)}
            {' '}
            {this._getOrgLabel(permissions)}
          </td>
          {/* When not editing, show the "Last login" cell and
              show the "actions" column with just the edit button.
              When editing, as a layout hack, hide the "Last login" cell and
              expand the "actions" column over the space where last login is shown,
              so that there is enough space to show the delete/save/cancel buttons. */}
          {!isEditing && (
            <td>
              {user.last_login && new Date(user.last_login).toLocaleString()}
            </td>
          )}
          <td colSpan={isEditing ? 2 : 1}>
            <Button
              className='pull-right'
              data-test-id={`edit-user-${userEmailDataSlug}`}
              onClick={this.toggleExpansion}
            >
              {isEditing
                ? <span><Icon type='remove' /> {this.messages('cancel')}</span>
                : <span><Icon type='edit' /> {this.messages('edit')}</span>
              }
            </Button>
            <span className='pull-right'>
              {isEditing && (
                <>
                  <Button
                    bsStyle='danger'
                    data-test-id={`delete-user-${userEmailDataSlug}`}
                    onClick={this.delete}
                    style={{marginRight: '2px'}}
                    title={this.messages('delete')}
                  >
                    <Icon type='trash' />
                  </Button>
                  <Button
                    bsStyle='primary'
                    data-test-id={`save-user-${userEmailDataSlug}`}
                    onClick={this.save}
                    style={{marginRight: '2px'}}
                    title={this.messages('save')}
                  >
                    <Icon type='check' />
                  </Button>
                </>
              )}
            </span>
          </td>
          <ConfirmModal ref='confirm' />
        </tr>
        {isEditing && (
          <tr>
            <td colSpan={6} style={{ border: 'none' }}>
              <UserSettings
                accountType={accountType}
                creatingUser={creatingUser}
                fetchProjectFeeds={fetchProjectFeeds}
                organizations={organizations}
                permissions={permissions}
                projects={projects}
                ref='userSettings'
                userEmailDataSlug={userEmailDataSlug}
              />
            </td>
          </tr>
        )}
      </>
    )
  }
}

// Connect to redux store
const mapStateToProps = (state: AppState) => {
  return {
    accountTypes: getAccountTypes(state)
  }
}

export default connect(mapStateToProps)(UserRow)
