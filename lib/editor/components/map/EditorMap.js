// @flow

import React, {Component} from 'react'
import {Map, ZoomControl, FeatureGroup, GeoJSON} from 'react-leaflet'
import {shallowEqual} from 'react-pure-render'

import * as activeActions from '../../actions/active'
import * as editorActions from '../../actions/editor'
import * as mapActions from '../../actions/map'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import {EDITOR_MAP_LAYERS} from '../../../common/util/maps'
import AddableStopsLayer from './AddableStopsLayer'
import EditorMapLayersControl from './EditorMapLayersControl'
import ControlPointsLayer from './ControlPointsLayer'
import DirectionIconsLayer from './DirectionIconsLayer'
import PatternDebugLines from './pattern-debug-lines'
import PatternsLayer from './PatternsLayer'
import PatternStopsLayer from './PatternStopsLayer'
import StopsLayer from './StopsLayer'
import {constructStop, clickToLatLng, getFeedBounds} from '../../util/map'
import {entityIsNew} from '../../util/objects'

import type {
  ControlPoint,
  Coordinates,
  Entity,
  Feed,
  FeedInfo,
  GtfsRoute,
  GtfsStop,
  Pattern
} from '../../../types'
import type {EditSettingsState, ManagerUserState, MapState} from '../../../types/reducers'

type Props = {
  activeComponent: string,
  activeEntity: Entity,
  activeEntityId: number,
  activePattern: Pattern,
  activePatternStops: Array<GtfsStop>,
  addStopAtIntersection: typeof stopStrategiesActions.addStopAtIntersection,
  addStopAtInterval: typeof stopStrategiesActions.addStopAtInterval,
  addStopAtPoint: typeof stopStrategiesActions.addStopAtPoint,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  constructControlPoint: typeof mapActions.constructControlPoint,
  controlPoints: Array<ControlPoint>,
  currentPattern: Pattern,
  drawStops: boolean,
  editSettings: EditSettingsState,
  entities: Array<Entity>,
  entityEdited: boolean,
  feedInfo: FeedInfo,
  feedSource: Feed,
  fetchTripPatterns: typeof tripPatternActions.fetchTripPatterns,
  handleControlPointDrag: typeof mapActions.handleControlPointDrag,
  handleControlPointDragEnd: typeof mapActions.handleControlPointDragEnd,
  handleControlPointDragStart: typeof mapActions.handleControlPointDragStart,
  hidden: boolean,
  mapState: MapState,
  newGtfsEntity: typeof editorActions.newGtfsEntity,
  offset: number,
  patternCoordinates: Array<Coordinates>,
  patternEdited: boolean,
  patternSegment: number,
  patternStop: {id: string, index: number},
  removeControlPoint: typeof mapActions.removeControlPoint,
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActivePatternSegment: typeof tripPatternActions.setActivePatternSegment,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  sidebarExpanded: boolean,
  stops: Array<GtfsStop>,
  subComponent: string,
  subEntity: number,
  subEntityId: number,
  tripPatterns: Array<Pattern>,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity,
  updateEditSetting: typeof activeActions.updateEditSetting,
  updateMapSetting: typeof mapActions.updateMapSetting,
  updatePatternStops: typeof tripPatternActions.updatePatternStops,
  user: ManagerUserState,
  zoomToTarget: ?number
}

type State = {
  height: number,
  width: number,
  willMount: boolean,
  zoomToTarget: boolean
}

