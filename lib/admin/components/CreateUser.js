// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Button, Modal, FormControl, ControlLabel, FormGroup } from 'react-bootstrap'

import * as adminActions from '../actions/admin'
import UserPermissions from '../../common/user/UserPermissions'
import { getComponentMessages } from '../../common/util/config'
import * as feedActions from '../../manager/actions/feeds'
import type { Organization, Project } from '../../types'
import type { ManagerUserState } from '../../types/reducers'

import UserSettings from './UserSettings'

type Props = {
  createUser: typeof adminActions.createUser,
  creatingUser: ManagerUserState,
  fetchProjectFeeds: typeof feedActions.fetchProjectFeeds,
  organizations: Array<Organization>,
  projects: Array<Project>
}

type State = {
  email: string,
  password: string,
  showModal: boolean
}

const DEFAULT_STATE = {
  email: '',
  password: '',
  showModal: false
}

export default class CreateUser extends Component<Props, State> {
  messages = getComponentMessages('CreateUser')
  state = DEFAULT_STATE

  save = (e: SyntheticInputEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (!e.target.checkValidity()) {
      console.warn('Format invalide!')
      return
    }
    const {email, password} = this.state
    this.props.createUser({
      email,
      password,
      permissions: this.refs.userSettings.getSettings()
    })
    this.setState(DEFAULT_STATE)
  }

  _updateField = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({[evt.target.name]: evt.target.value})
  }

  cancel = () => this.setState(DEFAULT_STATE)

  open = () => this.setState({showModal: true})

  render () {
    const {
      creatingUser,
      fetchProjectFeeds,
      organizations,
      projects
    } = this.props
    const {email, password, showModal} = this.state
    return (
      <div>
        <Button
          bsStyle='primary'
          className='pull-right'
          data-test-id='create-user-button'
          onClick={this.open}
        >
          <Icon type='plus' />{' '}
          {this.messages('new')}
        </Button>
        <Modal
          onHide={this.cancel}
          show={showModal}
        >
          <Modal.Header closeButton>
            <Modal.Title>{this.messages('title')}</Modal.Title>
          </Modal.Header>
          <form onSubmit={this.save}>
            <Modal.Body>
              <FormGroup controlId='formControlsEmail'>
                <ControlLabel>{this.messages('email.label')}</ControlLabel>
                <FormControl
                  autoComplete='username email'
                  name='email'
                  onChange={this._updateField}
                  placeholder={this.messages('email.placeholder')}
                  type='email'
                  value={email}
                />
              </FormGroup>
              <FormGroup controlId='formControlsPassword'>
                <ControlLabel>{this.messages('password.label')}</ControlLabel>
                <FormControl
                  autoComplete='new-password'
                  minLength='8'
                  name='password'
                  onChange={this._updateField}
                  placeholder={this.messages('password.placeholder')}
                  type='password'
                  value={password}
                />
              </FormGroup>
              <UserSettings
                creatingUser={creatingUser}
                fetchProjectFeeds={fetchProjectFeeds}
                isCreating
                organizations={organizations}
                permissions={new UserPermissions()}
                projects={projects}
                ref='userSettings'
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                data-test-id='confirm-create-user-button'
                type='submit'
              >
                {this.messages('new')}
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      </div>
    )
  }
}
