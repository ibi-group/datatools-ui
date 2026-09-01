// @flow

import React, {Component} from 'react'
import {Marker} from 'react-leaflet'

import * as activeActions from '../../actions/active'
import {clickToLatLng, getStopIcon, stopIsOutOfBounds} from '../../util/map'
import type {Coordinate, Feed, GtfsStop} from '../../../types'
import type {MapState} from '../../../types/reducers'

type Props = {
  activeEntity?: GtfsStop,
  drawStops?: boolean,
  feedSource?: Feed,
  mapState: MapState,
  setActiveEntity?: typeof activeActions.setActiveEntity,
  stops: Array<GtfsStop>,
  updateActiveGtfsEntity?: typeof activeActions.updateActiveGtfsEntity
}

export default class StopsLayer extends Component<Props> {
  _updateStopPosition = (latlng: {stop_lat: number, stop_lon: number}) => {
    const {activeEntity, updateActiveGtfsEntity} = this.props
    if (!updateActiveGtfsEntity || !activeEntity) return

    updateActiveGtfsEntity({
      component: 'stop',
      entity: activeEntity,
      props: latlng
    })
  }

  render () {
    const {
      activeEntity,
      drawStops,
      feedSource,
      mapState,
      setActiveEntity,
      stops
    } = this.props
    const paddedBounds = mapState.bounds.pad(0.05)
    return (
      <div>
        {stops
          ? stops
            .filter(stop => {
              // Do not render stops if the bounds are invalid
              if (!paddedBounds) return false
              const stopIsActive = activeEntity && activeEntity.id === stop.id
              // Always render active stop.
              if (stopIsActive) return true
              // If zoomed out too much, do not render any other stops.
              if (!drawStops) return false
              // Always render if no activeEntity is present (we are in location group viewer (basic ✨) mode)
              if (!activeEntity) return true
              // Filter out stops that do not fall within bounds.
              if (stopIsOutOfBounds(stop, paddedBounds)) return false
              else return true
            })
            .map(stop => {
              const isActive = !!activeEntity && activeEntity.id === stop.id
              const position = isActive
              // $FlowFixMe activeEntity will only be read if it exists (see previous line)
                ? [activeEntity.stop_lat, activeEntity.stop_lon]
                : [stop.stop_lat, stop.stop_lon]
              return (
                <EditorStopMarker
                  feedSource={feedSource}
                  key={stop.id}
                  isActive={isActive}
                  position={position}
                  setActiveEntity={setActiveEntity}
                  stop={stop}
                  updateStopPosition={this._updateStopPosition} />
              )
            })
          : null
        }
      </div>
    )
  }
}

type MarkerProps = {
  feedSource?: Feed,
  isActive: boolean,
  position: Coordinate,
  setActiveEntity?: typeof activeActions.setActiveEntity,
  stop: GtfsStop,
  updateStopPosition?: ({stop_lat: number, stop_lon: number}) => void
}

class EditorStopMarker extends Component<MarkerProps> {
  _onClick = () => {
    const {feedSource, isActive, setActiveEntity, stop} = this.props
    if (!isActive && setActiveEntity && feedSource) {
      setActiveEntity(feedSource.id, 'stop', stop)
    }
  }

  _onDragEnd = (e: any) => {
    const {updateStopPosition} = this.props
    if (!updateStopPosition) return

    const stopLatLng = clickToLatLng(e.target.getLatLng())
    updateStopPosition(stopLatLng)
  }

  render () {
    const {isActive, position, stop, updateStopPosition} = this.props
    const busIcon = isActive
      ? getStopIcon(stop.stop_name, 'cursor: move')
      : getStopIcon(stop.stop_name, 'opacity: 0.6', '#ffffff', '#000000')
    // Do not render stop marker if the lat/lon are invalid.
    if (isNaN(position[0]) || isNaN(position[1])) return null
    return (
      <Marker
        position={position}
        icon={busIcon}
        zIndexOffset={isActive ? 1000 : 0}
        draggable={isActive}
        onDragEnd={updateStopPosition && this._onDragEnd}
        onClick={this._onClick} />
    )
  }
}