export default class EditorMap extends Component<Props, State> {
  state = {
    width: 200,
    willMount: false,
    height: 200,
    zoomToTarget: false
  }

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

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.offset !== this.props.offset || nextProps.hidden !== this.props.hidden) {
      this._onResize()
    }
    if (nextProps.zoomToTarget && !shallowEqual(nextProps.zoomToTarget, this.props.zoomToTarget)) {
      this.setState({zoomToTarget: true})
    }
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
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
        // $FlowFixMe
        (activeEntity.stop_lon !== nextProps.activeEntity.stop_lon || activeEntity.stop_lat !== nextProps.activeEntity.stop_lat))

    return shouldUpdate
  }

  /**
   * Create new stop on map right click if the stops table/component is active.
   */
  _mapRightClicked = async (e: any) => {
    const {activeEntity, updateActiveGtfsEntity, activeComponent, entities, feedSource, newGtfsEntity} = this.props
    switch (activeComponent) {
      case 'stop':
        // if newly created stop is already selected
        const stopLatLng = clickToLatLng(e.latlng)
        if (activeEntity && entityIsNew(activeEntity)) {
          updateActiveGtfsEntity({
            component: activeComponent,
            entity: activeEntity,
            props: stopLatLng
          })
          this.refs[activeEntity.id] && this.refs[activeEntity.id].leafletElement.setLatLng(e.latlng)
        } else if (entities && entities.findIndex(entityIsNew) === -1) {
          // if a new stop should be constructed
          const stop = await constructStop(e.latlng)
          newGtfsEntity(feedSource.id, activeComponent, stop)
        }
        break
      default:
        break
    }
  }

  _mapBaseLayerChanged = (e: any) => {
    const layer = EDITOR_MAP_LAYERS.find(l => l.name === e.name)
    if (!layer) return console.warn(`Could not locate map layer with name=${e.name}`, EDITOR_MAP_LAYERS)
    // FIXME: Once we refactor users to be stored in MongoDB we may want to add
    // back a way to store the preferred map layer.
    // this.props.updateUserMetadata(this.props.user.profile, {editor: {map_id: layer.id}})
  }

  /**
   * Handle map click event.
   */
  _mapClicked = async (e: any) => {
    const {
      subComponent,
      editSettings,
      addStopAtPoint,
      activePattern,
      addStopAtIntersection,
      addStopAtInterval,
      controlPoints
    } = this.props
    if (subComponent === 'trippattern' && editSettings.editGeometry) {
      // TODO: Prevent adding stops (at click, at interval, etc.) if the user
      // clicks the pattern line because they probably intended to add a control
      // point. See https://github.com/catalogueglobal/datatools-ui/issues/140
      // console.log(e)
      switch (editSettings.onMapClick) {
        case 'NO_ACTION':
          break
        case 'ADD_STOP_AT_CLICK':
          return addStopAtPoint(e.latlng, true, null, activePattern)
        case 'ADD_STOPS_AT_INTERSECTIONS':
          return addStopAtIntersection(e.latlng, activePattern)
        case 'ADD_STOPS_AT_INTERVAL':
          return addStopAtInterval(e.latlng, activePattern, controlPoints)
        default:
          break
      }
    }
  }

  _cancelZoomToTarget = () => this.setState({zoomToTarget: false})

  _mapBoundsChanged = (e: any) => {
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

  _getMapComponents () {
    const {
      activeComponent,
      activeEntity,
      activePattern,
      addStopToPattern,
      constructControlPoint,
      controlPoints,
      drawStops,
      editSettings,
      feedSource,
      handleControlPointDrag,
      handleControlPointDragEnd,
      handleControlPointDragStart,
      mapState,
      patternCoordinates,
      patternEdited,
      patternSegment,
      patternStop,
      removeControlPoint,
      removeStopFromPattern,
      saveActiveGtfsEntity,
      setActiveEntity,
      setActivePatternSegment,
      setActiveStop,
      stops,
      subEntityId,
      updateActiveGtfsEntity,
      updateEditSetting,
      updatePatternStops
    } = this.props
    switch (activeComponent) {
      case 'route':
        if (!activeEntity) return null
        const castedRoute = ((activeEntity: any): GtfsRoute)
        // FIXME: this does not copy pattern coordinates like the below comment says. Does it need to?
        // Copy pattern coordinates
        return (
          <FeatureGroup>
            <PatternDebugLines
              activePattern={activePattern}
              controlPoints={controlPoints}
              editSettings={editSettings}
              patternSegment={patternSegment}
              patternStop={patternStop}
              stops={stops} />
            <PatternsLayer
              activeEntity={activeEntity}
              activePattern={activePattern}
              constructControlPoint={constructControlPoint}
              controlPoints={controlPoints}
              editSettings={editSettings}
              feedSource={feedSource}
              patternCoordinates={patternCoordinates}
              route={castedRoute}
              setActiveEntity={setActiveEntity}
              setActivePatternSegment={setActivePatternSegment}
              patternSegment={patternSegment}
              subEntityId={subEntityId}
              updateEditSetting={updateEditSetting} />
            <DirectionIconsLayer
              patternSegment={this.props.patternSegment}
              editSettings={this.props.editSettings}
              patternCoordinates={this.props.patternCoordinates} />
            <ControlPointsLayer
              activePattern={activePattern}
              controlPoints={controlPoints}
              patternCoordinates={patternCoordinates}
              editSettings={editSettings}
              patternSegment={patternSegment}
              handleControlPointDrag={handleControlPointDrag}
              handleControlPointDragEnd={handleControlPointDragEnd}
              handleControlPointDragStart={handleControlPointDragStart}
              removeControlPoint={removeControlPoint}
              setActivePatternSegment={setActivePatternSegment}
              stops={stops}
              updateActiveGtfsEntity={updateActiveGtfsEntity} />
            <PatternStopsLayer
              activePattern={activePattern}
              activePatternStops={this.props.activePatternStops}
              addStopToPattern={addStopToPattern}
              controlPoints={controlPoints}
              editSettings={editSettings}
              feedSource={feedSource}
              patternEdited={patternEdited}
              patternSegment={patternSegment}
              patternStop={patternStop}
              removeStopFromPattern={removeStopFromPattern}
              setActiveStop={setActiveStop}
              saveActiveGtfsEntity={saveActiveGtfsEntity}
              setActiveEntity={setActiveEntity}
              updateActiveGtfsEntity={updateActiveGtfsEntity}
              updatePatternStops={updatePatternStops} />
            <AddableStopsLayer
              activePattern={activePattern}
              addStopToPattern={addStopToPattern}
              editSettings={editSettings}
              mapState={mapState}
              stops={stops} />
          </FeatureGroup>
        )
      case 'stop':
        const castedStop = ((activeEntity: any): GtfsStop)
        return (
          <StopsLayer
            activeEntity={castedStop}
            drawStops={drawStops}
            feedSource={feedSource}
            mapState={mapState}
            setActiveEntity={setActiveEntity}
            stops={stops}
            updateActiveGtfsEntity={updateActiveGtfsEntity} />
        )
      default:
        return null
    }
  }

  _overlayAdded = (e: any) => {
    if (e.name === 'Tracés des itinéraires' && !this.props.tripPatterns) {
      this.props.fetchTripPatterns(this.props.feedSource.id)
    }
  }

  render () {
    const {
      feedSource,
      hidden,
      mapState,
      offset,
      sidebarExpanded,
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
      bounds: undefined,
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
          stops={this.props.stops} />
        {/* Primary editor map components (routes, stops, etc.) to be rendered based on active components */}
        {!hidden &&
          this._getMapComponents()
        }
        {/* Routes GeoJSON to display as a visual aid in constructing trip patterns */}
        {mapState.routesGeojson &&
          <GeoJSON
            key={mapState.routesGeojson.key}
            data={mapState.routesGeojson} />
        }
      </Map>
    )
  }
}
