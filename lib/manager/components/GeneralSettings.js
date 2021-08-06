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
import type { Feed, FetchFrequency, Project } from '../../types'
import type { ManagerUserState } from '../../types/reducers'
import LabelAssigner from '../components/LabelAssigner'

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
  state = {}

  _onChange = ({target}: SyntheticInputEvent<HTMLInputElement>) => {
    // Change empty string to null to avoid setting URL to empty string value.
    const value = target.value === '' ? null : target.value.trim()
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
        <Panel header={<h3>Settings</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>Feed source name</ControlLabel>
                <InputGroup>
                  <FormControl
                    value={this._getFormValue('name')}
                    name={'name'}
                    disabled={disabled}
                    onChange={this._onChange} />
                  <InputGroup.Button>
                    <Button
                      // disable if no change or no value (name is required).
                      disabled={disabled || !name || name === feedSource.name}
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
                  data-test-id='make-feed-source-deployable-button'
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
        <Panel header={<h3>Labels</h3>}>
          <LabelAssigner feedSource={feedSource} project={project} />
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
    )
  }
}
