// @flow

import throttle from 'lodash/throttle'
import React, {Component} from 'react'
import {Marker, Tooltip} from 'react-leaflet'

import * as activeActions from '../../actions/active'
import * as mapActions from '../../actions/map'
import * as tripPatternActions from '../../actions/tripPattern'

import type {ControlPoint, Coordinate, Coordinates, LatLng, Pattern} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

type Props = {
  activePattern: Pattern,
  controlPoint: ControlPoint,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsState,
  handleControlPointDrag: typeof mapActions.handleControlPointDrag,
  handleControlPointDragEnd: typeof mapActions.handleControlPointDragEnd,
  handleControlPointDragStart: typeof mapActions.handleControlPointDragStart,
  icon: HTMLElement,
  index: number,
  isActive: boolean,
  patternCoordinates: Array<Coordinates>,
  patternSegment: number,
  position: Coordinate,
  removeControlPoint: typeof mapActions.removeControlPoint,
  setActivePatternSegment: typeof tripPatternActions.setActivePatternSegment,
  stopId?: string,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity
}

type State = {
  latlng: ?LatLng
}

export default class ControlPointMarker extends Component<Props, State> {
  state = {
    latlng: null
  }

  shouldComponentUpdate (nextProps: Props) {
    const {controlPoint, editSettings, isActive, patternSegment} = this.props
    // FIXME: fix this hack that keeps unknown position change (perhaps
    // react-leaflet is updating it) from triggering a component update, which
    // funks with the position of the marker.
    return nextProps.controlPoint.snap !== controlPoint.snap ||
      nextProps.editSettings.showTooltips !== editSettings.showTooltips ||
      nextProps.patternSegment !== patternSegment ||
      nextProps.isActive !== isActive
  }

  _onClick = () => {
    const {
      controlPoints,
      removeControlPoint,
      setActivePatternSegment,
      activePattern,
      patternCoordinates,
      stopId,
      index,
      isActive
    } = this.props
    // only remove controlPoint if it's not based on pattern stop
    if (isActive && !stopId) {
      removeControlPoint(controlPoints, index, activePattern, patternCoordinates)
    } else {
      setActivePatternSegment(index)
    }
  }

  /**
   * Handle dragging via a throttled function
   *
   * FIXME: Make distinction between dragging a stop (always snap to line?) and
   * dragging a standard control point.
   * @param  {Event} e http://leafletjs.com/reference-1.1.0.html#event
   */
  _onDrag = throttle((e: any) => {
    const {
      activePattern,
      controlPoints,
      handleControlPointDrag,
      index,
      patternCoordinates
    } = this.props
    const latlng = e.latlng
    this.setState({latlng})
    // console.log(`drag to`, `http://geojson.io/#data=data:application/json,${encodeURIComponent(JSON.stringify(point([latlng.lng, latlng.lat])))}`)
    handleControlPointDrag(controlPoints, index, latlng, activePattern, patternCoordinates)
  }, 500, {leading: false})

  /**
   * Handle a drag end event
   *
   * @param  {DragEndEvent} e http://leafletjs.com/reference-1.1.0.html#dragendevent
   */
  _onDragEnd = (e: any) => {
    const {activePattern, controlPoints, handleControlPointDragEnd, index, patternCoordinates} = this.props
    this.setState({latlng: null})
    handleControlPointDragEnd(controlPoints, index, e.target.getLatLng(), activePattern, patternCoordinates)
  }

  /**
   * Register the initiation of the drag event for this control point.
   */
  _onDragStart = () => {
    const {controlPoint, handleControlPointDragStart} = this.props
    handleControlPointDragStart(controlPoint)
  }

  render () {
    const {controlPoint, editSettings, icon, position, isActive} = this.props
    // keep track of position in state because we need this to be cleared once
    // the user has stopped dragging the marker, at which point
    // this.state.latlng will be null and the marker will "snap" back to the
    // polyline
    const {latlng} = this.state
    const tooltipMessage = isActive && controlPoint.stopId
      ? 'Glisser pour déplacer le point d\'arrêt'
      : isActive
        ? 'Glisser pour changer le tracé (cliquer pour supprimer)'
        : 'Cliquer pour commencer l\'édition du segment'
    const markerPosition = latlng
      ? [latlng.lat, latlng.lng]
      : position
    const dragProps = isActive
      ? {
        draggable: true,
        onDrag: this._onDrag,
        onDragStart: this._onDragStart,
        onDragEnd: this._onDragEnd
      }
      : {}
    return (
      <Marker
        position={markerPosition}
        icon={icon}
        ref='marker'
        zIndexOffset={1000}
        {...dragProps}
        onClick={this._onClick} >
        {/* TODO: need to fix onDrag so that components updates and hides tooltip while dragging */}
        {!latlng && tooltipMessage &&
          <Tooltip
            key={Math.random()}
            opacity={editSettings.showTooltips ? 0.9 : 0}>
            <span>{tooltipMessage}</span>
          </Tooltip>
        }
      </Marker>
    )
  }
}
