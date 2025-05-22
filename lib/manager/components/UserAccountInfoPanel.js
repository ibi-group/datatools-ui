// @flow

import React, {Component} from 'react'
import { Panel, Badge, Row, Col } from 'react-bootstrap'

import * as userActions from '../actions/user'
import {getComponentMessages} from '../../common/util/config'
import UserButtons from '../../common/components/UserButtons'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  logout: typeof userActions.logout,
  user: ManagerUserState
}

export default class UserAccountInfoPanel extends Component<Props> {
  messages = getComponentMessages('UserAccountInfoPanel')

  render () {
    const {
      user,
      logout
    } = this.props
    const {profile, permissions} = user
    if (!profile || !permissions) {
      console.warn('Cannot find user profile/permissions in app state', user)
      return null
    }
    return (
      <Panel>
        <Panel.Body>
          <Row>
            <Col xs={4}>
              <img
                alt={this.messages('profile')}
                style={{ width: '100%', borderRadius: '50%' }}
                src={profile.picture} />
            </Col>
            <Col md={8}>
              <h4 style={{marginTop: 0, marginBottom: 15}}>
                {this.messages('hello')} {profile.nickname}.
              </h4>
              <div className='text-muted'>{profile.email}</div>
              <div>
                <Badge className='text-muted'>
                  {permissions.isApplicationAdmin()
                    ? this.messages('roles.applicationAdmin')
                    : permissions.canAdministerAnOrganization()
                      ? this.messages('roles.organizationAdmin')
                      : this.messages('roles.standardUser')
                  }
                </Badge>
                {/* TODO: fetch organization for user and show badge here */}
                {' '}
                {/* userOrganization &&
                <Badge className='text-muted'>
                  user.permissions.getOrganizationId()
                </Badge>
              */}
              </div>
            </Col>
          </Row>
          <Row style={{marginTop: '10px'}}>
            <Col xs={12}>
              <UserButtons user={user} logout={logout} />
            </Col>
          </Row>
        </Panel.Body>
      </Panel>
    )
  }
}
