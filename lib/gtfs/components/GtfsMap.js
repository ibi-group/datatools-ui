// @flow

import React, { PureComponent } from 'react'
import { shallowEqual } from 'react-pure-render'
import L, { latLngBounds } from 'leaflet'
import { FeatureGroup, Map, Polyline, Rectangle, TileLayer } from 'react-leaflet'

import * as filterActions from '../actions/filter'
import * as generalActions from '../actions/general'
import {getFeedsBounds, convertToArrayBounds} from '../../common/util/geo'
import {defaultTileLayerProps} from '../../common/util/maps'
import type {Props as ContainerProps} from '../containers/ActiveGtfsMap'
import type {Bounds, Feed, StopWithFeed} from '../../types'
import type {DateTimeFilter, MapFilter} from '../../types/reducers'

import StopMarker from './StopMarker'
import PatternGeoJson from './PatternGeoJson'

type Props = ContainerProps & {
  dateTime: DateTimeFilter,
  disableRefresh?: boolean,
  disableScroll?: boolean,
  entities: Array<string>,
  feeds?: Array<Feed>,
  height: number, // only px
  mapState: MapFilter,
  patternFilter: string,
  patterns: Array<any>,
  refreshGtfsElements: typeof generalActions.refreshGtfsElements,
  routes: Array<any>,
  shapes: {data: Array<any>},
  showAllRoutesOnMap: boolean,
  showBounds?: boolean,
  showPatterns?: boolean,
  showStops?: boolean,
  sidebarExpanded: any,
  stops: Array<StopWithFeed>,
  updateMapState: typeof filterActions.updateMapState,
}

const CANVAS = L.canvas()

export default class GtfsMap extends PureComponent<Props> {
  static defaultProps = {
    entities: []
  }

  componentDidMount () {
    this.resetMap(true)
  }

  resetMap (resetBounds: boolean = false) {
    setTimeout(() => {
      const {map} = this.refs
      if (map) {
        map.leafletElement.invalidateSize()
        const bounds = this._getVersionBounds()
        resetBounds && bounds && map.leafletElement.fitBounds(bounds)
      }
    }, 500)
  }

  mapMoved = (e: any) => {
    const {map} = this.refs
    const {disableRefresh, updateMapState} = this.props
    const bounds = map && map.leafletElement.getBounds()
    updateMapState && updateMapState({bounds})
    !disableRefresh && this._refreshGtfsElements()
  }

  componentWillReceiveProps (nextProps: Props) {
    const {
      disableRefresh,
      entities,
      feeds,
      height,
      stop,
      width
    } = this.props
    if (!disableRefresh) {
      if ((feeds && nextProps.feeds && nextProps.feeds.length !== feeds.length) || nextProps.entities !== entities) {
        // Refresh elements if feeds or entities to search change.
        this._refreshGtfsElements(nextProps.feeds)
      }
    }
    if (nextProps.stop && !shallowEqual(nextProps.stop, stop)) {
      // handle stop: panning on stop select
      // NOTE: pattern panTo is handled with layerAddHandler and searchFocus
      const coordinates = [nextProps.stop.stop_lat, nextProps.stop.stop_lon]
      this.refs.map && this.refs.map.leafletElement.panTo(coordinates)
    }
    if (nextProps.height !== height || nextProps.width !== width) {
      // If height or width changes, reset map
      this.resetMap()
    }
  }

  /**
   * Auto-zoom to newly-updated patterns or stops.
   */
  componentDidUpdate (prevProps: Props) {
    const { patterns, showPatterns, showStops, stops } = this.props
    if (showPatterns && prevProps.patterns !== patterns && patterns && patterns.length > 0) {
      // Set bounds to visible patterns.
      let bounds = []
      patterns.forEach(ptn => {
        if (ptn.geometry && ptn.geometry.coordinates && ptn.geometry.coordinates.length > 0) {
          bounds = bounds.concat(ptn.geometry.coordinates.map(c => [c[1], c[0]]))
        }
      })
      bounds = latLngBounds(bounds)
      if (bounds.isValid()) return this.props.updateMapState({ bounds })
      else console.warn(`Limites du motif invalides`, bounds)
    }
    if (showStops && prevProps.stops !== stops && stops && stops.length > 0) {
      // If not showing patterns (or bounds are invalid), try setting bounds to
      // visible stops.
      const bounds = latLngBounds(stops.map(stop => [stop.stop_lat, stop.stop_lon]))
      if (bounds.isValid()) return this.props.updateMapState({ bounds })
      else console.warn(`Limites de l'arrêt invalides`, bounds)
    }
  }

  _boundsAreValid = (bounds: Bounds): boolean => bounds && typeof bounds.north === 'number'

  _getVersionBounds () {
    const {version} = this.props
    if (version && version.validationSummary.bounds) {
      const bounds = version.validationSummary.bounds
      if (this._boundsAreValid(bounds)) {
        return convertToArrayBounds(bounds)
      }
    }
    return null
  }

  _refreshGtfsElements (feeds?: Array<Feed>, entities?: Array<string>) {
    const {refreshGtfsElements} = this.props
    if (!this.refs.map) {
      console.warn('Impossible de rafraîchir les entités GTFS. La carte de référence n’existe pas.')
      return
    }
    const zoomLevel: number = this.refs.map.leafletElement.getZoom()
    const feedsToSearch = feeds || this.props.feeds || []
    const ents = entities || this.props.entities || []
    if (feedsToSearch.length === 0 || zoomLevel > 13) {
      refreshGtfsElements(feedsToSearch, ents)
    }
  }

