import Icon from '@conveyal/woonerf/components/icon'
import React, { Component, PropTypes } from 'react'
import { Button, Modal, FormControl, ControlLabel, FormGroup } from 'react-bootstrap'
import ReactDOM from 'react-dom'

import UserSettings from './UserSettings'
import UserPermissions from '../../common/user/UserPermissions'
import { getComponentMessages, getMessage } from '../../common/util/config'

export default class CreateUser extends Component {
  static propTypes = {
    createUser: PropTypes.func,
    fetchProjectFeeds: PropTypes.func,
    projects: PropTypes.array
  }

  state = {
    showModal: false
  }

  save = () => {
    this.setState({
      showModal: false
    })
    this.props.createUser({
      email: ReactDOM.findDOMNode(this.refs.email).value,
      password: ReactDOM.findDOMNode(this.refs.password).value,
      permissions: this.refs.userSettings.getSettings()
    })
  }

  cancel () {
    this.setState({
      showModal: false
    })
  }

  open = () => {
    this.setState({
      showModal: true
    })
  }

  render () {
    const messages = getComponentMessages('CreateUser')
    const {
      creatingUser,
      organizations,
      projects,
      fetchProjectFeeds
    } = this.props
    return (
      <div>
        <Button
          bsStyle='primary'
          onClick={this.open}
          className='pull-right'>
          <Icon type='plus' />{' '}
          Create User
        </Button>

        <Modal show={this.state.showModal} onHide={this.cancel.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Create User</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FormGroup controlId='formControlsEmail'>
              <ControlLabel>Email Address</ControlLabel>
              <FormControl ref='email' type='email' placeholder='Enter email' />
            </FormGroup>
            <FormGroup controlId='formControlsPassword'>
              <ControlLabel>Password</ControlLabel>
              <FormControl ref='password' type='password' />
            </FormGroup>
            <UserSettings
              projects={projects}
              organizations={organizations}
              fetchProjectFeeds={fetchProjectFeeds}
              creatingUser={creatingUser}
              permissions={new UserPermissions()}
              isCreating
              ref='userSettings' />
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={this.save}>
              {getMessage(messages, 'new')}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
