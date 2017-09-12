import Icon from '@conveyal/woonerf/components/icon'
import React, { Component, PropTypes } from 'react'
import { Grid, Row, Col, Button, Panel, Checkbox, ListGroup, ListGroupItem, ControlLabel } from 'react-bootstrap'
import { Link } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'

import EditableTextField from '../../common/components/EditableTextField'
import ManagerPage from '../../common/components/ManagerPage'
import { getConfigProperty, getComponentMessages, getMessage } from '../../common/util/config'

export default class UserAccount extends Component {
  static propTypes = {
    activeComponent: PropTypes.string,
    getUser: PropTypes.func,
    resetPassword: PropTypes.func,
    unsubscribeAll: PropTypes.func,
    user: PropTypes.object
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _onChangeUserName = (value) => this.props.updateUserName(this.props.user, value)

  _onClickGet = () => this.props.getUser(this.props.user.profile.user_id)

  _onClickUnsubscribeAll = () => this.props.unsubscribeAll(this.props.user.profile)

  _onResetPassword = () => this.props.resetPassword()

  render () {
    const {user} = this.props
    const messages = getComponentMessages('UserAccount')
    const removeIconStyle = {cursor: 'pointer'}
    const subscriptions = user.profile.app_metadata.datatools.find(dt => dt.client_id === process.env.AUTH0_CLIENT_ID).subscriptions
    const ACCOUNT_SECTIONS = [
      {
        id: 'profile',
        component: (
          <div>
            <Panel header={<h4>Profile information</h4>}>
              <ListGroup fill>
                <ListGroupItem>
                  <ControlLabel>Email address</ControlLabel>
                  <EditableTextField
                    value={user.profile.email}
                    onChange={this._onChangeUserName} />
                  {/*
                    <Button
                      onClick={this._onClickGet}>
                      Get User
                    </Button>
                  */}
                </ListGroupItem>
                <ListGroupItem>
                  <p><strong>Avatar</strong></p>
                  <a href='http://gravatar.com'>
                    <img
                      alt='Profile'
                      className='img-rounded'
                      height={40}
                      width={40}
                      src={user.profile.picture} />
                    <span style={{marginLeft: '10px'}}>Change on gravatar.com</span>
                  </a>
                </ListGroupItem>
                <ListGroupItem>
                  <p><strong>Password</strong></p>
                  <Button
                    onClick={this._onResetPassword}>
                    Change password
                  </Button>
                </ListGroupItem>
              </ListGroup>
            </Panel>
          </div>
        )
      },
      {
        id: 'account',
        hidden: !getConfigProperty('modules.enterprise.enabled')
      },
      {
        id: 'organizations',
        hidden: !getConfigProperty('modules.enterprise.enabled')
      },
      {
        id: 'notifications',
        hidden: !getConfigProperty('application.notifications_enabled'),
        component: (
          <div>
            <Panel
              header={<h4>Notification methods</h4>}
                    >
              <ListGroup fill>
                <ListGroupItem>
                  <h4>Watching</h4>
                  <p>Receive updates to any feed sources or comments you are watching.</p>
                  <Checkbox inline>Email</Checkbox>{' '}<Checkbox inline>Web</Checkbox>
                </ListGroupItem>
              </ListGroup>
            </Panel>
            <Panel
              header={
                <h4>
                  <Button
                    onClick={this._onClickUnsubscribeAll}
                    className='pull-right'
                    bsSize='xsmall'>
                    {getMessage(messages, 'notifications.unsubscribeAll')}
                  </Button>
                  {getMessage(messages, 'notifications.subscriptions')}
                </h4>
              }>
              <ul>
                {subscriptions && subscriptions.length
                  ? subscriptions.map(sub => {
                    return (
                      <SubscriptionListItem
                        removeIconStyle={removeIconStyle}
                        subscription={sub}
                        {...this.props} />
                    )
                  })
                  : <li>No subscriptions.</li>
                }
              </ul>
            </Panel>
          </div>
        )
      },
      {
        id: 'billing',
        hidden: !getConfigProperty('modules.enterprise.enabled')
      }
    ]
    const activeSection = ACCOUNT_SECTIONS.find(section => section.id === this.props.activeComponent)
    const visibleComponent = activeSection ? activeSection.component : null
    return (
      <ManagerPage ref='page'>
        <Grid fluid>
          <Row style={{marginBottom: '20px'}}>
            <Col xs={12}>
              <h1>
                <LinkContainer className='pull-right' to={{ pathname: '/home' }}>
                  <Button>Back to dashboard</Button>
                </LinkContainer>
                <Icon type='user' /> My settings
              </h1>
            </Col>
          </Row>
          <Row>
            <Col xs={3}>
              <Panel header={<h4>{getMessage(messages, 'personalSettings')}</h4>}>
                <ListGroup fill>
                  {ACCOUNT_SECTIONS.map(section => {
                    if (section.hidden) return null
                    return (
                      <LinkContainer key={section.id} to={`/settings/${section.id}`}>
                        <ListGroupItem active={this.props.activeComponent === section.id}>
                          {getMessage(messages, `${section.id}.title`)}
                        </ListGroupItem>
                      </LinkContainer>
                    )
                  })}
                </ListGroup>
              </Panel>
              <Panel header={<h4>{getMessage(messages, 'organizationSettings')}</h4>}>
                <ListGroup fill>
                  {this.props.projects && this.props.projects.map(project => {
                    if (project.hidden) return null
                    return (
                      <LinkContainer key={project.id} to={`/project/${project.id}/settings`}>
                        <ListGroupItem active={this.props.projectId === project.id}>
                          {project.name}
                        </ListGroupItem>
                      </LinkContainer>
                    )
                  })}
                </ListGroup>
              </Panel>
            </Col>
            <Col xs={1} />
            <Col xs={6}>
              {visibleComponent}
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}

class SubscriptionListItem extends Component {
  _onClickRemoveSubscriptionType = () => {
    const {removeUserSubscription, subscription, user} = this.props
    removeUserSubscription(user.profile, subscription.type)
  }

  render () {
    const {removeIconStyle, subscription} = this.props
    return (
      <li>
        {subscription.type.replace('-', ' ')}{' '}
        <Icon
          type='trash'
          className='text-danger'
          style={removeIconStyle}
          onClick={this._onClickRemoveSubscriptionType} />
        <ul>
          {subscription.target.length
            ? subscription.target.map(target => (
              <SubscriptionTarget
                target={target}
                {...this.props} />
            ))
            : <li>No feeds subscribed to.</li>
          }
        </ul>
      </li>
    )
  }
}

class SubscriptionTarget extends Component {
  _onClickRemoveSubscriptionTarget = () => {
    const {subscription, target, updateUserSubscription, user} = this.props
    updateUserSubscription(user.profile, target, subscription.type)
  }

  render () {
    const {projects, removeIconStyle, target} = this.props
    let fs = null // this.props.projects ? this.props.projects.reduce(proj => proj.feedSources.filter(fs => fs.id === target)) : null
    if (projects) {
      for (var i = 0; i < projects.length; i++) {
        const feed = projects[i].feedSources
          ? projects[i].feedSources.find(fs => fs.id === target)
          : null
        fs = feed || fs
      }
    }
    const feedLink = fs
      ? <Link to={fs.isPublic ? `/public/feed/${fs.id}` : `/feed/${fs.id}`}>{fs.name}</Link>
      : <span>{target}</span>
    return (
      <li>
        {feedLink}
        {' '}
        <Icon
          type='trash'
          className='text-danger'
          style={removeIconStyle}
          onClick={this._onClickRemoveSubscriptionTarget} />
      </li>
    )
  }
}
