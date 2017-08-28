import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes, Component} from 'react'
import {Row, Col, Button, Label, Image, ListGroupItem} from 'react-bootstrap'

import ConfirmModal from '../../common/components/ConfirmModal'
import UserSettings from './UserSettings'
import UserPermissions from '../../common/user/UserPermissions'
import {getComponentMessages, getMessage} from '../../common/util/config'

export default class UserRow extends Component {
  static propTypes = {
    user: PropTypes.object,
    saveUser: PropTypes.func,
    deleteUser: PropTypes.func,
    fetchProjectFeeds: PropTypes.func,
    organizations: PropTypes.array,
    projects: PropTypes.array
  }

  state = {
    isEditing: false
  }

  toggleExpansion = () => this.setState({isEditing: !this.state.isEditing})

  cancel () {
    this.toggleExpansion()
  }

  save = () => {
    const settings = this.refs.userSettings.getSettings()
    this.props.saveUser(this.props.user, settings)
    this.toggleExpansion()
  }

  delete = () => {
    const messages = getComponentMessages('UserRow')
    this.refs.confirm.open({
      title: `${getMessage(messages, 'delete')} ${this.props.user.email}?`,
      body: getMessage(messages, 'deleteConfirm'),
      onConfirm: () => {
        this.props.deleteUser(this.props.user)
        this.toggleExpansion()
      }
    })
  }

  render () {
    const {
      creatingUser,
      user,
      organizations,
      projects,
      fetchProjectFeeds
    } = this.props
    const messages = getComponentMessages('UserRow')
    const permissions = new UserPermissions(user.app_metadata && user.app_metadata.datatools ? user.app_metadata.datatools : null)
    const creatorIsApplicationAdmin = creatingUser.permissions.isApplicationAdmin()
    const userOrganization = organizations.find(o => o.id === permissions.getOrganizationId())
    // return null if creating user is not app admin and list item user is part of a different org
    if (!creatorIsApplicationAdmin && !creatingUser.permissions.hasOrganization(permissions.getOrganizationId())) {
      return null
    }
    return (
      <ListGroupItem>
        <Row className='list-group-item-heading'>
          <Col xs={4} sm={2} md={1}>
            <Image
              responsive
              rounded
              src={user.picture}
              alt={user.email} />
          </Col>
          <Col xs={8} sm={5} md={6}>
            <h5>
              {user.email}{' '}
              {permissions.isApplicationAdmin()
                ? <Label bsStyle='danger'>{getMessage(messages, 'appAdmin')}</Label>
                : permissions.canAdministerAnOrganization()
                ? <Label bsStyle='warning'>{getMessage(messages, 'orgAdmin')}</Label>
                : null
              }{' '}
              {userOrganization && creatorIsApplicationAdmin ? <Label bsStyle='default'>{userOrganization.name}</Label> : null}
            </h5>
            <small />
          </Col>
          <Col xs={12} sm={5} md={5}>
            <Button
              className='pull-right'
              onClick={this.toggleExpansion}>
              {this.state.isEditing
                 ? <span><Icon type='remove' /> {getMessage(messages, 'cancel')}</span>
                 : <span><Icon type='edit' /> {getMessage(messages, 'edit')}</span>
               }
            </Button>
            {this.state.isEditing
              ? <Button
                className='pull-right'
                bsStyle='primary'
                style={{marginRight: '5px'}}
                onClick={this.save}>
                <Icon type='save' /> {getMessage(messages, 'save')}
              </Button>
              : null
            }
            {this.state.isEditing
              ? <Button
                className='pull-right'
                bsStyle='danger'
                style={{marginRight: '5px'}}
                onClick={this.delete}>
                <Icon type='trash' /> {getMessage(messages, 'delete')}
              </Button>
              : null
            }
          </Col>
        </Row>
        <ConfirmModal ref='confirm' />
        { this.state.isEditing
          ? <UserSettings ref='userSettings'
            organizations={organizations}
            projects={projects}
            creatingUser={creatingUser}
            fetchProjectFeeds={fetchProjectFeeds}
            permissions={permissions} />
          : ''
        }
      </ListGroupItem>
    )
  }
}
