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
        <Panel header={<h3>Ajustes</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>Nombre del Feed source</ControlLabel>
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
                      Renombrar
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
                  <strong>Hacer el Feed Source desplegable</strong>
                </Checkbox>
                <small>Permitir que esta fuente de alimentación se despliegue en una instancia de OpenTripPlanner (OTP) como parte de una colección de Feed Sources o individualmente.</small>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel header={<h3>Actualización automática</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>Feed source URL para actualizar</ControlLabel>
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
                      Actualizar URL
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
                  <strong>Actualizar automáticamente el Feed Source</strong>
                </Checkbox>
                <small>Actualizar automáticamente</small>
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
        <Panel header={<h3>Etiquetas</h3>}>
          <LabelAssigner feedSource={feedSource} project={project} />
        </Panel>
        <Panel bsStyle='danger' header={<h3>Zona peligrosa</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <Button
                onClick={this._onTogglePublic}
                disabled={disabled}
                className='pull-right'>
                Hacer {feedSource.isPublic ? 'privado' : 'público'}
              </Button>
              <h4>Hacer este Feed Source {feedSource.isPublic ? 'privado' : 'público'}.</h4>
              <p>Este Feed source actualmente es {feedSource.isPublic ? 'público' : 'privado'}.</p>
            </ListGroupItem>
            <ListGroupItem>
              <Button
                onClick={confirmDeleteFeedSource}
                className='pull-right'
                disabled={disabled}
                bsStyle='danger'>
                <Icon type='trash' /> Eliminar Feed Source
              </Button>
              <h4>Eliminar este Feed Source.</h4>
              <p>Una vez eliminado, no se puede recuperar.</p>
            </ListGroupItem>
          </ListGroup>
        </Panel>
      </Col>
    )
  }
}
