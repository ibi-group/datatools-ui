import React, { Component, PropTypes } from 'react'
import {FeatureGroup} from 'react-leaflet'

import AddableStop from './AddableStop'

export default class AddableStopsLayer extends Component {
  static propTypes = {
    activePattern: PropTypes.object,
    addStopToPattern: PropTypes.func,
    editSettings: PropTypes.object,
    mapState: PropTypes.object,
    stops: PropTypes.array
  }
  render () {
    const {
      activePattern,
      addStopToPattern,
      editSettings,
      mapState,
      stops
    } = this.props
    const { bounds, zoom } = mapState
    const patternStopIds = activePattern && activePattern.patternStops
      ? activePattern.patternStops.map(ps => ps.stopId)
      : []
    return (
      <FeatureGroup id='addable-stops-layer'>
        {stops && activePattern && editSettings.addStops && zoom > 14 && bounds
          ? stops
            .filter(stop => {
              // filter out stops by lat/lng
              if (stop.stop_lat > bounds.getNorth() || stop.stop_lat < bounds.getSouth() || stop.stop_lon > bounds.getEast() || stop.stop_lon < bounds.getWest()) {
                return false
              }
              // filter out stops that exist in activePattern
              if (patternStopIds.indexOf(stop.id) !== -1) {
                return false
              }
              return true
            })
            .map(stop => {
              if (!stop) return null
              return (
                <AddableStop
                  activePattern={activePattern}
                  addStopToPattern={addStopToPattern}
                  stop={stop}
                  key={stop.id} />
              )
            })
          : null
        }
      </FeatureGroup>
    )
  }
}
