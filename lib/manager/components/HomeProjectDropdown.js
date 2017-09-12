import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Button, DropdownButton, MenuItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

export default class HomeProjectDropdown extends Component {
  static propTypes = {
    activeProject: PropTypes.object,
    user: PropTypes.object,
    visibleProjects: PropTypes.array
  }
  render () {
    const {
      activeProject,
      user,
      visibleProjects
    } = this.props
    const isAdmin = user.permissions.isApplicationAdmin()
    return (
      <div style={{marginBottom: '20px'}}>
        {activeProject
          ? <LinkContainer className='pull-right' to={`/project/${activeProject.id}`}>
            <Button bsStyle='primary'>View {activeProject.name}</Button>
          </LinkContainer>
          : null
        }
        <DropdownButton
          id='context-dropdown'
          title={activeProject
            ? <span>
              <Icon type='folder-open-o' /> {activeProject.name}
            </span>
            : <span>
              <img alt={user.email} height={20} width={20} src={user.profile.picture} />
              {' '}
              {user.profile.nickname}
            </span>
          }
        >
          {activeProject && (
            <LinkContainer key='home-link' to={`/home/`}>
              <MenuItem>
                <span>
                  <img alt={user.email} height={20} width={20} src={user.profile.picture} />
                  {' '}
                  {user.profile.nickname}
                </span>
              </MenuItem>
            </LinkContainer>
          )}
          {activeProject && <MenuItem key='divider' divider />}
          {visibleProjects.length > 0
            ? visibleProjects.map((project, index) => {
              if (activeProject && project.id === activeProject.id) {
                return null
              }
              return (
                <LinkContainer to={`/home/${project.id}`} key={project.id}>
                  <MenuItem eventKey={project.id}>
                    <Icon type='folder-o' /> {project.name}
                  </MenuItem>
                </LinkContainer>
              )
            })
            : null
          }
          {(activeProject && visibleProjects.length > 1) || !activeProject ? <MenuItem divider /> : null}
          {isAdmin && <LinkContainer to='/settings/organizations'><MenuItem><Icon type='users' /> Manage projects</MenuItem></LinkContainer>}
          {isAdmin && <MenuItem divider />}
          {isAdmin && <LinkContainer to='/project'><MenuItem><Icon type='plus' /> Create project</MenuItem></LinkContainer>}
        </DropdownButton>
      </div>
    )
  }
}
