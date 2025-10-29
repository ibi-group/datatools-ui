// @flow

import React, { Component } from 'react'
import { Row, Col } from 'react-bootstrap'

import * as projectActions from '../actions/projects'
import type { ManagerUserState } from '../../types/reducers'
import type { Project } from '../../types'

import ProjectSettingsForm from './ProjectSettingsForm'

type Props = {
  deleteProject: typeof projectActions.deleteProject,
  project: Project,
  projectEditDisabled: boolean,
  updateProject: typeof projectActions.updateProject,
  user: ManagerUserState
}

export default class ProjectSettings extends Component<Props> {
  _updateProjectSettings = (project: Project, settings: Object) => {
    const { updateProject } = this.props
    // Update project and re-fetch feeds.
    updateProject(project.id, settings, true)
  }

  render () {
    const {
      deleteProject,
      project,
      projectEditDisabled,
      updateProject,
      user
    } = this.props
    return <Row>
      <Col xs={12} sm={2} />
      <Col xs={12} sm={7}>
        <ProjectSettingsForm
          deleteProject={deleteProject}
          editDisabled={projectEditDisabled}
          onCancelUrl={`project/${project.id}/`}
          project={project}
          updateProject={updateProject}
          showDangerZone
          user={user}
        />
      </Col>
    </Row>
  }
}
