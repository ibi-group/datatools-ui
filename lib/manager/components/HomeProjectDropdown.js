// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button } from 'react-bootstrap'
import {browserHistory} from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import Select from 'react-select'

import {getAbbreviatedProjectName} from '../../common/util/util'
import {getComponentMessages} from '../../common/util/config'
import type {Project, ReactSelectOption} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeProject: Project,
  user: ManagerUserState,
  visibleProjects: Array<Project>
}

export default class HomeProjectDropdown extends Component<Props> {
  messages = getComponentMessages('HomeProjectDropdown')

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
    const abbreviatedProjectName = getAbbreviatedProjectName(activeProject)
    const options = visibleProjects.map(
      project => ({label: project.name || '[pas de nom]', value: project.id})
    )
    return (
      <div style={{marginBottom: '20px'}}>
        {
          isAdmin && (
            <LinkContainer to='/project/new'>
              <Button bsStyle='link' style={{paddingLeft: 0}}>
                <Icon type='plus' /> {this.messages('new')}
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
              placeholder={this.messages('select') + '...'}
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
              title={activeProject ? this.messages('view').replace('%name%', activeProject.name) : ''}
              bsStyle='primary'
            >
              {activeProject
                ? this.messages('view').replace('%name%', abbreviatedProjectName)
                : this.messages('select')
              }
            </Button>
          </LinkContainer>
        </div>
      </div>
    )
  }
}
