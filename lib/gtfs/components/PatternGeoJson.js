import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes} from 'react'
import { GeoJSON, Popup } from 'react-leaflet'
import { Button } from 'react-bootstrap'

import { getRouteName } from '../../editor/util/gtfs'
import { getFeed } from '../../common/util/modules'

const COLORS = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a']

export default class PatternGeoJson extends GeoJSON {
  static propTypes = {
    pattern: PropTypes.object,
    index: PropTypes.number,
    feeds: PropTypes.array,
    onRouteClick: PropTypes.func,
    popupAction: PropTypes.string,
    newEntityId: PropTypes.number
  }

  _onClickAction = () => {
    const {feeds, onRouteClick, newEntityId, pattern} = this.props
    const route = pattern.route
    const feedId = route ? route.feed_id || route.feed.feed_id : null
    const feed = getFeed(feeds, feedId)
    onRouteClick(route, feed, newEntityId)
  }

  _onEachFeature = (feature, layer) => {
    const {pattern} = this.props
    layer.feature.properties.patternId = pattern.pattern_id
    layer._leaflet_id = pattern.pattern_id
  }

  render () {
    const {feeds, index = 0, onRouteClick, pattern, popupAction} = this.props
    if (!pattern) {
      return null
    }
    const route = pattern.route
    const feedId = route ? route.feed_id || route.feed.feed_id : null
    const feed = getFeed(feeds, feedId)
    const routeName = route ? getRouteName(route) : pattern.route_name
    const routeId = route ? route.route_id : pattern.route_id
    const popup = (
      <Popup>
        <div>
          <p><Icon type='bus' /> <strong>{routeName}</strong></p>
          <ul>
            <li><strong>ID:</strong> {routeId}</li>
            <li><strong>Agency:</strong>{' '}
              {// TODO: change this back to feedName
                // route.feed_id
                feed && feed.name
              }
            </li>
          </ul>
          {onRouteClick
            ? <Button
              bsStyle='primary'
              block
              onClick={this._onClickAction}>
              <Icon type='bus' /> {popupAction} route
            </Button>
            : <p>[Must add stops first]</p>
          }
        </div>
      </Popup>
    )
    return (
      <GeoJSON
        color={COLORS[index % (COLORS.length - 1)]}
        key={pattern.pattern_id}
        data={pattern.geometry}
        onEachFeature={this._onEachFeature}>
        {popup}
      </GeoJSON>
    )
  }
}
