// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button } from 'react-bootstrap'
import {browserHistory} from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import Select from 'react-select'

import {getAbbreviatedProjectName} from '../../common/util/util'

import type {Project, ReactSelectOption} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeProject: Project,
  user: ManagerUserState,
  visibleProjects: Array<Project>
}

const toOption = (project: Project) => ({value: project.id, label: project.name})

export default class HomeProjectDropdown extends Component<Props> {
  handleChange = (option: ReactSelectOption) => {
    browserHistory.push(`/home/${option ? option.value : ''}`)
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
    const options = visibleProjects.map(toOption)
    return (
      <div style={{marginBottom: '20px'}}>
        {
          isAdmin && (
            <LinkContainer to='/project/new'>
              <Button>
                <Icon type='plus' /> New project
              </Button>
            </LinkContainer>
          )
        }
        {activeProject
          ? <LinkContainer
            className='pull-right'
            style={{marginBottom: '5px'}}
            to={`/project/${activeProject.id}`}
          >
            <Button bsStyle='primary'>View {abbreviatedProjectName}</Button>
          </LinkContainer>
          : null
        }
        <Select
          value={options.find(o => o.value === activeProject.id)}
          onChange={this.handleChange}
          options={options}
          style={{marginTop: '5px'}}
        />
      </div>
    )
  }
}
