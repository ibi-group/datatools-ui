// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import {
  Button,
  Checkbox,
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  InputGroup,
  ListGroup,
  ListGroupItem,
  Panel
} from 'react-bootstrap'

import * as feedsActions from '../actions/feeds'
import { FREQUENCY_INTERVALS } from '../../common/constants'
import {getComponentMessages} from '../../common/util/config'
import LabelAssigner from '../components/LabelAssigner'
import type { Feed, FetchFrequency, Project } from '../../types'
import type { ManagerUserState } from '../../types/reducers'

import FeedFetchFrequency from './FeedFetchFrequency'

type Props = {
  confirmDeleteFeedSource: () => void,
  disabled: ?boolean,
  feedSource: Feed,
  project: Project,
  updateFeedSource: typeof feedsActions.updateFeedSource,
  user: ManagerUserState
}

type State = {
  name?: ?string,
  url?: ?string
}

export default class GeneralSettings extends Component<Props, State> {
  messages = getComponentMessages('GeneralSettings')
  state = {}

  _onChange = ({target}: SyntheticInputEvent<HTMLInputElement>) => {
    // Change empty string to null to avoid setting URL to empty string value.
    let value = target.value || null
    if (target.name === 'url' && value) value = value.trim()
    this.setState({[target.name]: value})
  }

  _onToggleDeployable = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {deployable: !feedSource.deployable})
  }

  _getFormValue = (key: 'name' | 'url') => {
    // If state value does not exist (i.e., form is unedited), revert to value
    // from props.
    const value = typeof this.state[key] === 'undefined'
      ? this.props.feedSource[key]
      : this.state[key]
    // Revert to empty string to avoid console error with null value for form.
    return value || ''
  }

  _onToggleAutoFetch = () => {
    const {feedSource, updateFeedSource} = this.props
    const value = feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY'
      ? 'MANUALLY_UPLOADED'
      : 'FETCHED_AUTOMATICALLY'
    updateFeedSource(feedSource, {retrievalMethod: value})
  }

  _onSelectFetchInterval = (fetchInterval: number) => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {fetchInterval})
  }

  _onSelectFetchFrequency = (fetchFrequency: FetchFrequency) => {
    const {feedSource, updateFeedSource} = this.props
    let {fetchInterval} = feedSource
    const intervals = FREQUENCY_INTERVALS[fetchFrequency]
    // If the current interval is not in the set for this frequency, overwrite
    // with the first value from the allowed set.
    if (intervals.indexOf(fetchInterval) === -1) {
      fetchInterval = intervals[0]
    }
    updateFeedSource(feedSource, {fetchFrequency, fetchInterval})
  }

  _onTogglePublic = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {isPublic: !feedSource.isPublic})
  }

  _onNameChanged = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({name: evt.target.value})
  }

  _onNameSaved = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {name: this.state.name})
  }

  _onSaveUrl = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {url: this.state.url})
  }

  render () {
    const {
      confirmDeleteFeedSource,
      disabled,
      feedSource,
      project
    } = this.props
    const {
      name,
      url
    } = this.state
    const autoFetchFeed = feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY'
    return (
      <Col xs={7}>
        {/* Settings */}
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h3'>{this.messages('title')}</Panel.Title></Panel.Heading>
          <ListGroup>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>{this.messages('feedSourceName')}</ControlLabel>
                <InputGroup>
                  <FormControl
                    disabled={disabled}
                    name={'name'}
                    onChange={this._onChange}
                    value={this._getFormValue('name')} />
                  <InputGroup.Button>
                    <Button
                      // disable if no change or no value (name is required).
                      disabled={disabled || !name || name === feedSource.name}
                      onClick={this._onNameSaved}>
                      {this.messages('rename')}
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  checked={feedSource.deployable}
                  data-test-id='make-feed-source-deployable-button'
                  onChange={this._onToggleDeployable}>
                  <strong>{this.messages('makeDeployable')}</strong>
                </Checkbox>
                <small>{this.messages('makeDeployableHint')}</small>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h3'>{this.messages('autoFetch.title')}</Panel.Title></Panel.Heading>
          <ListGroup>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>{this.messages('autoFetch.url')}</ControlLabel>
                <InputGroup data-test-id='feed-source-url-input-group'>
                  <FormControl
                    disabled={disabled}
                    name={'url'}
                    onChange={this._onChange}
                    value={this._getFormValue('url')}
                  />
                  <InputGroup.Button>
                    <Button
                      // Disable if no change or field has not been edited.
                      disabled={disabled || typeof url === 'undefined' || url === feedSource.url}
                      onClick={this._onSaveUrl}>
                      {this.messages('autoFetch.urlButton')}
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  bsStyle='danger'
                  checked={autoFetchFeed}
                  disabled={disabled}
                  onChange={this._onToggleAutoFetch}>
                  <strong>{this.messages('autoFetch.checkbox')}</strong>
                </Checkbox>
                <small>{this.messages('autoFetch.hint')}</small>
              </FormGroup>
              {autoFetchFeed
                ? <FeedFetchFrequency
                  fetchFrequency={feedSource.fetchFrequency}
                  fetchInterval={feedSource.fetchInterval}
                  onSelectFetchFrequency={this._onSelectFetchFrequency}
                  onSelectFetchInterval={this._onSelectFetchInterval}
                />
                : null
              }
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h3'>{this.messages('labels.title')}</Panel.Title></Panel.Heading>
          <Panel.Body>
            <LabelAssigner feedSource={feedSource} project={project} />
          </Panel.Body>
        </Panel>
        <Panel bsStyle='danger'>
          <Panel.Heading><Panel.Title componentClass='h3'>{this.messages('dangerZone')}</Panel.Title></Panel.Heading>
          <ListGroup>
            <ListGroupItem>
              <Button
                className='pull-right'
                disabled={disabled}
                onClick={this._onTogglePublic}>
                {this.messages(`make.${feedSource.isPublic ? 'private' : 'public'}`)}
              </Button>
              <h4>{this.messages(`make.${feedSource.isPublic ? 'private' : 'public'}Desc`)}</h4>
              <p>{this.messages(`make.${feedSource.isPublic ? 'public' : 'private'}State`)}</p>
            </ListGroupItem>
            <ListGroupItem>
              <Button
                bsStyle='danger'
                className='pull-right'
                disabled={disabled}
                onClick={confirmDeleteFeedSource}>
                <Icon type='trash' /> {this.messages('deleteFeedSource')}
              </Button>
              <h4>{this.messages('deleteFeedSourceDesc')}</h4>
              <p>{this.messages('deleteFeedSourceHint')}</p>
            </ListGroupItem>
          </ListGroup>
        </Panel>
      </Col>
    )
  }
}
