import React, { Component, PropTypes } from 'react'

import { getFeed } from '../../common/util/modules'
import { getRouteNameAlerts } from '../../editor/util/gtfs'
import GtfsSearch from '../../gtfs/components/gtfssearch'

export default class RouteSelector extends Component {
  static propTypes = {
    entity: PropTypes.object,
    stop: PropTypes.object,
    feeds: PropTypes.array,
    entityUpdated: PropTypes.func,
    filterByRoute: PropTypes.bool,
    minimumInput: PropTypes.number,
    clearable: PropTypes.bool
  }

  _getFeed = route => route ? getFeed(this.props.feeds, route.feed_id) : null

  _onChange = (evt) => {
    const {entity, entityUpdated, filterByStop, route} = this.props
    if (typeof evt !== 'undefined' && evt !== null) {
      entityUpdated(entity, 'ROUTE', evt.route, evt.agency)
    } else if (evt == null) {
      if (filterByStop) {
        entityUpdated(entity, 'ROUTE', null, this._getFeed(route))
      } else {
        entityUpdated(entity, 'ROUTE', null, null)
      }
    }
  }

  render () {
    const {route, feeds, minimumInput, filterByStop, clearable} = this.props
    const feed = this._getFeed(route)
    const agencyName = feed ? feed.name : 'Unknown agency'
    return (
      <GtfsSearch
        feeds={feeds}
        limit={100}
        minimumInput={minimumInput}
        filterByStop={filterByStop}
        clearable={clearable}
        entities={['routes']}
        onChange={this._onChange}
        value={route
          ? {
            route: route,
            value: route.route_id,
            label: `${getRouteNameAlerts(route)} (${agencyName})`
          }
          : ''
        } />
    )
  }
}
