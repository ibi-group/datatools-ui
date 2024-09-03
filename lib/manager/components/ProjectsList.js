// @flow

import React, {Component} from 'react'
import {
  Grid,
  Row,
  Col,
  Button,
  Table,
  FormControl,
  Panel,
  OverlayTrigger,
  Popover,
  Glyphicon
} from 'react-bootstrap'
import {browserHistory} from 'react-router'

import * as projectsActions from '../actions/projects'
import * as visibilityFilterActions from '../actions/visibilityFilter'
import ManagerPage from '../../common/components/ManagerPage'
import EditableTextField from '../../common/components/EditableTextField'
import {getComponentMessages} from '../../common/util/config'
import {defaultSorter} from '../../common/util/util'
import type {Props as ContainerProps} from '../containers/ActiveProjectsList'
import type {Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = ContainerProps & {
  createProject: typeof projectsActions.createProject,
  fetchProjects: typeof projectsActions.fetchProjects,
  projects: Array<Project>,
  setVisibilitySearchText: typeof visibilityFilterActions.setVisibilitySearchText,
  updateProject: typeof projectsActions.updateProject,
  user: ManagerUserState,
  visibilitySearchText: null | string
}

const userCanCreateProject = (user: ManagerUserState) => {
  const {permissions} = user
  if (!permissions) return false
  else return permissions.isApplicationAdmin() || permissions.canAdministerAnOrganization()
}

export default class ProjectsList extends Component<Props> {
  messages = getComponentMessages('ProjectsList')

  componentWillMount () {
    const {fetchProjects, setVisibilitySearchText} = this.props
    setVisibilitySearchText(null)
    fetchProjects()
  }

  _newProjectClicked () {
    browserHistory.push('/project/new')
  }

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.setVisibilitySearchText(evt.target.value)

  render () {
    const {
      projects,
      updateProject,
      user,
      visibilitySearchText
    } = this.props
    if (!projects) {
      return <ManagerPage />
    }
    const projectCreationDisabled = !userCanCreateProject(user)
    const visibleProjects = projects
      .filter((project) => {
        if (project.isCreating) return true // projects actively being created are always visible
        // FIXME why are some project names showing up as null?
        return !project.name || project.name.toLowerCase().indexOf((visibilitySearchText || '').toLowerCase()) !== -1
      })
      .sort(defaultSorter)

    return (
      <ManagerPage
        ref='page'
        title={this.messages('title')}>
        <Grid fluid>
          <Panel>
            <Panel.Heading><Panel.Title componentClass='h3'>Projets</Panel.Title></Panel.Heading>
            <Panel.Body>
              <Row>
                <Col xs={4}>
                  <FormControl
                    onChange={this._onChangeSearch}
                    placeholder={this.messages('search')} />
                </Col>
                <Col xs={8}>
                  <Button
                    bsStyle='primary'
                    className='pull-right'
                    data-test-id='create-new-project-button'
                    disabled={projectCreationDisabled}
                    onClick={this._newProjectClicked}>
                    {this.messages('new')}
                  </Button>
                  <OverlayTrigger
                    overlay={
                      <Popover
                        id='project-help'
                        title={this.messages('help.title')}>
                        {this.messages('help.content')}
                      </Popover>
                    }
                    placement='left'
                    trigger='click'>
                    <Button
                      bsStyle='link'
                      className='pull-right'>
                      <Glyphicon glyph='question-sign' />
                    </Button>
                  </OverlayTrigger>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <Table data-test-id='project-list-table' hover striped>
                    <thead>
                      <tr>
                        <th className='col-md-4'>
                          {this.messages('table.name')}
                        </th>
                        <th className='col-md-8' />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProjects.length > 0
                        ? visibleProjects.map((project) => (
                          <ProjectRow
                            project={project}
                            updateProject={updateProject}
                            user={user} />
                        ))
                        : <tr>
                          <td className='col-md-12 text-center'>
                            {this.messages('noProjects')}
                            {'    '}
                            <Button
                              bsStyle='primary'
                              disabled={projectCreationDisabled}
                              onClick={this._newProjectClicked}>
                              {this.messages('createFirst')}
                            </Button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Panel.Body>
          </Panel>
        </Grid>
      </ManagerPage>
    )
  }
}

class ProjectRow extends Component<{
  project: Project,
  updateProject: typeof projectsActions.updateProject,
  user: ManagerUserState
}> {
  _onChangeName = (name: string) => {
    const {project, updateProject} = this.props
    const proj = {}
    proj.name = name
    if (project.organizationId) proj.organizationId = project.organizationId
    updateProject(project.id, {name})
  }

  render () {
    const {project, user} = this.props
    const disabled = !user.permissions ||
      !user.permissions.isProjectAdmin(project.id, project.organizationId)
    return (
      <tr>
        <td className='col-md-4'>
          <div className='project-name-editable'>
            <EditableTextField
              disabled={disabled}
              link={`/project/${project.id}`}
              onChange={this._onChangeName}
              value={project.name} />
          </div>
        </td>
        <td className='col-md-8' />
      </tr>
    )
  }
}
