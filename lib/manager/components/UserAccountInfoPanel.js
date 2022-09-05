// @flow

import React, {Component} from 'react'
import { Panel, Badge, Row, Col } from 'react-bootstrap'

import * as userActions from '../actions/user'
import UserButtons from '../../common/components/UserButtons'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  logout: typeof userActions.logout,
  user: ManagerUserState
}

export default class UserAccountInfoPanel extends Component<Props> {
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
        <Row>
          <Col xs={4}>
            <img
              alt='Profile'
              style={{ width: '100%', borderRadius: '50%' }}
              src={profile.picture} />
          </Col>
          <Col md={8}>
            <h4 style={{marginTop: 0, marginBottom: 15}}>
              Bienvenido, {profile.nickname}.
            </h4>
            <div className='text-muted'>{profile.email}</div>
            <div>
              <Badge className='text-muted'>
                {permissions.isApplicationAdmin()
                  ? 'Administrador'
                  : permissions.canAdministerAnOrganization()
                    ? 'Administrador (organización)'
                    : 'Usuario'
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
      </Panel>
    )
  }
}
