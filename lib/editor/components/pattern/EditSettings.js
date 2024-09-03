// @flow

import React, {Component} from 'react'
import {Alert, Checkbox, Form, FormControl, ControlLabel} from 'react-bootstrap'
import Rcslider from 'rc-slider'

import {updateEditSetting} from '../../actions/active'
import {CLICK_OPTIONS} from '../../util'
import toSentenceCase from '../../../common/util/text'
import type {EditSettingsState} from '../../../types/reducers'

type Props = {
  editSettings: EditSettingsState,
  patternSegment: number,
  updateEditSetting: typeof updateEditSetting
}

type State = {
  open: boolean
}

const STOP_INTERVALS = {
  '100': '100m',
  '400': <strong>400m</strong>,
  '800': '800m',
  '1600': '1600m'
}

export default class EditSettings extends Component<Props, State> {
  state = {
    open: false
  }

  _formatSliderTip = (value: number) =>
    `${value}m (${Math.round(value * 0.000621371 * 100) / 100}mi)`

  _onCheckboxChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.updateEditSetting({
      setting: evt.target.name,
      value: evt.target.checked
    })

  _onClickEdit = () => this.setState({open: !this.state.open})

  _onSelectChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.updateEditSetting({
      setting: evt.target.name,
      value: evt.target.value
    })

  _onSliderChange = (value: number) =>
    this.props.updateEditSetting({
      setting: 'stopInterval',
      value
    })

  render () {
    // Edit Settings passed in are present
    const {editSettings, patternSegment, updateEditSetting} = this.props
    const {
      editGeometry,
      followStreets,
      onMapClick,
      stopInterval
    } = editSettings
    const SETTINGS = [
      {type: 'followStreets', label: 'Suivre les rues'},
      {type: 'avoidMotorways', label: 'Eviter les autoroutes'},
      {type: 'hideStopHandles', label: 'Masquer les stop handles'},
      {type: 'hideInactiveSegments', label: 'Masquer les segments inactifs'},
      {type: 'showStops', label: 'Afficher les arrêts'},
      {type: 'showTooltips', label: 'Afficher les info-bulles'}
    ]
    if (!editGeometry) return null
    const noSegmentIsActive = !patternSegment && patternSegment !== 0
    return (
      <div>
        {SETTINGS.map((s, i) => (
          <Checkbox
            checked={editSettings[s.type]}
            key={s.type}
            // Disable hide inactive segments if no segment is selected (hiding in
            // this state would cause the entire shape to disappear).
            disabled={
              (s.type === 'hideInactiveSegments' && noSegmentIsActive) ||
              (s.type === 'avoidMotorways' && !followStreets)
            }
            name={s.type}
            style={{margin: '3px 0'}}
            onChange={this._onCheckboxChange}>
            <small>{s.label}</small>
          </Checkbox>
        ))}
        <ControlLabel><small>Shape editing mode</small></ControlLabel>
        <FormControl
          componentClass='select'
          value={onMapClick}
          name={'onMapClick'}
          onChange={this._onSelectChange}>
          {CLICK_OPTIONS.map(v => {
            // ADD_STOPS_AT_INTERSECTIONS only enabled for nysdot extenstion
            // (due to custom r5 deployment)
            // FIXME: Temporarily disable add stops at intersection entirely
            // (needs to be fixed for sql editor).
            const disabled = v === 'ADD_STOPS_AT_INTERSECTIONS' // && !isExtensionEnabled('nysdot')
            return (
              <option
                key={v}
                disabled={disabled}
                value={v}>{toSentenceCase(v.replace(/_/g, ' '))}
              </option>
            )
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
              <strong>Attention !</strong>
              {' '}
              Ce mode d'édition crée de nouveaux arrêts. A moins que des arrêts existent à proximité, il n'est pas recommandé d'utiliser ce mode.
            </small>
          </Alert>
          : null
        }
      </div>
    )
  }
}

type AddStopProps = {
  editSettings: EditSettingsState,
  updateEditSetting: typeof updateEditSetting
}

class AddStopAtIntersectionSettings extends Component<AddStopProps> {
  _onNumberChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.updateEditSetting({
      setting: evt.target.name,
      value: +evt.target.value
    })

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
        <span> mètres </span>
        {/* before/after intersection */}
        <FormControl
          componentClass='select'
          value={afterIntersection}
          name='afterIntersection'
          onChange={this._onNumberChange}
          style={{width: '80px', marginTop: '10px'}}>
          <option value={1}>après</option>
          <option value={0}>avant</option>
        </FormControl>
        <span> tous </span>
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
