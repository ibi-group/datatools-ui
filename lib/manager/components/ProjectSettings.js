// @flow

import React, { Component } from 'react'
import { Row, Col, Panel, ListGroup, ListGroupItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import * as projectActions from '../actions/projects'
import {
  getComponentMessages,
  isModuleEnabled
} from '../../common/util/config'
import type { ManagerUserState } from '../../types/reducers'
import type { Project } from '../../types'

import DeploymentSettings from './deployment/DeploymentSettings'
import ProjectSettingsForm from './ProjectSettingsForm'

type Props = {
  activeSettingsPanel?: ?string,
  deleteProject: typeof projectActions.deleteProject,
  project: Project,
  projectEditDisabled: boolean,
  updateProject: typeof projectActions.updateProject,
  user: ManagerUserState
}

export default class ProjectSettings extends Component<Props> {
  messages = getComponentMessages('ProjectSettings')

  _updateProjectSettings = (project: Project, settings: Object) => {
    const {updateProject} = this.props
    // Update project and re-fetch feeds.
    updateProject(project.id, settings, true)
  }

  render () {
    const {
      activeSettingsPanel,
      deleteProject,
      project,
      projectEditDisabled,
      updateProject,
      user
    } = this.props
    const activePanel = !activeSettingsPanel
      ? <ProjectSettingsForm
        deleteProject={deleteProject}
        editDisabled={projectEditDisabled}
        onCancelUrl={`project/${project.id}/`}
        project={project}
        updateProject={updateProject}
        showDangerZone
        user={user}
      />
      : <DeploymentSettings
        project={project}
        updateProject={updateProject}
        editDisabled={projectEditDisabled} />
    return (
      <Row>
        <Col xs={12} sm={3}>
          <Panel>
            <ListGroup>
              <LinkContainer
                to={`/project/${project.id}/settings`}>
                <ListGroupItem>
                  {this.messages('title')}
                </ListGroupItem>
              </LinkContainer>
              {isModuleEnabled('deployment')
                ? (
                  <LinkContainer
                    data-test-id='deployment-settings-link'
                    to={`/project/${project.id}/settings/deployment`}
                  >
                    <ListGroupItem>{this.messages('deployment.title')}</ListGroupItem>
                  </LinkContainer>
                )
                : null
              }
            </ListGroup>
          </Panel>
        </Col>
        <Col xs={12} sm={7}>
          {activePanel}
        </Col>
      </Row>
    )
  }
}
