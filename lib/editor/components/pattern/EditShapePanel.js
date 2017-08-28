import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Button, ButtonGroup} from 'react-bootstrap'
import ll from '@conveyal/lonlat'
import numeral from 'numeral'
import lineDistance from 'turf-line-distance'

import EditSettings from './EditSettings'
import { polyline as getPolyline } from '../../../scenario-editor/utils/valhalla'

export default class EditShapePanel extends Component {
  async drawPatternFromStops (pattern, stops, followStreets) {
    const coordinates = followStreets
      ? await getPolyline(stops)
      : stops.map(stop => ll.toCoordinates(stop))
    if (coordinates) {
      this.props.updateActiveEntity(pattern, 'trippattern', {shape: {type: 'LineString', coordinates}})
      this.props.saveActiveEntity('trippattern')
      return true
    } else {
      this.props.setErrorMessage('Error drawing pattern from stops! Some stops may be unreachable by streets.')
      return false
    }
  }

  cancel = () => {
    const {activePattern, editSettings, resetActiveEntity, updateEditSetting} = this.props
    resetActiveEntity(activePattern, 'trippattern')
    updateEditSetting('editGeometry', !editSettings.editGeometry, activePattern)
  }

  createFromStops = () => {
    const {activePattern, editSettings, showConfirmModal, stops} = this.props
    showConfirmModal({
      title: `Create pattern shape from stops?`,
      body: `Are you sure you want to overwrite this trip pattern?`,
      onConfirm: () => {
        const stopLocations = stops && activePattern.patternStops && activePattern.patternStops.length
          ? activePattern.patternStops.map((s, index) => {
            const stop = stops.find(st => st.id === s.stopId)
            return {lng: stop.stop_lon, lat: stop.stop_lat}
          })
          : []
        return this.drawPatternFromStops(activePattern, stopLocations, editSettings.followStreets)
      }
    })
  }

  delete = () => {
    const {activePattern, saveActiveEntity, showConfirmModal, updateActiveEntity} = this.props
    showConfirmModal({
      title: `Delete shape for trip pattern?`,
      body: `Are you sure you want to delete this trip pattern shape?`,
      onConfirm: () => {
        updateActiveEntity(activePattern, 'trippattern', {shape: null})
        saveActiveEntity('trippattern')
      }
    })
  }

  edit = () => {
    const {activePattern, editSettings, updateEditSetting} = this.props
    updateEditSetting('editGeometry', !editSettings.editGeometry, activePattern)
  }

  save = () => {
    const {activePattern, editSettings, saveActiveEntity, updateEditSetting} = this.props
    saveActiveEntity('trippattern')
    .then(() => updateEditSetting('editGeometry', !editSettings.editGeometry, activePattern))
  }

  render () {
    const {activePattern, editSettings, updateEditSetting, undoActiveTripPatternEdits} = this.props
    let buttons
    if (editSettings.editGeometry) {
      buttons = [{
        key: 'save',
        disabled: editSettings.coordinatesHistory.length === 0,
        onClick: this.save,
        children: <span><Icon type='check' /> Save</span>
      }, {
        key: 'undo',
        disabled: editSettings.actions.length === 0,
        onClick: undoActiveTripPatternEdits,
        children: <span><Icon type='undo' /> Undo</span>
      }, {
        key: 'delete',
        onClick: this.delete,
        children: <span><Icon type='trash' /> Wipe</span>
      }, {
        key: 'create',
        onClick: this.createFromStops,
        children: <span><Icon type='map-marker' /> Stops</span>
      }]
    }
    return (
      <div>
        <h4 className='line'>
          Pattern shape
          {' '}
          ({activePattern.shape ? numeral(lineDistance(activePattern.shape, 'miles')).format('0,0.00') : 0} miles)
        </h4>
        {editSettings.editGeometry
          ? <div>
            <Button
              block
              style={{marginTop: '5px', marginBottom: '5px'}}
              onClick={this.cancel}
              bsSize='small'>
              <span><Icon type='times' /> Cancel geometry edits</span>
            </Button>
            <ButtonGroup justified>
              {buttons.map(b => (
                <Button href='#' bsSize='small' {...b} />
              ))}
            </ButtonGroup>
            <EditSettings
              editSettings={editSettings}
              updateEditSetting={updateEditSetting} />
          </div>
          : <Button
            block
            onClick={this.edit}
            bsSize='small'
            bsStyle='warning'>
            <span><Icon type='pencil' /> Edit pattern geometry</span>
          </Button>
        }
      </div>
    )
  }
}
