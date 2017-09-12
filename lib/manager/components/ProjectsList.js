import React, {Component, PropTypes} from 'react'
import { Grid, Row, Col, Button, Table, FormControl, Panel, OverlayTrigger, Popover, Glyphicon } from 'react-bootstrap'

import ManagerPage from '../../common/components/ManagerPage'
import EditableTextField from '../../common/components/EditableTextField'
import defaultSorter from '../../common/util/util'
import { getComponentMessages, getMessage } from '../../common/util/config'

export default class ProjectsList extends Component {
  static propTypes = {
    projects: PropTypes.array,
    user: PropTypes.object,
    visibilitySearchText: PropTypes.object,
    onNewProjectClick: PropTypes.func,
    searchTextChanged: PropTypes.func,
    saveProject: PropTypes.func,
    projectNameChanged: PropTypes.func
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _newProjectClicked = () => {
    const project = {}
    if (this.props.user.permissions.getOrganizationId()) {
      project.organizationId = this.props.user.permissions.getOrganizationId()
    }
    this.props.onNewProjectClick(project)
  }

  _onChangeSearch = evt => this.props.searchTextChanged(evt.target.value)

  render () {
    const {
      projects,
      projectNameChanged,
      saveProject,
      user,
      visibilitySearchText
    } = this.props
    if (!projects) {
      return <ManagerPage />
    }
    const messages = getComponentMessages('ProjectsList')
    const projectCreationDisabled = !user.permissions.isApplicationAdmin() && !user.permissions.canAdministerAnOrganization()
    const visibleProjects = projects
      .filter((project) => {
        if (project.isCreating) return true // projects actively being created are always visible
        return project.name.toLowerCase().indexOf((visibilitySearchText || '').toLowerCase()) !== -1
      })
      .sort(defaultSorter)

    return (
      <ManagerPage
        ref='page'
        title={getMessage(messages, 'title')}>
        <Grid fluid>
          <Panel header={(<h3>Projects</h3>)}>
            <Row>
              <Col xs={4}>
                <FormControl
                  placeholder={getMessage(messages, 'search')}
                  onChange={this._onChangeSearch} />
              </Col>
              <Col xs={8}>
                <Button
                  bsStyle='primary'
                  disabled={projectCreationDisabled}
                  className='pull-right'
                  onClick={this._newProjectClicked}>
                  {getMessage(messages, 'new')}
                </Button>
                <OverlayTrigger trigger='click' placement='left' overlay={<Popover id='project-help' title={getMessage(messages, 'help.title')}>{getMessage(messages, 'help.content')}</Popover>}>
                  <Button bsStyle='link' className='pull-right'><Glyphicon glyph='question-sign' /></Button>
                </OverlayTrigger>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <Table striped hover>
                  <thead>
                    <tr>
                      <th className='col-md-4'>{getMessage(messages, 'table.name')}</th>
                      <th className='col-md-8' />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProjects.length > 0 ? visibleProjects.map((project) => (
                      <ProjectRow
                        project={project}
                        projectNameChanged={projectNameChanged}
                        saveProject={saveProject}
                        user={user} />
                    ))
                    : <tr>
                      <td className='col-md-12 text-center'>
                        {getMessage(messages, 'noProjects')}
                        {'    '}
                        <Button
                          bsStyle='primary'
                          disabled={projectCreationDisabled}
                          onClick={this._newProjectClicked}>
                          {getMessage(messages, 'createFirst')}
                        </Button>
                      </td>
                    </tr>
                  }
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Panel>
        </Grid>
      </ManagerPage>
    )
  }
}

class ProjectRow extends Component {
  _onChangeName = (name) => {
    const {project, projectNameChanged, saveProject} = this.props
    const proj = {name}
    if (project.organizationId) proj.organizationId = project.organizationId
    if (project.isCreating) saveProject(proj)
    else projectNameChanged(project, name)
  }

  render () {
    const {project, user} = this.props
    const disabled = !user.permissions.isProjectAdmin(project.id, project.organizationId)
    return (
      <tr key={project.id}>
        <td className='col-md-4'>
          <div>
            <EditableTextField
              isEditing={(project.isCreating === true)}
              value={project.name}
              disabled={disabled}
              onChange={this._onChangeName}
              link={`/project/${project.id}`} />
          </div>
        </td>
        <td className='col-md-8' />
      </tr>
    )
  }
}
