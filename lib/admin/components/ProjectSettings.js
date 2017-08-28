import React, {PropTypes, Component} from 'react'
import {Row, Col, Checkbox, ButtonGroup} from 'react-bootstrap'

import OptionButton from '../../common/components/OptionButton'
import {getComponentMessages, getMessage} from '../../common/util/config'
import allPermissions from './permissions'

const ACCESS_TYPES = [{
  type: 'none',
  message: 'noAccess'
}, {
  type: 'admin',
  message: 'admin'
}, {
  type: 'custom',
  message: 'custom'
}]

export default class ProjectSettings extends Component {
  static propTypes = {
    project: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    visible: PropTypes.bool,

    fetchProjectFeeds: PropTypes.func,
    projectAccessUpdated: PropTypes.func,
    projectFeedsUpdated: PropTypes.func,
    projectPermissionsUpdated: PropTypes.func
  }

  state = {
    projectSettings: this.props.settings
  }

  componentWillMount () {
    if (!this.props.project.feedSources) {
      this.props.fetchProjectFeeds(this.props.project.id)
    }
  }

  setAccess = (access) => {
    this.props.projectAccessUpdated(this.props.project.id, access)
  }

  feedsUpdated = () => {
    const selectedFeeds = []
    this.props.project.feedSources.forEach((feed) => {
      var checkbox = this[`feed-${feed.id}`]
      if (checkbox.checked) selectedFeeds.push(feed.id)
    })
    this.props.projectFeedsUpdated(this.props.project.id, selectedFeeds)
  }

  permissionsUpdated = () => {
    const selectedPermissions = []
    allPermissions.forEach((permission) => {
      var checkbox = this[`permission-${permission.type}`]
      if (checkbox.checked) selectedPermissions.push(permission.type)
    })
    this.props.projectPermissionsUpdated(this.props.project.id, selectedPermissions)
  }

  render () {
    const {
      project,
      visible,
      settings
    } = this.props
    const messages = getComponentMessages('UserSettings')
    let feedSources = project.feedSources
    if (feedSources) {
      feedSources = feedSources.slice(0).sort((a, b) => {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
      })
    }
    return (
      <Row style={{display: visible ? 'block' : 'none'}}>
        <Col xs={12}>
          <Row>
            <Col xs={12}>
              <ButtonGroup>
                {ACCESS_TYPES.map(a => (
                  <OptionButton
                    active={settings.access === a.type}
                    key={a.type}
                    onClick={this.setAccess}
                    value={a.type}>
                    {getMessage(messages, `project.${a.message}`)}
                  </OptionButton>
                ))}
              </ButtonGroup>
            </Col>
          </Row>
          {settings.access === 'custom'
            ? <Row>
              <Col xs={6}>
                <h4>{getMessage(messages, 'project.feeds')}</h4>
                {feedSources
                  ? feedSources.map((feed, i) => (
                    <Checkbox
                      inputRef={ref => { this[`feed-${feed.id}`] = ref }}
                      key={feed.id}
                      checked={settings.defaultFeeds.indexOf(feed.id) !== -1}
                      onChange={this.feedsUpdated}>
                      {feed.name === '' ? '(unnamed feed)' : feed.name}
                    </Checkbox>
                  ))
                  : getMessage(messages, 'project.cannotFetchFeeds')
              }
              </Col>
              <Col xs={6}>
                <h4>{getMessage(messages, 'project.permissions')}</h4>
                {allPermissions.map((permission, i) => (
                  <Checkbox
                    inputRef={ref => { this[`permission-${permission.type}`] = ref }}
                    key={permission.type}
                    checked={settings.permissions.indexOf(permission.type) !== -1}
                    onChange={this.permissionsUpdated}>
                    {permission.name}
                  </Checkbox>
                ))}
              </Col>
            </Row>
            : ''
          }
        </Col>
      </Row>
    )
  }
}
