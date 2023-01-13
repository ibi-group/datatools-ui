// @flow

import memoize from 'lodash.memoize'
import React, {Component} from 'react'
import update from 'react-addons-update'
import {
  Button,
  Checkbox,
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
  ListGroup,
  ListGroupItem,
  Panel,
  Row
} from 'react-bootstrap'
import validator from 'validator'

import {createFeedSource} from '../actions/feeds'
import Loading from '../../common/components/Loading'
import {FREQUENCY_INTERVALS} from '../../common/constants'
import {isExtensionEnabled} from '../../common/util/config'
import {validationState} from '../util'
import type {FetchFrequency, NewFeed} from '../../types'

import FeedFetchFrequency from './FeedFetchFrequency'

type Props = {
  createFeedSource: typeof createFeedSource,
  onCancel: () => void,
  projectId: string
}

type Validation = {
  _form: boolean,
  name?: boolean,
  url?: boolean
}

type State = {
  loading?: boolean,
  model: NewFeed,
  validation: Validation
}

export default class CreateFeedSource extends Component<Props, State> {
  componentWillMount () {
    this._initializeState(this.props)
    window.addEventListener('keydown', this._handleKeyDown)
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this._handleKeyDown)
  }

  _handleKeyDown = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
    switch (e.keyCode) {
      case 13: // ENTER
        this._onSave()
        break
      default:
        break
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    this._initializeState(nextProps)
  }

  _initializeState (props: Props) {
    this.setState({
      model: {
        autoFetchFeed: false,
        autoPublish: false,
        deployable: false,
        fetchFrequency: 'DAYS',
        fetchInterval: 1,
        name: '',
        projectId: props.projectId,
        url: ''
      },
      validation: {
        _form: false,
        name: true,
        url: true
      }
    })
  }

  _onInputChange = memoize(
    (fieldName: string) => (evt: SyntheticInputEvent<HTMLInputElement>) => {
      const updatedState: State = update(this.state, {
        model: {[fieldName]: {$set: evt.target.value}}
      })
      this.setState(updatedState)
      this._validateModel(updatedState.model)
    }
  )

  _onSelectFetchInterval = (fetchInterval: number) => {
    const updatedState: State = update(this.state, {
      model: {fetchInterval: {$set: fetchInterval}}
    })
    this.setState(updatedState)
  }

  _onSelectFetchFrequency = (fetchFrequency: FetchFrequency) => {
    let {fetchInterval} = this.state.model
    const intervals = FREQUENCY_INTERVALS[fetchFrequency]
    if (intervals.indexOf(fetchInterval) === -1) {
      fetchInterval = intervals[0]
    }
    const updatedState: State = update(this.state, {
      model: {
        fetchFrequency: {$set: fetchFrequency},
        fetchInterval: {$set: fetchInterval}
      }
    })
    this.setState(updatedState)
  }

  _onSave = () => {
    const {model, validation} = this.state
    // Prevent a save if the form has validation issues
    if (!validation._form) return
    // Ensure that URL with empty string literal is not saved to server.
    if (model.url === '') delete model.url
    model.retrievalMethod = model.autoFetchFeed
      ? 'FETCHED_AUTOMATICALLY'
      : 'MANUALLY_UPLOADED'
    this.props.createFeedSource(model)
    this.setState({loading: true})
  }

  _toggleCheckBox = memoize((fieldName: string) => () => {
    this.setState(
      update(this.state, {
        model: {[fieldName]: {$set: !this.state.model[fieldName]}}
      })
    )
  })

  _validateModel (model: NewFeed) {
    const validation: Validation = {
      _form: false,
      name: !(!model.name || model.name.length === 0),
      url: !model.url || validator.isURL(model.url)
    }
    validation._form = !!(validation.name && validation.url)
    this.setState({ validation })
  }

  render () {
    const {loading, model, validation} = this.state
    if (loading) return <Loading style={{marginTop: '30px'}} />
    return (
      <Row>
        <Col xs={12}>
          <h3>Crear Feed</h3>
        </Col>
        <Col xs={12} sm={8}>
          <Panel header={<h3>Ajustes</h3>}>
            <ListGroup fill>
              <ListGroupItem>
                <FormGroup
                  data-test-id='feed-source-name-input-container'
                  validationState={validationState(validation.name)}
                >
                  <ControlLabel>Nombre del Feed Source</ControlLabel>
                  <FormControl
                    value={model.name}
                    name={'name'}
                    onChange={this._onInputChange('name')}
                  />
                  <FormControl.Feedback />
                  {!validation.name && <HelpBlock>Obligatorio</HelpBlock>}
                </FormGroup>
              </ListGroupItem>
              <ListGroupItem>
                <FormGroup>
                  <Checkbox
                    checked={model.deployable}
                    onChange={this._toggleCheckBox('deployable')}
                  >
                    <strong>Hacer que el Feed Source sea desplegable</strong>
                  </Checkbox>
                  <small>
                    Habilite este Feed Source para ser desplegado a una
                    instancia de OpenTripPlanner (OTP) definida en la organización
                    como parte de una colección de Feed Sources o
                    individualmente
                  </small>
                </FormGroup>
              </ListGroupItem>
            </ListGroup>
          </Panel>
          <Panel header={<h3>Actualización automática</h3>}>
            <ListGroup fill>
              <ListGroupItem>
                <FormGroup validationState={validationState(validation.url)}>
                  <ControlLabel>Feed source actualización automática URL</ControlLabel>
                  <FormControl
                    value={model.url}
                    name={'url'}
                    onChange={this._onInputChange('url')}
                  />
                  <FormControl.Feedback />
                  {!validation.url && <HelpBlock>Por favor introduzca un URL válido</HelpBlock>}
                </FormGroup>
              </ListGroupItem>
              <ListGroupItem>
                <FormGroup>
                  <Checkbox
                    checked={model.autoFetchFeed}
                    onChange={this._toggleCheckBox('autoFetchFeed')}
                    bsStyle='danger'
                  >
                    <strong>Actualizar automáticamente Feed Source</strong>
                  </Checkbox>
                  <small>
                    Establezca este Feed Source para que se actualice automáticamente.
                  </small>
                  {model.autoFetchFeed
                    ? <FeedFetchFrequency
                      fetchFrequency={model.fetchFrequency}
                      fetchInterval={model.fetchInterval}
                      onSelectFetchFrequency={this._onSelectFetchFrequency}
                      onSelectFetchInterval={this._onSelectFetchInterval}
                    />
                    : null
                  }
                </FormGroup>
              </ListGroupItem>
            </ListGroup>
          </Panel>
          {isExtensionEnabled('mtc') && (
            <Panel header={<h3>Automatic publishing</h3>}>
              <ListGroup fill>
                <ListGroupItem>
                  <FormGroup>
                    <Checkbox
                      checked={model.autoPublish}
                      onChange={this._toggleCheckBox('autoPublish')}
                    >
                      <strong>Auto-publish this feed</strong>
                    </Checkbox>
                    <small>
                      Set this feed source to be automatically published
                      when a new version is automatically fetched.
                    </small>
                  </FormGroup>
                </ListGroupItem>
              </ListGroup>
            </Panel>
          )}
        </Col>
        <Col xs={12}>
          <Button
            onClick={this.props.onCancel}
            style={{marginRight: 10}}
          >
            Cancelar
          </Button>
          <Button
            bsStyle='primary'
            data-test-id='create-feed-source-button'
            disabled={!validation._form}
            onClick={this._onSave}
          >
            Guardar
          </Button>
        </Col>
      </Row>
    )
  }
}
