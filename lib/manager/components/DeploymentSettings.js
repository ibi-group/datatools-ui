import Icon from '@conveyal/woonerf/components/icon'
import objectPath from 'object-path'
import React, {Component, PropTypes} from 'react'
import {Row, Col, Button, Panel, Glyphicon, Radio, FormGroup, ControlLabel, FormControl} from 'react-bootstrap'
import update from 'react-addons-update'
import {shallowEqual} from 'react-pure-render'

import {getMessage, getComponentMessages} from '../../common/util/config'
import CollapsiblePanel from './CollapsiblePanel'
import {FIELDS, SERVER_FIELDS, UPDATER_FIELDS} from '../util/deployment'

export default class DeploymentSettings extends Component {
  static propTypes = {
    project: PropTypes.object,
    updateProjectSettings: PropTypes.func
  }

  state = {
    buildConfig: objectPath.get(this.props, 'project.buildConfig') || {},
    routerConfig: objectPath.get(this.props, 'project.routerConfig') || {},
    otpServers: objectPath.get(this.props, 'project.otpServers') || []
  }

  componentWillReceiveProps (nextProps) {
    this.setState({
      buildConfig: objectPath.get(nextProps, 'project.buildConfig') || {},
      routerConfig: objectPath.get(nextProps, 'project.routerConfig') || {},
      otpServers: objectPath.get(nextProps, 'project.otpServers') || []
    })
  }

  _getOnChange = (evt, index = null) => {
    let item = FIELDS.find(f => f.name === evt.target.name)
    if (!item) item = UPDATER_FIELDS.find(f => f.name === evt.target.name)
    if (!item) item = SERVER_FIELDS.find(f => f.name === evt.target.name)
    if (item) {
      const stateUpdate = {}
      item.effects && item.effects.forEach(e => {
        objectPath.set(stateUpdate, `${e.key}.$set`, e.value)
      })
      switch (item.type) {
        case 'checkbox':
          return this._onChangeCheckbox(evt, stateUpdate, index)
        case 'select-bool':
          return this._onSelectBool(evt, stateUpdate, index)
        case 'number':
          return this._onChangeNumber(evt, stateUpdate, index)
        default:
          // check for split property, which indicates that comma-separated list should be split into array
          if (item.split) {
            return this._onChangeSplit(evt, stateUpdate, index)
          } else {
            return this._onChange(evt, stateUpdate, index)
          }
      }
    } else {
      console.log('no onChange function available')
    }
  }

