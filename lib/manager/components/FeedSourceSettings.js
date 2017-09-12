import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes, Component} from 'react'
import {Col, Row, ListGroup, ListGroupItem, Button, Panel, FormControl, InputGroup, ControlLabel, FormGroup, Checkbox} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'

import ExternalPropertiesTable from './ExternalPropertiesTable'
import toSentenceCase from '../../common/util/to-sentence-case'
// import {getComponentMessages} from '../../common/util/config'

export default class FeedSourceSettings extends Component {
  static propTypes = {
    activeComponent: PropTypes.string,
    activeSubComponent: PropTypes.string,
    confirmDeleteFeedSource: PropTypes.func,
    externalPropertyChanged: PropTypes.func,
    feedSource: PropTypes.object,
    feedSourcePropertyChanged: PropTypes.func,
    project: PropTypes.object,
    user: PropTypes.object
  }

  state = {}

  _onChange = ({target}) => this.setState({[target.name]: target.value})

  _onToggleDeployable = () => {
    const {feedSource, feedSourcePropertyChanged} = this.props
    feedSourcePropertyChanged(feedSource, 'deployable', !feedSource.deployable)
  }

  _onToggleAutoFetch = () => {
    const {feedSource, feedSourcePropertyChanged} = this.props
    const value = feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY'
      ? 'MANUALLY_UPLOADED'
      : 'FETCHED_AUTOMATICALLY'
    feedSourcePropertyChanged(feedSource, 'retrievalMethod', value)
  }

  _onTogglePublic = () => {
    const {feedSource, feedSourcePropertyChanged} = this.props
    feedSourcePropertyChanged(feedSource, 'isPublic', !feedSource.isPublic)
  }

  _onNameChanged = (evt) => this.setState({name: evt.target.value})

  _onNameSaved = () => {
    const {feedSource, feedSourcePropertyChanged} = this.props
    feedSourcePropertyChanged(feedSource, 'name', this.state.name)
    .then(() => this.setState({name: null}))
  }

  _onSaveUrl = () => {
    const {feedSource, feedSourcePropertyChanged} = this.props
    feedSourcePropertyChanged(feedSource, 'url', this.state.url)
    .then(() => this.setState({url: null}))
  }

  render () {
    const {
      activeComponent,
      activeSubComponent,
      confirmDeleteFeedSource,
      externalPropertyChanged,
      feedSource,
      project,
      user
    } = this.props
    const {
      name,
      url
    } = this.state
    // const messages = getComponentMessages('FeedSourceSettings')
    const disabled = !user.permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'manage-feed')
    const isProjectAdmin = user.permissions.isProjectAdmin(project.id, project.organizationId)
    // const editGtfsDisabled = !user.permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'edit-gtfs')
    const autoFetchFeed = feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY'
    const resourceType = activeComponent === 'settings' && activeSubComponent && activeSubComponent.toUpperCase()
    if (disabled) {
      return (
        <Row>
          <Col xs={6} mdOffset={3}>
            <p className='lead text-center'><strong>Warning!</strong> You do not have permission to edit details for this feed source.</p>
          </Col>
        </Row>
      )
    }
    return (
      <Row>
        <Col xs={3}>
          {/* Side panel */}
          <Panel>
            <ListGroup fill>
              <LinkContainer
                to={`/feed/${feedSource.id}/settings`}
                active={!activeSubComponent}>
                <ListGroupItem>General</ListGroupItem>
              </LinkContainer>
              {Object.keys(feedSource.externalProperties || {}).map(resourceType => {
                const resourceLowerCase = resourceType.toLowerCase()
                return (
                  <LinkContainer
                    key={resourceType}
                    to={`/feed/${feedSource.id}/settings/${resourceLowerCase}`}
                    active={activeSubComponent === resourceLowerCase}>
                    <ListGroupItem>{toSentenceCase(resourceType)} properties</ListGroupItem>
                  </LinkContainer>
                )
              })}
            </ListGroup>
          </Panel>
        </Col>
        <Col xs={6} />
        {!resourceType
          ? <Col xs={7}>
            {/* Settings */}
            <Panel header={<h3>Settings</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <FormGroup>
                    <ControlLabel>Feed source name</ControlLabel>
                    <InputGroup>
                      <FormControl
                        value={name || feedSource.name}
                        name={'name'}
                        disabled={disabled}
                        onChange={this._onChange} />
                      <InputGroup.Button>
                        <Button
                          disabled={disabled || !name || name === feedSource.name} // disable if no change or no value.
                          onClick={this._onNameSaved}>
                          Rename
                        </Button>
                      </InputGroup.Button>
                    </InputGroup>
                  </FormGroup>
                </ListGroupItem>
                <ListGroupItem>
                  <FormGroup>
                    <Checkbox
                      checked={feedSource.deployable}
                      onChange={this._onToggleDeployable}>
                      <strong>Make feed source deployable</strong>
                    </Checkbox>
                    <small>Enable this feed source to be deployed to an OpenTripPlanner (OTP) instance (defined in organization settings) as part of a collection of feed sources or individually.</small>
                  </FormGroup>
                </ListGroupItem>
              </ListGroup>
            </Panel>
            <Panel header={<h3>Automatic fetch</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <FormGroup>
                    <ControlLabel>Feed source fetch URL</ControlLabel>
                    <InputGroup>
                      <FormControl
                        value={url || feedSource.url}
                        name={'url'}
                        disabled={disabled}
                        onChange={this._onChange} />
                      <InputGroup.Button>
                        <Button
                          disabled={disabled || url === feedSource.url} // disable if no change.
                          onClick={this._onSaveUrl}>
                          Change URL
                        </Button>
                      </InputGroup.Button>
                    </InputGroup>
                  </FormGroup>
                </ListGroupItem>
                <ListGroupItem>
                  <FormGroup>
                    <Checkbox
                      checked={autoFetchFeed}
                      disabled={disabled}
                      onChange={this._onToggleAutoFetch}
                      bsStyle='danger'>
                      <strong>Auto fetch feed source</strong>
                    </Checkbox>
                    <small>Set this feed source to fetch automatically. (Feed source URL must be specified and project auto fetch must be enabled.)</small>
                  </FormGroup>
                </ListGroupItem>
              </ListGroup>
            </Panel>
            <Panel bsStyle='danger' header={<h3>Danger zone</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <Button
                    onClick={this._onTogglePublic}
                    disabled={disabled}
                    className='pull-right'>
                    Make {feedSource.isPublic ? 'private' : 'public'}
                  </Button>
                  <h4>Make this feed source {feedSource.isPublic ? 'private' : 'public'}.</h4>
                  <p>This feed source is currently {feedSource.isPublic ? 'public' : 'private'}.</p>
                </ListGroupItem>
                <ListGroupItem>
                  <Button
                    onClick={confirmDeleteFeedSource}
                    className='pull-right'
                    disabled={disabled}
                    bsStyle='danger'>
                    <Icon type='trash' /> Delete feed source
                  </Button>
                  <h4>Delete this feed source.</h4>
                  <p>Once you delete a feed source, it cannot be recovered.</p>
                </ListGroupItem>
              </ListGroup>
            </Panel>
          </Col>
          : <Col xs={7}>
            <ExternalPropertiesTable
              resourceType={resourceType}
              feedSource={feedSource}
              editingIsDisabled={disabled}
              isProjectAdmin={isProjectAdmin}
              resourceProps={feedSource.externalProperties[resourceType]}
              externalPropertyChanged={externalPropertyChanged} />
          </Col>
        }
      </Row>
    )
  }
}
