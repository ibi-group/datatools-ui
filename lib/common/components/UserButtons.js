// @flow

import React, { Component } from 'react'
import { Button, ButtonToolbar } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import Icon from '@conveyal/woonerf/components/icon'

import {getComponentMessages} from '../../common/util/config'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  logout: () => any,
  user: ManagerUserState
}

/**
 *  A common component containing buttons for standard user actions: "My
 *  Account", "Site Admin", and "Logout"
 */
export default class UserButtons extends Component<Props> {
  messages = getComponentMessages('UserButtons')

  render () {
    const { logout, user } = this.props
    const buttonStyle = { margin: 2 }
    const isSiteAdmin = user.permissions && user.permissions.isApplicationAdmin() &&
      user.permissions.canAdministerAnOrganization()
    return (
      <ButtonToolbar>
        <LinkContainer to='/settings/profile'>
          <Button bsSize='small' style={buttonStyle}>
            <Icon type='user' /> {this.messages('myAccount')}
          </Button>
        </LinkContainer>
        {isSiteAdmin && (
          <LinkContainer to='/admin/users'>
            <Button
              bsSize='small'
              style={buttonStyle}
            >
              <Icon type='cog' /> {this.messages('admin')}
            </Button>
          </LinkContainer>
        )}
        <Button
          bsSize='small'
          bsStyle='primary'
          onClick={logout}
          style={buttonStyle}>
          <Icon type='sign-out' /> {this.messages('logout')}
        </Button>
      </ButtonToolbar>
    )
  }
}
