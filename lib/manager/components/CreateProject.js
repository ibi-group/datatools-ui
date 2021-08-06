// @flow

import React, { Component } from 'react'
import { Col, Grid, Row } from 'react-bootstrap'

import { createProject } from '../actions/projects'
import ManagerPage from '../../common/components/ManagerPage'
import type { ManagerUserState } from '../../types/reducers'

import ProjectSettingsForm from './ProjectSettingsForm'

type Props = {
  createProject: typeof createProject,
  user: ManagerUserState
}

/**
 * A component to facilitate the creation of a new project.
 */
export default class CreateProject extends Component<Props> {
  _saveProject = (projectId: string, data: Object) => {
    return this.props.createProject(data)
  }

  render () {
    const { user } = this.props

    return (
      <ManagerPage
        ref='page'
        title={'Create New Project'}>
        <Grid fluid>
          <Row>
            <Col xs={12} sm={8}>
              <h2>Create New Project</h2>
              <ProjectSettingsForm
                onCancelUrl='/project'
                // Initialize project with empty object.
                project={{}}
                user={user}
                updateProject={this._saveProject}
              />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