  _onChangeCheckbox = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', index) : evt.target.name
    objectPath.set(stateUpdate, `${name}.$set`, evt.target.checked)
    this.setState(update(this.state, stateUpdate))
  }

  _onChangeSplit = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', index) : evt.target.name
    objectPath.set(stateUpdate, `${name}.$set`, evt.target.value.split(','))
    this.setState(update(this.state, stateUpdate))
  }

  _onAddServer = () => {
    const stateUpdate = { otpServers: { $push: [{name: '', publicUrl: '', internalUrl: [], admin: false}] } }
    this.setState(update(this.state, stateUpdate))
  }

  _onAddUpdater = () => {
    const stateUpdate = {}
    objectPath.set(stateUpdate,
      `routerConfig.updaters.$${this.state.routerConfig.updaters ? 'push' : 'set'}`,
      [{type: '', url: '', frequencySec: '', sourceType: '', defaultAgencyId: ''}]
    )
    this.setState(update(this.state, stateUpdate))
  }

  _onRemoveUpdater = (index) => {
    const stateUpdate = {}
    objectPath.set(stateUpdate, `routerConfig.updaters.$splice`, [[index, 1]])
    this.setState(update(this.state, stateUpdate))
  }

  _onRemoveServer = (index) => {
    const stateUpdate = { otpServers: { $splice: [[index, 1]] } }
    this.setState(update(this.state, stateUpdate))
  }

  _onChange = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', index) : evt.target.name
    objectPath.set(stateUpdate, `${name}.$set`, evt.target.value)
    this.setState(update(this.state, stateUpdate))
  }

  _onChangeNumber = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', index) : evt.target.name
    objectPath.set(stateUpdate, `${name}.$set`, +evt.target.value)
    this.setState(update(this.state, stateUpdate))
  }

  _onSelectBool = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', index) : evt.target.name
    objectPath.set(stateUpdate, `${name}.$set`, (evt.target.value === 'true'))
    this.setState(update(this.state, stateUpdate))
  }

  _getFields = (fields, state, filter, messages) => {
    return fields
      .filter(f => filter ? f.name.startsWith(filter) : f)
      .map((f, index) => {
        // check for conditional render, e.g. elevationBucket is dependent on fetchElevationUS
        if (f.condition) {
          const val = objectPath.get(state, `${f.condition.key}`)
          if (val !== f.condition.value) return null
        }
        return (
          <Col key={index} xs={f.width || 6}>
            <FormGroup>
              <ControlLabel>{getMessage(messages, `deployment.${f.name}`)}</ControlLabel>
              <FormControl
                value={objectPath.get(state, `${f.name}`)}
                {...f}
                onChange={this._getOnChange}
                children={f.children
                  ? f.children.map((o, i) => (
                    <option key={i} {...o} />
                  ))
                  : undefined
                } />
            </FormGroup>
          </Col>
        )
      })
  }

  _onSave = (evt) => this.props.updateProjectSettings(this.props.project, this.state)

  _onToggleCustomBounds = (evt) => {
    const stateUpdate = { useCustomOsmBounds: { $set: (evt.target.value === 'true') } }
    this.setState(update(this.state, stateUpdate))
  }

  _onChangeBounds = (evt) => {
    const bBox = evt.target.value.split(',')
    if (bBox.length === 4) {
      const stateUpdate = { $merge: { osmWest: bBox[0], osmSouth: bBox[1], osmEast: bBox[2], osmNorth: bBox[3] } }
      this.setState(update(this.state, stateUpdate))
    }
  }

  render () {
    const updaters = objectPath.get(this.state, 'routerConfig.updaters') || []
    const {otpServers} = this.state
    const messages = getComponentMessages('ProjectSettings')
    const {project, editDisabled} = this.props
    const noEdits = Object.keys(this.state)
      .map(key => shallowEqual(this.state[key], project[key]))
      .indexOf(false) === -1
    return (
      <div className='deployment-settings-panel'>
        {/* Build config settings */}
        <Panel header={<h4><Icon type='cog' /> {getMessage(messages, 'deployment.buildConfig.title')}</h4>}>
          {this._getFields(FIELDS, this.state, 'buildConfig', messages)}
        </Panel>
        {/* Router config settings */}
        <Panel header={<h4><Icon type='cog' /> {getMessage(messages, 'deployment.routerConfig.title')}</h4>}>
          {this._getFields(FIELDS, this.state, 'routerConfig', messages)}
        </Panel>
        {/* Updaters (technically still a part of router config) */}
        <Panel header={
          <h4>
            <Button
              className='pull-right'
              bsStyle='success'
              bsSize='xsmall'
              onClick={this._onAddUpdater}>
              <Glyphicon glyph='plus' /> {getMessage(messages, 'deployment.routerConfig.updaters.new')}
            </Button>
            <Icon type='bolt' /> {getMessage(messages, 'deployment.routerConfig.updaters.title')}
          </h4>
        }>
          {updaters.map((u, i) => (
            <CollapsiblePanel
              key={i}
              index={i}
              fields={UPDATER_FIELDS}
              data={u}
              defaultExpanded={!u.type}
              onRemove={this._onRemoveUpdater}
              onChange={this._getOnChange}
              title={u.type
                ? <span>
                  {u.type}{'  '}
                  <small>{u.url}</small>
                </span>
                : `[${getMessage(messages, 'deployment.routerConfig.updaters.title_placeholder')}]`
              }
            />
          ))}
        </Panel>
        {/* OTP server settings */}
        <Panel header={
          <h4>
            <Button
              className='pull-right'
              bsStyle='success'
              bsSize='xsmall'
              onClick={this._onAddServer}>
              <Glyphicon glyph='plus' /> {getMessage(messages, 'deployment.otpServers.new')}
            </Button>
            <Icon type='server' /> {getMessage(messages, 'deployment.otpServers.title')}
          </h4>
        }>
          <div>
            {otpServers.map((server, i) => (
              <CollapsiblePanel
                key={i}
                index={i}
                fields={SERVER_FIELDS}
                defaultExpanded={!server.name}
                title={server.name
                  ? <span>
                    {server.name}{'  '}
                    <small>{server.publicUrl}</small>
                  </span>
                  : `[${getMessage(messages, 'deployment.otpServers.serverPlaceholder')}]`
                }
                data={server}
                onRemove={this._onRemoveServer}
                onChange={this._getOnChange} />
            ))}
          </div>
        </Panel>
        {/* OSM extract settings */}
        <Panel header={<h4><Icon type='globe' /> {getMessage(messages, 'deployment.osm.title')}</h4>}>
          <FormGroup
            onChange={this._onToggleCustomBounds}>
            <Radio
              name='osm-extract'
              checked={typeof this.state.useCustomOsmBounds !== 'undefined' ? !this.state.useCustomOsmBounds : !project.useCustomOsmBounds}
              value={false}>
              {getMessage(messages, 'deployment.osm.gtfs')}
            </Radio>
            <Radio
              name='osm-extract'
              checked={typeof this.state.useCustomOsmBounds !== 'undefined' ? this.state.useCustomOsmBounds : project.useCustomOsmBounds}
              value>
              {getMessage(messages, 'deployment.osm.custom')}
            </Radio>
          </FormGroup>
          {project.useCustomOsmBounds || this.state.useCustomOsmBounds
            ? <FormGroup>
              <ControlLabel>{(<span><Glyphicon glyph='fullscreen' /> {getMessage(messages, 'deployment.osm.bounds')}</span>)}</ControlLabel>
              <FormControl
                type='text'
                defaultValue={project.osmNorth !== null ? `${project.osmWest},${project.osmSouth},${project.osmEast},${project.osmNorth}` : ''}
                placeholder='-88.45,33.22,-87.12,34.89'
                name='osmBounds'
                onChange={this._onChangeBounds} />
            </FormGroup>
            : null
          }
        </Panel>
        <Row>
          <Col md={12}>
            {/* Save button */}
            <Button
              bsStyle='primary'
              disabled={editDisabled || noEdits}
              onClick={this._onSave}>
              {getMessage(messages, 'save')}
            </Button>
          </Col>
        </Row>
      </div>
    )
  }
}
