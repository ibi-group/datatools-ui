import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Alert, Button, Checkbox, Panel, Form, FormControl, ControlLabel} from 'react-bootstrap'
import Rcslider from 'rc-slider'
import toSentenceCase from 'to-sentence-case'

import {CLICK_OPTIONS} from '../../util'
import {isExtensionEnabled} from '../../../common/util/config'

const STOP_INTERVALS = {
  100: '100m',
  400: <strong>400m</strong>,
  800: '800m',
  1600: '1600m'
}

export default class EditSettings extends Component {
  static propTypes = {
    editSettings: PropTypes.object,
    updateEditSetting: PropTypes.func.isRequired
  }

  state = {
    open: false
  }

  _formatSliderTip = (value) => `${value}m (${Math.round(value * 0.000621371 * 100) / 100}mi)`

  _onCheckboxChange = (evt) => this.props.updateEditSetting(evt.target.name, evt.target.checked)

  _onClickEdit = () => this.setState({open: !this.state.open})

  _onSelectChange = (evt) => this.props.updateEditSetting(evt.target.name, evt.target.value)

  _onSliderChange = (value) => this.props.updateEditSetting('stopInterval', value)

  render () {
    const {editSettings, updateEditSetting} = this.props
    const {
      editGeometry,
      onMapClick,
      stopInterval
    } = editSettings
    const SETTINGS = [
      {type: 'followStreets', label: 'Snap to streets'},
      {type: 'snapToStops', label: 'Snap to stops'},
      {type: 'showStops', label: 'Show stops'},
      {type: 'showTooltips', label: 'Show tooltips'}
    ]

    if (!editGeometry) return null

    return (
      <div>
        <Button
          onClick={this._onClickEdit}
          bsStyle='link'
          bsSize='small'>
          <Icon type='cog' />Edit settings
        </Button>
        <Panel style={{margin: '0px', border: '0px'}} collapsible expanded={this.state.open}>
          {SETTINGS.map((s, i) => (
            <Checkbox
              key={s.type}
              style={i === 0 ? {marginTop: '0px', marginBottom: '5px'} : {marginBottom: '5px'}}
              checked={editSettings[s.type]}
              name={s.type}
              onChange={this._onCheckboxChange}>
              <small>{s.label}</small>
            </Checkbox>
          ))}
          <ControlLabel>Editing mode</ControlLabel>
          <FormControl
            componentClass='select'
            value={onMapClick}
            name={'onMapClick'}
            onChange={this._onSelectChange}>
            {CLICK_OPTIONS.map(v => {
              // ADD_STOPS_AT_INTERSECTIONS only enabled for nysdot extenstion (due to custom r5 deployment)
              const disabled = v === 'ADD_STOPS_AT_INTERSECTIONS' && !isExtensionEnabled('nysdot')
              return <option key={v} disabled={disabled} value={v}>{toSentenceCase(v.replace(/_/g, ' '))}</option>
            })}
          </FormControl>
          {onMapClick === 'ADD_STOPS_AT_INTERVAL'
            ? <div style={{marginTop: '20px'}} >
              <Rcslider
                min={100}
                max={2000}
                defaultValue={stopInterval}
                onAfterChange={this._onSliderChange}
                step={25}
                marks={STOP_INTERVALS}
                tipFormatter={this._formatSliderTip} />
            </div>
            : onMapClick === 'ADD_STOPS_AT_INTERSECTIONS'
            ? <AddStopAtIntersectionSettings
              editSettings={editSettings}
              updateEditSetting={updateEditSetting} />
            : null
          }
          {/* Show alert/warning if experimental mode is chosen. */}
          {onMapClick.includes('ADD_')
            ? <Alert bsStyle='warning' style={{marginTop: '30px'}}>
              <small>
                <strong>Warning!</strong>
                {' '}
                This editing mode creates new stops. Unless no existing stops are nearby, this mode is not recommended.
              </small>
            </Alert>
            : null
          }
        </Panel>
      </div>
    )
  }
}

class AddStopAtIntersectionSettings extends Component {
  static propTypes = {
    editSettings: PropTypes.object,
    updateEditSetting: PropTypes.func.isRequired
  }

  _onNumberChange = (evt) => this.props.updateEditSetting(evt.target.name, +evt.target.value)

  render () {
    const {editSettings} = this.props
    const {
      distanceFromIntersection,
      afterIntersection,
      intersectionStep
    } = editSettings
    return (
      <Form inline>
        {/* distance from intersection */}
        <FormControl
          type='number' step={5} min={0} max={100}
          value={distanceFromIntersection}
          name='distanceFromIntersection'
          onChange={this._onNumberChange}
          style={{width: '60px', marginTop: '10px'}} />
        <span> meters </span>
        {/* before/after intersection */}
        <FormControl
          componentClass='select'
          value={afterIntersection}
          name='afterIntersection'
          onChange={this._onNumberChange}
          style={{width: '80px', marginTop: '10px'}}>
          <option value={1}>after</option>
          <option value={0}>before</option>
        </FormControl>
        <span> every </span>
        {/* every n intersections */}
        <FormControl
          type='number' step={1} max={10} min={1}
          value={intersectionStep}
          name='intersectionStep'
          onChange={this._onNumberChange}
          style={{width: '55px', marginTop: '10px'}} />
        <span> intersections</span>
      </Form>
    )
  }
}
