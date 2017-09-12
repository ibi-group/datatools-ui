import React, {Component} from 'react'
import {Map, ZoomControl, FeatureGroup} from 'react-leaflet'
import {shallowEqual} from 'react-pure-render'

import AddableStopsLayer from './AddableStopsLayer'
import EditorMapLayersControl from './EditorMapLayersControl'
import ControlPointsLayer from './ControlPointsLayer'
import DirectionIconsLayer from './DirectionIconsLayer'
import EditorMapProps from '../../props'
import PatternsLayer from './PatternsLayer'
import PatternStopsLayer from './PatternStopsLayer'
import StopsLayer from './StopsLayer'
import {MAP_LAYERS, constructStop, clickToLatLng, getFeedBounds} from '../../util/map'

export default class EditorMap extends Component {
  static propTypes = EditorMapProps

  state = {}

  _onResize = () => {
    this.setState({width: window.innerWidth, height: window.innerHeight})
    this.refs.map && setTimeout(this._invalidateSize, 500)
  }

  _invalidateSize = () => this.refs.map.leafletElement.invalidateSize()

  componentWillMount () {
    this._onResize()
    this.setState({willMount: true})
  }

  componentDidMount () {
    window.addEventListener('resize', this._onResize)
    this.setState({willMount: false})
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._onResize)
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.offset !== this.props.offset || nextProps.hidden !== this.props.hidden) {
      this._onResize()
    }
    if (nextProps.zoomToTarget && !shallowEqual(nextProps.zoomToTarget, this.props.zoomToTarget)) {
      this.setState({zoomToTarget: true})
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    const {props} = this
    const {activeEntity, mapState} = props
    // don't update if component continues to be hidden
    if (nextProps.hidden && props.hidden) {
      return false
    }

    const shouldUpdate =
      !shallowEqual(nextState, this.state) ||
      !shallowEqual(nextProps, props) ||
      ((nextProps.activeComponent === 'stop' || nextProps.activeComponent === 'route') && nextProps.activeEntityId !== props.activeEntityId) ||
      (nextProps.activeEntity && activeEntity && nextProps.activeEntity.tripPatterns && !activeEntity.tripPatterns) ||
      !shallowEqual(nextProps.feedSource, props.feedSource) ||
      // TODO: add bounds to shouldComponentUpdate and move mapZoom/bounds to mapState reducer
      (nextProps.drawStops && !shallowEqual(nextProps.mapState.bounds, mapState.bounds)) ||
      (nextProps.activeComponent === 'stop' && activeEntity && nextProps.activeEntity &&
        (activeEntity.stop_lon !== nextProps.activeEntity.stop_lon || activeEntity.stop_lat !== nextProps.activeEntity.stop_lat))

    return shouldUpdate
  }

  _mapRightClicked = async (e) => {
    const {activeEntity, updateActiveEntity, activeComponent, entities, feedSource, newGtfsEntity} = this.props
    switch (activeComponent) {
      case 'stop':
        // if newly created stop is already selected
        const stopLatLng = clickToLatLng(e.latlng)
        if (activeEntity && activeEntity.id === 'new') {
          updateActiveEntity(activeEntity, activeComponent, stopLatLng)
          this.refs[activeEntity.id].leafletElement.setLatLng(e.latlng)
        } else if (entities && entities.findIndex(e => e.id === 'new') === -1) {
          // if a new stop should be constructed
          const stop = await constructStop(e.latlng, feedSource.id)
          newGtfsEntity(feedSource.id, activeComponent, stop)
        }
        break
      default:
        break
    }
  }

  _mapBaseLayerChanged = (e) => {
    const layer = MAP_LAYERS.find(l => l.name === e.name)
    this.props.updateUserMetadata(this.props.user.profile, {editor: {map_id: layer.id}})
  }

  _mapClicked = async (e) => {
    const {activeComponent, activeEntity, entities, feedSource, setActiveEntity} = this.props
    if (activeComponent === 'stop') {
      // locate stop based on latlng
      const selectedStop = entities.find(stop => Math.round(stop.stop_lat * 1000) / 1000 === Math.round(e.latlng.lat * 1000) / 1000 && Math.round(stop.stop_lon * 1000) / 1000 === Math.round(e.latlng.lng * 1000) / 1000)
      if (selectedStop) {
        if (activeEntity && activeEntity.id === selectedStop.id) {
          // do nothing, the user just clicked the current stop
        } else {
          setActiveEntity(feedSource.id, activeComponent, selectedStop)
        }
      }
    }
    if (this.props.subComponent === 'trippattern' && this.props.editSettings.editGeometry) {
      switch (this.props.editSettings.onMapClick) {
        case 'NO_ACTION':
          break
        case 'ADD_STOP_AT_CLICK':
          return this.props.addStopAtPoint(e.latlng, true, null, this.props.activePattern)
        case 'ADD_STOPS_AT_INTERSECTIONS':
          return this.props.addStopAtIntersection(e.latlng, this.props.activePattern)
        case 'ADD_STOPS_AT_INTERVAL':
          return this.props.addStopAtInterval(e.latlng, this.props.activePattern)
        default:
          break
      }
    }
  }

  _cancelZoomToTarget = () => this.setState({zoomToTarget: false})

  _mapBoundsChanged = (e) => {
    if (this.state.zoomToTarget) {
      setTimeout(this._cancelZoomToTarget, 200)
      return false
    } else {
      const zoom = e.target.getZoom()
      const bounds = e.target.getBounds()
      if (this.props.mapState.zoom !== zoom) {
        this.props.updateMapSetting({zoom})
      }
      if (!bounds.equals(this.props.mapState.bounds)) {
        this.props.updateMapSetting({bounds: e.target.getBounds()})
      }
    }
  }

  _getMapComponents (component, entity, subEntityId, activePattern, stops, editSettings, mapState) {
    switch (component) {
      case 'route':
        if (!entity) return null
        return (
          <FeatureGroup>
            <PatternsLayer
              activeEntity={entity}
              activePattern={activePattern}
              constructControlPoint={this.props.constructControlPoint}
              controlPoints={this.props.controlPoints}
              editSettings={editSettings}
              feedSource={this.props.feedSource}
              patternCoordinates={this.props.editSettings.patternCoordinates}
              route={entity}
              setActiveEntity={this.props.setActiveEntity}
              subEntityId={subEntityId}
              updateEditSetting={this.props.updateEditSetting} />
            <DirectionIconsLayer
              mapState={mapState}
              patternCoordinates={this.props.editSettings.patternCoordinates} />
            {editSettings.editGeometry &&
              <ControlPointsLayer
                activePattern={activePattern}
                controlPoints={this.props.controlPoints}
                editSettings={editSettings}
                handleControlPointDrag={this.props.handleControlPointDrag}
                handleControlPointDragEnd={this.props.handleControlPointDragEnd}
                removeControlPoint={this.props.removeControlPoint}
                stops={stops}
                updateActiveEntity={this.props.updateActiveEntity}
                updateControlPoint={this.props.updateControlPoint}
                updatePatternCoordinates={this.props.updatePatternCoordinates} />
            }
            <PatternStopsLayer
              activePattern={activePattern}
              addStopToPattern={this.props.addStopToPattern}
              controlPoints={this.props.controlPoints}
              editSettings={editSettings}
              patternEdited={this.props.patternEdited}
              feedSource={this.props.feedSource}
              removeStopFromPattern={this.props.removeStopFromPattern}
              saveActiveEntity={this.props.saveActiveEntity}
              setActiveStop={this.props.setActiveStop}
              patternStop={this.props.patternStop}
              setActiveEntity={this.props.setActiveEntity}
              stops={stops}
              updateActiveEntity={this.props.updateActiveEntity} />
            <AddableStopsLayer
              activePattern={activePattern}
              addStopToPattern={this.props.addStopToPattern}
              editSettings={editSettings}
              mapState={mapState}
              stops={stops} />
          </FeatureGroup>
        )
      case 'stop':
        return (
          <StopsLayer
            activeEntity={entity}
            drawStops={this.props.drawStops}
            feedSource={this.props.feedSource}
            mapState={mapState}
            setActiveEntity={this.props.setActiveEntity}
            stops={stops}
            updateActiveEntity={this.props.updateActiveEntity} />
        )
      default:
        return null
    }
  }

  _overlayAdded = (e) => {
    if (e.name === 'Route alignments' && !this.props.tripPatterns) {
      this.props.fetchTripPatterns(this.props.feedSource.id)
    }
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      activePattern,
      editSettings,
      feedSource,
      hidden,
      mapState,
      offset,
      sidebarExpanded,
      subEntityId,
      tableData,
      tripPatterns,
      user
    } = this.props
    const { zoomToTarget, width, willMount } = this.state
    const fsBounds = getFeedBounds(feedSource, 0.005)

    // if zoomToTarget is not false (i.e., some entity ID), set the bounds to the mapState bounds
    // else, default to current map bounds
    // else, go to feed source bounds
    const bounds = zoomToTarget
      ? mapState.bounds
      : this.refs.map
      ? this.refs.map.leafletElement.getBounds()
      : fsBounds
    const mapStyle = {
      height: '100%',
      width: `${width - offset - (sidebarExpanded ? 130 : 50)}px`,
      position: 'absolute',
      left: `${offset}px`,
      display: hidden ? 'none' : 'initial'
    }
    const mapProps = {
      ref: 'map',
      zoomControl: false,
      style: mapStyle,
      maxBounds: [[200, 180], [-200, -180]],
      onContextMenu: this._mapRightClicked,
      onClick: this._mapClicked,
      onZoomEnd: this._mapBoundsChanged,
      onMoveEnd: this._mapBoundsChanged,
      onBaseLayerChange: this._mapBaseLayerChanged,
      scrollWheelZoom: true,
      onOverlayAdd: this._overlayAdded
    }
    if (willMount || zoomToTarget) {
      mapProps.bounds = bounds
    }
    return (
      <Map {...mapProps}>
        <ZoomControl position='topright' />
        <EditorMapLayersControl
          tripPatterns={tripPatterns}
          user={user}
          stops={tableData.stop} />
        {!hidden &&
          this._getMapComponents(activeComponent, activeEntity, subEntityId, activePattern, tableData.stop, editSettings, mapState)
        }
      </Map>
    )
  }
}
