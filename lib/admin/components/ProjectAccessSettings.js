// @flow

import React, {Component} from 'react'
import {Row, Col, Checkbox, ButtonGroup} from 'react-bootstrap'

import OptionButton from '../../common/components/OptionButton'
import {getComponentMessages, isModuleEnabled} from '../../common/util/config'
import * as feedActions from '../../manager/actions/feeds'
import allPermissions from './permissions'

import type {PermissionType} from '../../common/user/UserPermissions'
import type {Project} from '../../types'

type ProjectSettingsType = {
  access: string,
  defaultFeeds: Array<string>,
  permissions: Array<string>
}

type Props = {
  fetchProjectFeeds: typeof feedActions.fetchProjectFeeds,
  project: Project,
  projectAccessUpdated: (string, string) => void,
  projectFeedsUpdated: (string, string, boolean) => void,
  projectPermissionsUpdated: (string, PermissionType, boolean) => void,
  settings: ProjectSettingsType,
  visible: boolean
}

type State = {
  projectSettings: ProjectSettingsType
}

const ACCESS_TYPES = [{
  type: 'none',
  message: 'noAccess'
}, {
  type: 'admin',
  message: 'admin'
}, {
  type: 'custom',
  message: 'custom'
}]

export default class ProjectAccessSettings extends Component<Props, State> {
  messages = getComponentMessages('ProjectAccessSettings')

  componentWillMount () {
    this.setState({ projectSettings: this.props.settings })
    if (!this.props.project.feedSources) {
      this.props.fetchProjectFeeds(this.props.project.id)
    }
  }

  setAccess = (access: string) => {
    this.props.projectAccessUpdated(this.props.project.id, access)
  }

  /**
   * Add/remove a access to a feed for a user.
   */
  onToggleFeedSource = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {project, projectFeedsUpdated} = this.props
    projectFeedsUpdated(project.id, evt.target.name, evt.target.checked)
  }

  /**
   * Add/remove a permission for a user on a specific project (applies to set of
   * default feeds).
   */
  onTogglePermission = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {project, projectPermissionsUpdated} = this.props
    // Cast name to permission type to make flow happy.
    const type = ((evt.target.name: any): PermissionType)
    projectPermissionsUpdated(project.id, type, evt.target.checked)
  }

  render () {
    const {
      project,
      visible,
      settings
    } = this.props
    let feedSources = project.feedSources
    if (feedSources) {
      feedSources = feedSources.slice(0).sort((a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      })
    }
    return (
      <Row style={{ display: visible ? 'block' : 'none' }}>
        <Col xs={12}>
          <Row>
            <Col xs={12}>
              <ButtonGroup>
                {ACCESS_TYPES.map(a => (
                  <OptionButton
                    active={settings.access === a.type}
                    key={a.type}
                    onClick={this.setAccess}
                    value={a.type}>
                    {this.messages(`${a.message}`)}
                  </OptionButton>
                ))}
              </ButtonGroup>
            </Col>
          </Row>
          {settings.access === 'custom'
            ? <Row>
              <Col xs={6}>
                <h4>{this.messages('feeds')}</h4>
                {feedSources
                  ? feedSources.map((feed, i) => (
                    <Checkbox
                      key={feed.id}
                      name={feed.id}
                      checked={settings.defaultFeeds.indexOf(feed.id) !== -1}
                      onChange={this.onToggleFeedSource}>
                      {feed.name === '' ? '(flux sans nom)' : feed.name}
                    </Checkbox>
                  ))
                  : this.messages('cannotFetchFeeds')
                }
              </Col>
              <Col xs={6}>
                <h4>{this.messages('permissions')}</h4>
                {allPermissions
                  .filter(permission => permission.module ? isModuleEnabled(permission.module) : true)
                  .map((permission, i) => (
                    <Checkbox
                      key={permission.type}
                      name={permission.type}
                      checked={settings.permissions.indexOf(permission.type) !== -1}
                      onChange={this.onTogglePermission}>
                      {permission.name}
                    </Checkbox>
                  ))
                }
              </Col>
            </Row>
            : ''
          }
        </Col>
      </Row>
    )
  }
}
