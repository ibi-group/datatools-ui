import React, { Component, PropTypes } from 'react'
import { divIcon } from 'leaflet'
import { Marker, FeatureGroup } from 'react-leaflet'

import {clickToLatLng} from '../../util/map'

export default class StopsLayer extends Component {
  static propTypes = {
    mapState: PropTypes.object
  }

  render () {
    const {
      mapState,
      stops
    } = this.props
    const paddedBounds = mapState.bounds.pad(0.05)
    return (
      <FeatureGroup>
        {stops
          ? stops
            .filter(stop => {
              if (!paddedBounds) return false
              if (stop.stop_lat > paddedBounds.getNorth() || stop.stop_lat < paddedBounds.getSouth() || stop.stop_lon > paddedBounds.getEast() || stop.stop_lon < paddedBounds.getWest()) {
                return false
              } else {
                return true
              }
            })
            .map(stop => (
              <StopMarker
                key={stop.id}
                stop={stop}
                {...this.props} />
            ))
          : null
        }
      </FeatureGroup>
    )
  }
}

class StopMarker extends Component {
  _onClick = (e) => {
    const {activeEntity, feedSource, setActiveEntity, stop} = this.props
    const isActive = activeEntity && activeEntity.id === stop.id
    // set active entity
    if (!isActive) {
      setActiveEntity(feedSource.id, 'stop', stop)
    }
  }

  _onDragEnd = (e) => {
    const latlng = e.target.getLatLng()
    const stopLatLng = clickToLatLng(latlng)
    this.props.updateActiveEntity(this.props.activeEntity, 'stop', stopLatLng)
  }

  render () {
    const {activeEntity, drawStops, stop} = this.props
    const isActive = activeEntity && activeEntity.id === stop.id
    const outOfZoom = !drawStops
    const position = isActive ? [activeEntity.stop_lat, activeEntity.stop_lon] : [stop.stop_lat, stop.stop_lon]
    const busIcon = divIcon({
      html: `<span title="${stop.stop_name}" class="fa-stack bus-stop-icon" style="opacity: 0.6">
              <i class="fa fa-circle fa-stack-2x" style="color: #ffffff"></i>
              <i class="fa fa-bus fa-stack-1x" style="color: #000000"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    const activeBusIcon = divIcon({
      html: `<span title="${stop.stop_name}" class="fa-stack bus-stop-icon" style="cursor: move">
              <i class="fa fa-circle fa-stack-2x bus-stop-icon-bg" style="color: #000"></i>
              <i class="fa fa-stack-1x fa-bus fa-inverse bus-stop-icon-fg"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    const hidden = !isActive && outOfZoom
    if (hidden) {
      return null
    }
    if (isNaN(stop.stop_lat) || isNaN(stop.stop_lon)) {
      return null
    }
    const marker = (
      <Marker
        position={position}
        icon={isActive ? activeBusIcon : busIcon}
        zIndexOffset={isActive ? 1000 : 0}
        draggable={isActive}
        onDragEnd={this._onDragEnd}
        onClick={this._onClick} />
    )
    return marker
  }
}
