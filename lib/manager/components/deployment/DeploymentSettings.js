// @flow

import Icon from '@conveyal/woonerf/components/icon'
// $FlowFixMe coalesce method is missing in flow type
import {coalesce, get, set} from 'object-path'
import React, {Component} from 'react'
import {
  Button,
  Col,
  ControlLabel,
  FormControl,
  FormGroup,
  Glyphicon,
  Panel,
  Radio,
  Row
} from 'react-bootstrap'
import update from 'react-addons-update'
import {shallowEqual} from 'react-pure-render'
import {withRouter} from 'react-router'

import FormInput from '../../../common/components/FormInput'
import {getComponentMessages} from '../../../common/util/config'
import CollapsiblePanel from '../CollapsiblePanel'
import {parseBounds} from '../../util'
import {FIELDS, SERVER_FIELDS, UPDATER_FIELDS} from '../../util/deployment'
import {updateProject} from '../../actions/projects'
import type {Project} from '../../../types'

type Props = {
  editDisabled: boolean,
  project: Project,
  updateProject: typeof updateProject
}

type State = {
  buildConfig: Object,
  routerConfig: Object,
  useCustomOsmBounds?: boolean
}

class DeploymentSettings extends Component<Props, State> {
  messages = getComponentMessages('DeploymentSettings')

