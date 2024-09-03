// @flow

import { divIcon } from 'leaflet'
import React, {Component} from 'react'
import {Marker, Popup} from 'react-leaflet'

import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import AddPatternStopDropdown from '../pattern/AddPatternStopDropdown'

import type {GtfsStop, Pattern} from '../../../types'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  stop: GtfsStop
}

export default class AddableStop extends Component<Props> {
  _onClickAddStopToEnd = () => {
    const {activePattern, addStopToPattern, stop} = this.props
    addStopToPattern(activePattern, stop)
  }

  _onSelectStop = (key: number) =>
    this.props.addStopToPattern(this.props.activePattern, this.props.stop, key)

  render () {
    const {
      activePattern,
      addStopToPattern,
      stop
    } = this.props
    const color = 'blue'
    const stopName = `${stop.stop_name} (${stop.stop_code ? stop.stop_code : stop.stop_id})`
    const transparentBusIcon = divIcon({
      html: `<span title="${stopName}" class="fa-stack" style="opacity: 0.3">
              <i class="fa fa-circle fa-stack-2x" style="color: #ffffff"></i>
              <i class="fa fa-bus fa-stack-1x" style="color: ${color}"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    return (
      <Marker
        position={[stop.stop_lat, stop.stop_lon]}
        icon={transparentBusIcon}>
        <Popup>
          <div style={{minWidth: '180px'}}>
            <h5>{stopName}</h5>
            <AddPatternStopDropdown
              activePattern={activePattern}
              addStopToPattern={addStopToPattern}
              label='Ajouter un arrêt'
              stop={stop}
            />
          </div>
        </Popup>
      </Marker>
    )
  }
}