  layerAddHandler = (e: any) => {
    const {searchFocus, stop, pattern} = this.props
    // handle pattern panTo and popup open
    if (pattern && pattern.pattern_id === searchFocus) {
      // Wait to call open pop up to ensure that layer has fully materialized
      window.setTimeout(() => {
        if (e.layer.getBounds && this.refs.map) {
          // Fit bounds to polyline if function exists
          this.refs.map.leafletElement.fitBounds(e.layer.getBounds())
        }
        // Open popup for pattern if added via a selection from the search
        e.layer.openPopup && e.layer.openPopup()
      }, 100)
    }
    if (stop && searchFocus === stop.stop_id) {
      // Open popup for stop if added via a selection from the search
      e.layer.openPopup && e.layer.openPopup()
    }
  }

  render () {
    const {
      disableScroll,
      entities,
      feeds,
      height,
      mapState,
      newEntityId,
      onRouteClick,
      onStopClick,
      pattern,
      patternFilter,
      patterns,
      popupActionPrefix,
      renderTransferPerformance,
      routes,
      shapes,
      showAllRoutesOnMap,
      showBounds,
      showPatterns,
      showStops,
      sidebarExpanded,
      stop,
      stops,
      version,
      width
    } = this.props
    let mapWidth = width
    if (width.indexOf('px') !== -1) {
      const diff = sidebarExpanded ? 30 : 0
      mapWidth = `${parseInt(width.split('px')[0], 10) - diff}px`
    }
    const mapStyle = {
      width: mapWidth, // % or px
      height: `${height}px` // only px
    }

    // In view-stops mode, only show the current pattern
    const displayedPatterns = (patterns && showStops && patternFilter)
      ? patterns.filter(ptn => ptn.pattern_id === patternFilter)
      : patterns
    const versionBoundingBox = this._getVersionBounds()
    const feedsBounds = feeds && getFeedsBounds(feeds)
    const feedsArrayBounds = feedsBounds && convertToArrayBounds(feedsBounds)
    return (
      <Map
        ref='map'
        style={mapStyle}
        // Fit bounds to the viewed route/pattern,
        // or the entire feed bound box if on the Summary tab.
        // Note: When providing a bounds props, do not also use the zoom prop
        // to avoid crashes (using zoom requires passing a valid center prop).
        // See 1.7.1 source at https://github.com/Leaflet/Leaflet/blob/bd88f73e8ddb90eb945a28bc1de9eb07f7386118/dist/leaflet-src.js#L3181
        bounds={(showBounds && versionBoundingBox) || feedsArrayBounds || mapState.bounds}
        scrollWheelZoom={!disableScroll}
        onMoveEnd={this.mapMoved}
        onLayerAdd={this.layerAddHandler}
        className='Gtfs-Map'>
        <TileLayer {...defaultTileLayerProps()} />
        {/* Feed version bounding box (show if not set to default indicating invalid version bounds) */}
        {showBounds && versionBoundingBox &&
          <Rectangle
            bounds={versionBoundingBox}
            interactive={false}
            fillOpacity={0} />
        }

        {/* Stops from map bounds search */}
        {
          (showStops || (entities && entities.indexOf('stops') !== -1)) &&
          stops &&
          stops.length &&
          <FeatureGroup ref='stops'>
            {stops.map((s, index) => {
              if (!s) return null
              return (
                <StopMarker
                  stop={s}
                  routes={routes}
                  key={`marker-${s.stop_id}`}
                  renderTransferPerformance={renderTransferPerformance}
                  onStopClick={onStopClick}
                  newEntityId={newEntityId}
                  popupActionPrefix={popupActionPrefix}
                />
              )
            })}
          </FeatureGroup>
        }

        {/* Stop from GtfsSearch */}
        {stop && (
          <FeatureGroup>
            <StopMarker
              stop={stop}
              routes={routes}
              renderTransferPerformance={renderTransferPerformance}
              onStopClick={onStopClick}
              newEntityId={newEntityId}
              popupActionPrefix={popupActionPrefix}
            />
          </FeatureGroup>
        )}
        {/* Patterns from map bounds search */}
        {patterns && !version
          ? patterns.map((pattern, index) => (
            <PatternGeoJson
              pattern={pattern}
              key={`${pattern.feed.id}-${pattern.pattern_id}`}
              index={index}
              onRouteClick={onRouteClick}
              newEntityId={newEntityId}
              popupActionPrefix={popupActionPrefix} />
          ))
          : null
        }
        {/* Group of Patterns from search */}
        {showPatterns && displayedPatterns && displayedPatterns.length && (
          <FeatureGroup>
            {displayedPatterns.map((pattern, index) => (
              <PatternGeoJson
                pattern={pattern}
                key={pattern.pattern_id}
                index={index}
                onRouteClick={onRouteClick}
                newEntityId={newEntityId}
                popupActionPrefix={popupActionPrefix} />
            ))}
          </FeatureGroup>
        )}
        {/* Pattern from GtfsSearch */}
        {pattern &&
          <PatternGeoJson
            key={`${pattern.feed.id}-${pattern.pattern_id}`}
            pattern={pattern}
            onRouteClick={onRouteClick}
            newEntityId={newEntityId}
            popupActionPrefix={popupActionPrefix} />
        }
        {/* Display all route patterns */}
        {showAllRoutesOnMap &&
          shapes.data.map((shape, index) =>
            <Polyline
              color='#556c7f'
              interactive={false}
              key={shape.id}
              positions={shape.latLngs}
              renderer={CANVAS}
              weight={2} />
          )}
      </Map>
    )
  }
}