  state = {
    buildConfig: get(this.props, 'project.buildConfig') || {},
    routerConfig: get(this.props, 'project.routerConfig') || {}
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.project.lastUpdated !== this.props.project.lastUpdated) {
      // Reset state using project data if it is updated.
      this.setState({
        buildConfig: get(nextProps, 'project.buildConfig') || {},
        routerConfig: get(nextProps, 'project.routerConfig') || {}
      })
    }
  }

  _clearBuildConfig = () => {
    this.props.updateProject(this.props.project.id, {buildConfig: {}})
  }

  _clearRouterConfig = () => {
    this.props.updateProject(this.props.project.id, {routerConfig: {}})
  }

  _getOnChange = (evt, index = null) => {
    let item = FIELDS.find(f => f.name === evt.target.name)
    if (!item) item = UPDATER_FIELDS.find(f => f.name === evt.target.name)
    if (!item) item = SERVER_FIELDS.find(f => f.name === evt.target.name)
    if (item) {
      const stateUpdate = {}
      item.effects && item.effects.forEach(e => {
        set(stateUpdate, `${e.key}.$set`, e.value)
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
      console.warn('no onChange function available')
    }
  }

  _onChangeCheckbox = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', `${index}`) : evt.target.name
    set(stateUpdate, `${name}.$set`, evt.target.checked)
    this.setState(update(this.state, stateUpdate))
  }

  _onChangeSplit = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', `${index}`) : evt.target.name
    set(stateUpdate, `${name}.$set`, evt.target.value.split(','))
    this.setState(update(this.state, stateUpdate))
  }

  _onAddUpdater = () => {
    const stateUpdate = {}
    set(stateUpdate,
      `routerConfig.updaters.$${this.state.routerConfig.updaters ? 'push' : 'set'}`,
      [{type: '', url: '', frequencySec: 30, sourceType: '', feedId: ''}]
    )
    this.setState(update(this.state, stateUpdate))
  }

  _onRemoveUpdater = (index) => {
    const stateUpdate = {}
    set(stateUpdate, `routerConfig.updaters.$splice`, [[index, 1]])
    this.setState(update(this.state, stateUpdate))
  }

  _onChange = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', `${index}`) : evt.target.name
    // If value is empty string or undefined, set to null in settings object.
    // Otherwise, certain fields (such as 'fares') would cause issues with OTP.
    set(stateUpdate, `${name}.$set`, evt.target.value || null)
    this.setState(update(this.state, stateUpdate))
  }

  _onChangeNumber = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', `${index}`) : evt.target.name
    set(stateUpdate, `${name}.$set`, +evt.target.value)
    this.setState(update(this.state, stateUpdate))
  }

  _onSelectBool = (evt, stateUpdate = {}, index = null) => {
    const name = index !== null ? evt.target.name.replace('$index', `${index}`) : evt.target.name
    set(stateUpdate, `${name}.$set`, (evt.target.value === 'true'))
    this.setState(update(this.state, stateUpdate))
  }

  _getFields = (fields, state, filter) => {
    return fields
      .filter(f => filter ? f.name.startsWith(filter) : f)
      .map((f, index) => {
        const shouldRender = () => {
          // check for conditional render, e.g. elevationBucket is dependent on fetchElevationUS
          if (f.condition) {
            const {key, value} = f.condition
            const val = get(state, `${key}`)
            if (val !== value) return false
          }
          return true
        }
        return (
          <FormInput
            data={state}
            field={f}
            key={`${index}`}
            onChange={this._getOnChange}
            shouldRender={shouldRender}
            value={get(state, `${f.name}`)} />
        )
      })
  }

  _onSave = (evt) => this.props.updateProject(this.props.project.id, this.state, true)

  _onToggleCustomBounds = (evt) => {
    const stateUpdate = { useCustomOsmBounds: { $set: (evt.target.value === 'true') } }
    this.setState(update(this.state, stateUpdate))
  }

  _onChangeBounds = (evt) => {
    const parsedBoundsResult = parseBounds(evt.target.value)
    if (parsedBoundsResult.valid) {
      this.setState(
        update(
          this.state,
          {
            $set: {
              bounds: parsedBoundsResult.bounds
            }
          }
        )
      )
    }
  }

  /**
   * Get value for key from state or, if undefined, default to project property
   * from props.
   */
  _getValue = (key) => coalesce(this.state, [key], this.props.project[key])

  /**
   * Determine if deployment settings have been modified by checking that every
   * item in the state matches the original object found in the project object.
   */
  _noEdits = () => Object.keys(this.state)
    // $FlowFixMe it's fine if key doesn't exist in this.props.project
    .every(key => shallowEqual(this.state[key], this.props.project[key]))

  render () {
    const updaters = get(this.state, 'routerConfig.updaters') || []
    const {editDisabled, project} = this.props
    return (
      <div className='deployment-settings-panel' key={project.lastUpdated}>
        {/* Build config settings */}
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h4'>
            <Button
              bsSize='xsmall'
              className='pull-right'
              onClick={this._clearBuildConfig}>{this.messages('clear')}
            </Button>
            <Icon type='cog' /> {this.messages('buildConfig.title')}
          </Panel.Title></Panel.Heading>
          <Panel.Body>
            {this._getFields(FIELDS, this.state, 'buildConfig')}
          </Panel.Body>
        </Panel>
        {/* Router config settings */}
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h4'>
            <Button
              bsSize='xsmall'
              className='pull-right'
              onClick={this._clearRouterConfig}>{this.messages('clear')}
            </Button>
            <Icon type='cog' />{' '}
            {this.messages('routerConfig.title')}
          </Panel.Title></Panel.Heading>
          <Panel.Body>
            {this._getFields(FIELDS, this.state, 'routerConfig')}
          </Panel.Body>
        </Panel>
        {/* Real-time Updaters (technically still a part of router config) */}
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h4'>
            <Button
              bsSize='xsmall'
              bsStyle='success'
              className='pull-right'
              onClick={this._onAddUpdater}>
              <Glyphicon glyph='plus' />{' '}
              {this.messages('routerConfig.updaters.new')}
            </Button>
            <Icon type='bolt' />{' '}
            {this.messages('routerConfig.updaters.title')}
          </Panel.Title></Panel.Heading>
          <Panel.Body>
            {updaters.map((u, i) => (
              <CollapsiblePanel
                data={u}
                defaultExpanded={!u.type}
                fields={UPDATER_FIELDS}
                index={i}
                key={i}
                onChange={this._getOnChange}
                onRemove={this._onRemoveUpdater}
                testId={u.type
                  ? `${u.type}-${i}`
                  : `[${this.messages('routerConfig.updaters.placeholder')}]`
                }
                title={u.type
                  ? <span>
                    {u.type}{'  '}
                    <small>{u.url}</small>
                  </span>
                  : `[${this.messages('routerConfig.updaters.placeholder')}]`
                }
              />
            ))}
          </Panel.Body>
        </Panel>
        {/* OSM extract settings */}
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h4'><Icon type='globe' /> {this.messages('osm.title')}</Panel.Title></Panel.Heading>
          <Panel.Body>
            <FormGroup
              onChange={this._onToggleCustomBounds}>
              <Radio
                checked={!this._getValue('useCustomOsmBounds')}
                name='osm-extract'
                value={false}>
                {this.messages('osm.gtfs')}
              </Radio>
              <Radio
                checked={this._getValue('useCustomOsmBounds')}
                name='osm-extract'
                value>
                {this.messages('osm.custom')}
              </Radio>
            </FormGroup>
            {project.useCustomOsmBounds || this.state.useCustomOsmBounds
              ? <FormGroup>
                <ControlLabel>
                  <span>
                    <Glyphicon glyph='fullscreen' /> {this.messages('osm.bounds')}
                  </span>
                </ControlLabel>
                <FormControl
                  defaultValue={project.bounds
                    ? `${project.bounds.west},${project.bounds.south},${project.bounds.east},${project.bounds.north}`
                    : ''
                  }
                  name='osmBounds'
                  onChange={this._onChangeBounds}
                  placeholder={this.messages('boundsPlaceholder')}
                  type='text' />
              </FormGroup>
              : null
            }
          </Panel.Body>
        </Panel>
        <Row>
          <Col md={12}>
            {/* Save button */}
            <Button
              bsStyle='primary'
              data-test-id='save-settings-button'
              disabled={editDisabled || this._noEdits()}
              onClick={this._onSave}>
              {this.messages('save')}
            </Button>
          </Col>
        </Row>
      </div>
    )
  }
}

export default withRouter(DeploymentSettings)
