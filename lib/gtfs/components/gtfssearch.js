import React, { Component, PropTypes } from 'react'
import fetch from 'isomorphic-fetch'
import { Glyphicon, Label } from 'react-bootstrap'
import Select from 'react-select'

import { getFeed, getFeedId } from '../../common/util/modules'

export default class GtfsSearch extends Component {
  static propTypes = {
    entities: PropTypes.array
  }

  state = {
    value: this.props.value
  }

  static defaultProps = {
    entities: ['routes', 'stops'],
    minimumInput: 1
  }

  cacheOptions (options) {
    options.forEach(o => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.value !== nextProps.value && typeof this.props.value !== 'undefined') {
      this.setState({value: nextProps.value})
    }
  }

  _renderOption (option) {
    return (
      <span style={{ color: 'black' }}>
        {option.stop
          ? <Glyphicon glyph='map-marker' />
          : <Glyphicon glyph='option-horizontal' />
        } {option.label} <Label>{option.agency && option.agency.name ? option.agency.name : ''}</Label> {option.link}
      </span>
    )
  }

  _getRoutes = (input) => {
    const feedIds = this.props.feeds.map(getFeedId)

    if (!feedIds.length) return []

    // don't need to use limit here
    // const limit = this.props.limit ? '&limit=' + this.props.limit : ''
    const nameQuery = input ? '&name=' + input : ''
    const url = this.props.filterByStop ? `/api/manager/routes?stop=${this.props.filterByStop.stop_id}&feed=${feedIds.toString()}` : `/api/manager/routes?feed=${feedIds.toString()}${nameQuery}`
    return fetch(url)
      .then((response) => {
        return response.json()
      })
      .then((routes) => {
        const routeOptions = routes !== null && routes.length > 0
          ? routes.sort((a, b) => {
            const aRouteName = a && this.getRouteName(a).toLowerCase()
            const bRouteName = b && this.getRouteName(b).toLowerCase()
            if (aRouteName.startsWith(input)) {
              return bRouteName.startsWith(input) ? aRouteName.localeCompare(bRouteName) : -1
            } else {
              return bRouteName.startsWith(input) ? 1 : aRouteName.localeCompare(bRouteName)
            }
            // return 0
          }).map(route => (
            {
              route,
              value: route.route_id,
              label: `${this.getRouteName(route)} (${route.route_id})`,
              agency: getFeed(this.props.feeds, route.feed_id)}
          ))
          : []
        return routeOptions
      })
      .catch((error) => {
        console.log(error)
        return []
      })
  }

  _getStops = (input) => {
    const feedIds = this.props.feeds.map(getFeedId)
    // console.log(feedIds)
    if (!feedIds.length) return []

    const limit = this.props.limit ? '&limit=' + this.props.limit : ''
    const nameQuery = input ? '&name=' + input : ''
    const url = this.props.filterByRoute ? `/api/manager/stops?route=${this.props.filterByRoute.route_id}&feed=${feedIds.toString()}${limit}` : `/api/manager/stops?feed=${feedIds.toString()}${nameQuery}${limit}`
    return fetch(url)
      .then((response) => {
        return response.json()
      })
      .then((stops) => {
        const stopOptions = stops !== null && stops.length > 0
          ? stops.sort((a, b) => {
            const aStopName = a && a.stop_name && a.stop_name.toLowerCase()
            const bStopName = b && b.stop_name && b.stop_name.toLowerCase()
            if (aStopName.startsWith(input)) {
              return bStopName.startsWith(input) ? aStopName.localeCompare(bStopName) : -1
            } else {
              return bStopName.startsWith(input) ? 1 : aStopName.localeCompare(bStopName)
            }
          }).map(stop => {
            const agency = getFeed(this.props.feeds, stop.feed_id)
            const id = stop.stop_code ? stop.stop_code : stop.stop_id
            return {
              stop,
              value: stop.stop_id,
              label: `${stop.stop_name} (${id})`,
              agency: agency
            }
          })
          : []
        return stopOptions
      })
      .catch((error) => {
        console.log(error)
        return []
      })
  }

  getRouteName = (route) => {
    const routeName = route.route_short_name && route.route_long_name
      ? `${route.route_short_name} - ${route.route_long_name}`
      : route.route_long_name
      ? route.route_long_name
      : route.route_short_name
      ? route.route_short_name
      : null
    return routeName
  }

  _getOptions = (input) => {
    const {entities} = this.props
    const entitySearches = []
    if (entities.indexOf('stops') > -1) {
      entitySearches.push(this._getStops(input))
    }
    if (entities.indexOf('routes') > -1) {
      entitySearches.push(this._getRoutes(input))
    }
    return Promise.all(entitySearches).then((results) => {
      const stops = results[0]
      const routes = typeof results[1] !== 'undefined' ? results[1] : []
      const options = { options: [...stops, ...routes] }
      // console.log('search options', options)
      return options
    })
  }

  _onChange = (value) => {
    this.props.onChange && this.props.onChange(value)
    this.setState({value})
  }

  _onFocus = (input) => {
    // clear options to onFocus to ensure only valid route/stop combinations are selected
    this.refs.gtfsSelect.loadOptions('')
  }

  render () {
    const placeholder = this.props.placeholder || 'Begin typing to search for ' + this.props.entities.join(' or ') + '...'
    return (
      <Select.Async
        {...this.props}
        ref='gtfsSelect'
        cache={false}
        onFocus={this._onFocus}
        filterOptions
        placeholder={placeholder}
        loadOptions={this._getOptions}
        value={this.state.value}
        optionRenderer={this._renderOption}
        onChange={this._onChange} />
    )
  }
}
