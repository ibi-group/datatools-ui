// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button } from 'react-bootstrap'
import {browserHistory} from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import Select from 'react-select'

import type {Project, ReactSelectOption} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeProject: Project,
  user: ManagerUserState,
  visibleProjects: Array<Project>
}

export default class HomeProjectDropdown extends Component<Props> {
  handleChange = (option: ReactSelectOption) => {
    browserHistory.push(`/home/${option ? option.value : ''}`)
  }

  _optionRenderer = (option: ReactSelectOption) => {
    return (
      <span title={option.label}>
        <Icon type='folder-o' /> {option.label}
      </span>
    )
  }

  render () {
    const {
      activeProject,
      user,
      visibleProjects
    } = this.props
    const isAdmin = user.permissions && user.permissions.isApplicationAdmin()
    const {profile} = user
    if (!profile) return null
    const options = visibleProjects.map(
      project => ({value: project.id, label: project.name || '-'})
    )
    return (
      <div style={{marginBottom: '20px'}}>
        {
          isAdmin && (
            <LinkContainer to='/project/new'>
              <Button bsStyle='link' style={{paddingLeft: 0}}>
                <Icon type='plus' /> Crear proyecto
              </Button>
            </LinkContainer>
          )
        }
        <div style={{display: 'flex'}}>
          <div style={{paddingRight: '10px', width: '70%'}}>
            <Select
              id='context-dropdown'
              onChange={this.handleChange}
              optionRenderer={this._optionRenderer}
              options={options}
              placeholder='Seleccionar proyecto...'
              value={options.find(o =>
                activeProject && o.value === activeProject.id
              )}
              valueRenderer={this._optionRenderer}
            />
          </div>
          <LinkContainer
            to={activeProject ? `/project/${activeProject.id}` : ''}
          >
            <Button
              disabled={!activeProject}
              style={{width: '30%'}}
              title={activeProject ? `Ver ${activeProject.name}` : ''}
              bsStyle='primary'
            >
              {activeProject
                ? `Ver proyecto`
                : 'Ver proyecto'
              }
            </Button>
          </LinkContainer>
        </div>
      </div>
    )
  }
}
