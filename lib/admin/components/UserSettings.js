import React, {Component, PropTypes} from 'react'
import {Row, Col, Checkbox, Panel, SplitButton, MenuItem, Label} from 'react-bootstrap'
import update from 'react-addons-update'
import Select from 'react-select'

import {getComponentMessages, getMessage} from '../../common/util/config'
import ProjectSettings from './ProjectSettings'

export default class UserSettings extends Component {
  static propTypes = {
    creatingUser: PropTypes.object,
    fetchProjectFeeds: PropTypes.func,
    isCreating: PropTypes.bool,
    organizations: PropTypes.array,
    permissions: PropTypes.object,
    projects: PropTypes.array
  }

  constructor (props) {
    super(props)
    this.state = {
      appAdminChecked: this.props.permissions.isApplicationAdmin(),
      currentProjectIndex: 0,
      projectSettings: {},
      organization: null
    }

    this.props.organizations.forEach((organization, i) => {
      if (this.props.permissions.hasOrganization(organization.id)) {
        this.state.organization = organization
        if (this.props.permissions.isOrganizationAdmin(organization.id)) {
          this.state.orgAdminChecked = true
        }
      } else if (this.props.isCreating && this.props.creatingUser.permissions.getOrganizationId() === organization.id) {
        this.state.organization = organization
      }
    })
    this.props.projects.forEach((project, i) => {
      let access = 'none'
      let defaultFeeds = []
      let permissions = []
      if (this.props.permissions.hasProject(project.id, project.organizationId)) {
        if (this.props.permissions.isProjectAdmin(project.id, project.organizationId)) {
          access = 'admin'
        } else {
          access = 'custom'
          const projectPermissions = this.props.permissions.getProjectPermissions(project.id)
          permissions = projectPermissions.map((p) => { return p.type })
          defaultFeeds = this.props.permissions.getProjectDefaultFeeds(project.id)
        }
      }
      this.state.projectSettings[project.id] = { access, defaultFeeds, permissions }
    })
  }

  getSettings () {
    if (this.state.appAdminChecked) {
      return {
        permissions: [{
          type: 'administer-application'
        }],
        projects: [],
        client_id: process.env.AUTH0_CLIENT_ID
      }
    }

    const settings = {
      permissions: [],
      projects: [],
      organizations: [],
      client_id: process.env.AUTH0_CLIENT_ID
    }
    if (this.state.organization) {
      const orgSettings = {
        organization_id: this.state.organization.id,
        permissions: this.state.orgAdminChecked
          ? [{type: 'administer-organization'}] // this.state.orgPermissions[this.state.organization.id]
          : []
      }
      settings.organizations.push(orgSettings)
    }
    this.props.projects.forEach((project, i) => {
      const stateProjectSettings = this.state.projectSettings[project.id]
      if (stateProjectSettings.access === 'none') return

      const projectSettings = {
        project_id: project.id,
        permissions: []
      }
      if (stateProjectSettings.access === 'admin') {
        projectSettings.permissions.push({
          type: 'administer-project'
        })
      } else if (stateProjectSettings.access === 'custom') {
        projectSettings.defaultFeeds = stateProjectSettings.defaultFeeds
        // users have view-all permissions by default
        projectSettings.permissions.push({
          type: 'view-feed',
          feeds: ['*']
        })
        projectSettings.permissions = projectSettings.permissions.concat(stateProjectSettings.permissions.map((permission) => {
          return { type: permission }
        }))
      }
      settings.projects.push(projectSettings)
    })

    return settings
  }

  projectSelected = (key) => {
    this.setState({currentProjectIndex: key})
  }

  appAdminClicked = (evt) => {
    const appAdminChecked = evt.target.checked
    const stateUpdate = {appAdminChecked}
    if (appAdminChecked) {
      stateUpdate.organization = null
      stateUpdate.orgAdminChecked = false
    }
    this.setState(stateUpdate)
  }

  orgAdminClicked (evt) {
    this.setState({orgAdminChecked: evt.target.checked})
  }

  orgUpdated = (val) => {
    const stateUpdate = {
      organization: (val && val.organization) || null,
      orgAdminChecked: false,
      projectSettings: {}
    }
    this.props.projects.forEach(p => {
      const access = 'none'
      const defaultFeeds = []
      const permissions = []
      stateUpdate.projectSettings[p.id] = {access, defaultFeeds, permissions}
    })
    this.setState(stateUpdate)
  }

