import React, { Component, PropTypes } from 'react'
import {connect} from 'react-redux'
import fetch from 'isomorphic-fetch'
import { Button } from 'react-bootstrap'

import ActiveGtfsMap from '../containers/ActiveGtfsMap'
import GtfsSearch from './gtfssearch'

class GtfsMapSearch extends Component {
  static propTypes = {
    feeds: PropTypes.array,
    mapState: PropTypes.object,
    newEntityId: PropTypes.number,
    onStopClick: PropTypes.func,
    onRouteClick: PropTypes.func,
    placeholder: PropTypes.string,
    popupAction: PropTypes.string
  }

  state = {
    stop: null,
    pattern: null,
    searching: ['stops', 'routes']
  }

  getPatterns (input) {
    return fetch(`/api/manager/patterns?route=${input.route.route_id}&feed=${input.route.feed_id}`)
    .then((response) => {
      return response.json()
    })
    .then(json => {
      const pattern = json[0]
      // hack to associate route to pattern
      pattern.route = input.route
      return pattern
    })
  }

  _onChangeEntity = (input) => {
    if (!input) {
      this.setState({stop: null, pattern: null, searchFocus: null})
    } else if (input && input.stop) {
      const pattern = null
      const stop = input.stop
      this.setState({ stop, pattern, searchFocus: stop.stop_id })
    } else if (input && input.route) {
      // TODO: replace with GraphQL
      return Promise.all([this.getPatterns(input)]).then((results) => {
        const pattern = results[0]
        const stop = null
        this.setState({ pattern, stop, searchFocus: pattern.pattern_id })
      })
    }
  }

  _onChangeSearching = () => {
    this.state.searching.indexOf('routes') > -1 && this.state.searching.indexOf('stops') > -1
    ? this.setState({searching: ['routes']})
    : this.state.searching.indexOf('stops') === -1
    ? this.setState({searching: ['stops']})
    : this.setState({searching: ['stops', 'routes']})
  }

  render () {
    const {
      feeds,
      mapState,
      placeholder,
      onStopClick,
      onRouteClick,
      newEntityId,
      popupAction
    } = this.props
    const {
      pattern,
      searchFocus,
      searching,
      stop
    } = this.state
    let zoomMessage = 'Zoom in to view ' + searching.join(' and ')
    const mapZoom = mapState.zoom
    zoomMessage = mapZoom <= 13 ? zoomMessage : ''
    const searchProps = {
      stop: stop,
      pattern: pattern,
      searchFocus: searchFocus,
      entities: searching
    }
    return (
      <div>
        <div className='gtfs-map-select'>
          <GtfsSearch
            ref='mapSearch'
            feeds={feeds}
            limit={100}
            placeholder={placeholder}
            onChange={this._onChangeEntity}
            entities={searching} />
        </div>
        <ul style={{marginBottom: 0}} className='list-inline'>
          <li style={{width: '50%'}} className='text-left'>
            <Button
              bsSize='xsmall'
              style={{marginTop: '5px', marginBottom: '5px'}}
              onClick={this._onChangeSearching}>
              Searching {searching.join(' and ')}
            </Button>
          </li>
          <li style={{width: '50%'}} className='text-right'>{zoomMessage}</li>
        </ul>
        <ActiveGtfsMap
          ref='map'
          version={null}
          feeds={feeds}
          onStopClick={onStopClick}
          onRouteClick={onRouteClick}
          newEntityId={newEntityId}
          popupAction={popupAction}
          width={`100%`}
          height={400}
          {...searchProps} />
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    mapState: state.gtfs.filter.map
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(GtfsMapSearch)
