import React, {Component, PropTypes} from 'react'
import { Map, Marker, Popup, TileLayer } from 'react-leaflet'
import { Button } from 'react-bootstrap'
import { Browser } from 'leaflet'

import { getFeedsBounds } from '../../common/util/geo'

export default class FeedsMap extends Component {
  static propTypes = {
    bounds: PropTypes.object
  }

  state = {
    bounds: this.props.bounds || [[70, 130], [-70, -130]]
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.bounds && this.props.bounds !== nextProps.bounds) {
      this.refs.feedsMap.leafletElement.fitBounds(nextProps.bounds)
    }
  }

  getFeedLocation = (bounds) => {
    if (!bounds) return null
    const lngEast = bounds.east ? bounds.east : bounds.west // check for 0 values
    const lngWest = bounds.west ? bounds.west : bounds.east // check for 0 values
    const latNorth = bounds.north ? bounds.north : bounds.south // check for 0 values
    const latSouth = bounds.south ? bounds.south : bounds.north // check for 0 values

    // return averaged location
    return [(latNorth + latSouth) / 2, (lngWest + lngEast) / 2]
  }

  render () {
    const MAPBOX_MAP_ID = process.env.MAPBOX_MAP_ID
    const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN
    const MAPBOX_ATTRIBUTION = process.env.MAPBOX_ATTRIBUTION
    const {onFeedClick, projects} = this.props
    const mapStyle = {
      height: '500px',
      width: '100%'
    }
    const feeds = []
    projects.forEach(p => {
      if (p.feedSources) {
        p.feedSources.forEach(f => {
          feeds.push(f)
        })
      }
    })
    let bounds = getFeedsBounds(feeds)

    const markers = []
    feeds.map(feed => {
      if (feed.latestValidation && feed.latestValidation.bounds) {
        markers.push({
          name: feed.name,
          id: feed.id,
          position: this.getFeedLocation(feed.latestValidation.bounds),
          url: feed.url
        })
      }
    })
    bounds = bounds && bounds.north
      ? [[bounds.north, bounds.east], [bounds.south, bounds.west]]
      : this.state.bounds

    return (
      <Map
        ref='feedsMap'
        style={mapStyle}
        bounds={feeds.length === 0 ? this.state.bounds : bounds}
        scrollWheelZoom={false}>
        <TileLayer
          url={`https://api.tiles.mapbox.com/v4/${MAPBOX_MAP_ID}/{z}/{x}/{y}${Browser.retina ? '@2x' : ''}.png?access_token=${MAPBOX_ACCESS_TOKEN}`}
          attribution={MAPBOX_ATTRIBUTION} />
        {markers.map((m, i) => {
          if (isNaN(m.position[0]) || isNaN(m.position[1])) {
            return null
          }
          return (
            <FeedMarker
              marker={m}
              key={i}
              onFeedClick={onFeedClick} />
          )
        })}
      </Map>
    )
  }
}

class FeedMarker extends Component {
  static propTypes = {
    marker: PropTypes.object,
    onFeedClick: PropTypes.func
  }

  _onClickView = () => this.props.onFeedClick(this.props.marker.id)

  render () {
    const {marker} = this.props
    return (
      <Marker position={marker.position}>
        <Popup>
          <div>
            <h3>{marker.name}</h3>
            <p><a href={marker.url}>{marker.url && marker.url.length > 20 ? marker.url.slice(0, 20) + '...' : marker.url}</a></p>
            <Button
              onClick={this._onClickView}>
              View feed
            </Button>
          </div>
        </Popup>
      </Marker>
    )
  }
}