  projectAccessUpdated = (projectId, newAccess) => {
    const stateUpdate = {projectSettings: {[projectId]: {$merge: {access: newAccess}}}}
    this.setState(update(this.state, stateUpdate))
  }

  projectFeedsUpdated = (projectId, newFeeds) => {
    const stateUpdate = {projectSettings: {[projectId]: {$merge: {defaultFeeds: newFeeds}}}}
    this.setState(update(this.state, stateUpdate))
  }

  projectPermissionsUpdated = (projectId, newPermissions) => {
    const stateUpdate = {projectSettings: {[projectId]: {$merge: {permissions: newPermissions}}}}
    this.setState(update(this.state, stateUpdate))
  }

  render () {
    const messages = getComponentMessages('UserSettings')
    const { creatingUser, fetchProjectFeeds, organizations, projects } = this.props
    const orgToOption = organization => ({label: organization.name, value: organization.id, organization})
    const creatorIsApplicationAdmin = creatingUser.permissions.isApplicationAdmin()

    // limit available projects to those that either have no org or match the current state org
    const orgProjects = projects.filter(p => !p.organizationId || (this.state.organization && this.state.organization.id === p.organizationId))
    const currentProject = orgProjects[this.state.currentProjectIndex]

    const getProjectLabel = (access) => {
      switch (access) {
        case 'none': return <Label>{getMessage(messages, 'project.noAccess')}</Label>
        case 'admin': return <Label bsStyle='primary'>{getMessage(messages, 'project.admin')}</Label>
        case 'custom': return <Label bsStyle='success'>{getMessage(messages, 'project.custom')}</Label>
      }
    }

    const projectPanel = (
      <Panel
        header={
          <h3>
            Project Settings for{' '}
            <SplitButton
              disabled={!currentProject}
              title={currentProject ? currentProject.name : 'No projects available'}
              id={currentProject ? currentProject.name : 'No projects available'}
              onSelect={this.projectSelected}>
              {orgProjects.map((project, i) => {
                const settings = this.state.projectSettings[project.id]
                if (settings) {
                  return <MenuItem
                    key={project.id}
                    eventKey={i}>
                    {project.name} {getProjectLabel(settings.access)}
                  </MenuItem>
                }
              })}
            </SplitButton>
          </h3>
        }
      >
        {orgProjects.map((project, i) => {
          if (i !== this.state.currentProjectIndex) return null
          const settings = this.state.projectSettings[project.id]
          return <ProjectSettings
            project={project}
            key={project.id}
            settings={settings}
            fetchProjectFeeds={fetchProjectFeeds}
            visible={i === this.state.currentProjectIndex}
            projectAccessUpdated={this.projectAccessUpdated}
            projectFeedsUpdated={this.projectFeedsUpdated}
            projectPermissionsUpdated={this.projectPermissionsUpdated} />
        })}
      </Panel>
  )

    return (
      <Row>
        <Col xs={4}>
          <Panel header={
            <h3>
              Organization settings
            </h3>
          }>
            {creatorIsApplicationAdmin &&
              <Checkbox
                checked={this.state.appAdminChecked}
                onChange={this.appAdminClicked}
                ref='appAdminCheckbox'>
                {getMessage(messages, 'admin.title')}
              </Checkbox>
            }
            {/* Organizations selector. Only show if there exist organizations already. */}
            {!this.state.appAdminChecked && organizations && organizations.length
              ? <div className='orgDetails'>
                <Select
                  options={organizations.map(orgToOption)}
                  placeholder='Choose organization...'
                  disabled={!creatorIsApplicationAdmin}
                  value={this.state.organization && orgToOption(this.state.organization)}
                  onChange={this.orgUpdated} />
                {this.state.organization &&
                  <Checkbox
                    checked={this.state.orgAdminChecked}
                    onChange={this.orgAdminClicked}
                    ref='orgAdminCheckbox'>
                    {getMessage(messages, 'org.admin')}
                  </Checkbox>
                }
              </div>
              : null
            }
          </Panel>
        </Col>
        <Col xs={8}>
          {this.state.appAdminChecked
            ? <i>{getMessage(messages, 'admin.description')}</i>
            : this.state.orgAdminChecked
            ? <i>{getMessage(messages, 'org.description')}</i>
            : projectPanel
          }
        </Col>
      </Row>
    )
  }
}
