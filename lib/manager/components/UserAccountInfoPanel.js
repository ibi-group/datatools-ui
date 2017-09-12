import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Panel, Badge, Button, Row, Col, ButtonToolbar } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

export default class UserAccountInfoPanel extends Component {
  static propTypes = {
    user: PropTypes.object,
    logoutHandler: PropTypes.func
  }
  render () {
    const {
      user,
      logoutHandler
    } = this.props
    // const userOrganization = user.permissions.getOrganizationId()
    return (
      <Panel>
        <Row>
          <Col xs={12}>
            <h4 style={{marginTop: 0, marginBottom: 15}}>
              <Button
                className='pull-right'
                bsSize='small'
                onClick={logoutHandler}>
                <Icon type='sign-out' /> Log out
              </Button>
              Hello, {user.profile.nickname}.
            </h4>
          </Col>
        </Row>
        <Row>
          <Col xs={4}>
            <img alt='Profile' style={{ width: '100%', borderRadius: '50%' }} src={user.profile.picture} />
          </Col>
          <Col md={8}>
            <div className='text-muted'><Icon type='user' /> {user.profile.email}</div>
            <div>
              <Badge className='text-muted'>
                {user.permissions.isApplicationAdmin()
                  ? 'Application admin'
                  : user.permissions.canAdministerAnOrganization()
                  ? 'Organization admin'
                  : 'Standard user'
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
            <div style={{ marginTop: 15 }}>
              <ButtonToolbar className='pull-right'>
                <LinkContainer to='/settings/profile'>
                  <Button bsStyle='primary' bsSize='small'>
                    <Icon type='cog' /> Manage account
                  </Button>
                </LinkContainer>
                {user.permissions.isApplicationAdmin() || user.permissions.canAdministerAnOrganization()
                  ? <LinkContainer to='/admin/users'>
                    <Button bsStyle='default' bsSize='small'>
                      <Icon type='cog' /> Admin
                    </Button>
                  </LinkContainer>
                  : null
                }
              </ButtonToolbar>
            </div>
          </Col>
        </Row>
      </Panel>
    )
  }
}
