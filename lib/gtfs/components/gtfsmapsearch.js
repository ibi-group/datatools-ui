// @flow

import React, {Component} from 'react'
import {connect} from 'react-redux'
import fetch from 'isomorphic-fetch'
import { Button } from 'react-bootstrap'

import {GTFS_GRAPHQL_PREFIX} from '../../common/constants'
import {getHeaders} from '../../common/util/util'
import {mapPatternShape} from '../../editor/util/gtfs'
import ActiveGtfsMap from '../containers/ActiveGtfsMap'
import GtfsSearch from './gtfs-search'
import {patternsForRoute} from '../util/graphql'

import type {Feed, GtfsRoute, GtfsStop} from '../../types'
import type {AppState, MapState, ManagerUserState} from '../../types/reducers'

type Props = {
  feeds: Array<Feed>,
  mapState?: MapState,
  newEntityId?: number,
  onRouteClick?: (feed: Feed, route: GtfsRoute) => any,
  onStopClick: (props: {entities: Array<GtfsStop>, feed: Feed}) => any,
  placeholder?: string,
  popupActionPrefix: string,
  user?: ManagerUserState
}

type State = {
  pattern: any,
  searchFocus: ?string,
  searching: Array<string>,
  stop: ?GtfsStop
}

class GtfsMapSearch extends Component<Props, State> {
  state = {
    stop: null,
    pattern: null,
    searchFocus: null,
    searching: ['stops', 'routes']
  }

  getPatternsForRoute (feed: Feed, route: GtfsRoute) {
    const namespace = feed.publishedVersionId
    const {user} = this.props
    if (!user) {
      console.warn('Impossible de récupérer les motifs sans token utilisateur')
      return
    }
    const {token} = user
    if (!token) {
      console.warn('Impossible de récupérer les motifs sans token utilisateur')
      return
    }
    const {route_id: routeId} = route
    if (!namespace || !routeId) {
      console.warn(`Impossible de récupérer les motifs pour le flux non-publié ${feed.name}.`)
      return
    }
    const body = JSON.stringify({
      query: patternsForRoute,
      variables: {namespace, routeId}
    })
    return fetch(`${GTFS_GRAPHQL_PREFIX}`, {
      method: 'post',
      body,
      headers: getHeaders(token)
    })
      .then((response) => response.json())
      .then(json => {
        const route: GtfsRoute & {patterns: Array<any>} = json.data.feed.routes[0]
        const patterns = route.patterns.map(mapPatternShape)
        const pattern = patterns[0]
        // hack to associate route to pattern
        delete route.patterns
        const result: {feed: Feed, pattern_id: string, route: GtfsRoute} = {
          ...pattern,
          route,
          feed
        }
        return result
      })
  }

  _onChangeEntity = async (input: any) => {
    let pattern, stop, searchFocus
    pattern = stop = searchFocus = null
    if (input && input.stop) {
      stop = input.stop
      // Assign feed to stop
      stop.feed = input.agency
      searchFocus = stop.stop_id
    } else if (input && input.route) {
      const {agency: feed, route} = input
      // TODO: Move into action?
      // No need to assign feed to pattern (this happens in getPatternsForRoute).
      pattern = await this.getPatternsForRoute(feed, route)
      if (pattern) searchFocus = pattern.pattern_id
    }
    this.setState({stop, pattern, searchFocus})
  }

  /**
   * Cycle through the different combinations to search stops and/or routes.
   */
  _onChangeSearching = () => {
    const {searching} = this.state
    if (searching.indexOf('routes') > -1 && searching.indexOf('stops') > -1) {
      // If current state has both entity types, remove stops
      this.setState({searching: ['routes']})
    } else if (searching.indexOf('stops') === -1) {
      // Else, if it only routes (i.e., it's missing stops), set to stops
      this.setState({searching: ['stops']})
    } else {
      // Otherwise, set to both
      this.setState({searching: ['stops', 'routes']})
    }
  }

  render () {
    const {
      feeds,
      mapState,
      placeholder,
      onStopClick,
      onRouteClick,
      newEntityId,
      popupActionPrefix
    } = this.props
    const {
      pattern,
      searchFocus,
      searching,
      stop
    } = this.state
    const zoomMessage = mapState && mapState.zoom && mapState.zoom <= 13
      ? `Zoomer pour voir ${searching.join(' et ')}`
      : ''
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
          feeds={feeds}
          height={400}
          newEntityId={newEntityId}
          onRouteClick={onRouteClick}
          onStopClick={onStopClick}
          popupActionPrefix={popupActionPrefix}
          ref='map'
          version={null}
          width={`100%`}
          // The below props are passed in from the selection of a search result
          entities={searching}
          pattern={pattern}
          searchFocus={searchFocus}
          stop={stop} />
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    mapState: state.gtfs.filter.map,
    user: state.user
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(GtfsMapSearch)
