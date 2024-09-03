// @flow

import React, { Component} from 'react'
import { Glyphicon, Label as BsLabel } from 'react-bootstrap'
import { connect } from 'react-redux'
import {Async} from 'react-select'

import {getRouteName} from '../../editor/util/gtfs'
import {searchEntitiesWithString} from '../util'
import type {Feed, GtfsRoute, GtfsStop, User} from '../../types'
import type {AppState} from '../../types/reducers'

export type GtfsOption = {
  agency?: Feed,
  label: string,
  route?: GtfsRoute,
  stop?: GtfsStop,
  value: string
}

type Props = {
  entities: Array<string>,
  excludedEntityIds: Array<string>,
  feeds: Array<Feed>,
  filterByRoute?: GtfsRoute,
  filterByStop?: GtfsStop,
  namespace?: ?string,
  onChange: any => void | Promise<any>, // TODO: use more exact function argument types
  placeholder?: string,
  user: User,
  value?: ?string | GtfsOption
}

type State = {
  value?: ?string | GtfsOption
}

const _entityToOption = (entity: GtfsStop | GtfsRoute, agency: ?Feed) => {
  if (entity.stop_id) {
    const stop: GtfsStop = ((entity: any): GtfsStop)
    const stopCode = stop.stop_code ? stop.stop_code : stop.stop_id
    return {
      stop,
      label: `${stop.stop_name} (${stopCode})`,
      value: stop.stop_id,
      agency
    }
  } else {
    const route: GtfsRoute = ((entity: any): GtfsRoute)
    return {
      route,
      label: `${getRouteName(route)} (${route.route_id})`,
      value: route.route_id,
      agency
    }
  }
}

const _renderOption = (option: GtfsOption) => {
  return (
    <span style={{ color: 'black' }}>
      {option.stop
        ? <Glyphicon glyph='map-marker' />
        : <Glyphicon glyph='option-horizontal' />
      }
      {' '}{option.label}{' '}
      <BsLabel>
        {option.agency && option.agency.name ? option.agency.name : ''}
      </BsLabel>
    </span>
  )
}

const _sortOptions = (a: GtfsOption, b: GtfsOption, input: string) => {
  const aLabel = a.label.toLowerCase()
  const bLabel = b.label.toLowerCase()
  if (aLabel.startsWith(input)) {
    return bLabel.startsWith(input) ? aLabel.localeCompare(bLabel) : -1
  } else {
    return bLabel.startsWith(input) ? 1 : aLabel.localeCompare(bLabel)
  }
}

/**
 * A component build with react-select that queries the GraphQL endpoint for
 * GTFS stops and routes using the user-inputted text.
 */
class GtfsSearch extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      value: this.props.value
    })
  }

  static defaultProps = {
    autoload: false, // prevent options from auto-loading, esp. when rendering multiple
    entities: ['routes', 'stops'],
    minimumInput: 1
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.value !== nextProps.value && typeof this.props.value !== 'undefined') {
      this.setState({value: nextProps.value})
    }
  }

  /**
   * Make async call to fetch GTFS entities via GraphQL endpoint.
   * @param  {String} input text string to search
   */
  _loadOptions = (input: string) => {
    const {
      entities,
      excludedEntityIds,
      feeds,
      filterByRoute,
      filterByStop,
      namespace,
      user,
      value: currentOption
    } = this.props
    // $FlowFixMe kind of cryptic error, ignoring for now
    let queries = []
    if (namespace) {
      // If feed namespace provided directly (in the case of GTFSPlus), override
      // any feeds that were provided in favor of version namespace.
      queries.push(searchEntitiesWithString(input, namespace, entities, filterByRoute, filterByStop, user))
    } else if (feeds.length > 0) {
      // Otherwise, query for the published version ID for all feeds provided
      // (this handles the alerts search case).
      queries = feeds
        // FIXME: Need to filter on selected feeds?
        .filter(feed => feed.publishedVersionId)
        .map(feed => searchEntitiesWithString(input, feed.publishedVersionId, entities, filterByRoute, filterByStop, user))
      if (queries.length === 0) {
        console.warn('Pas de requêtes à effectuer (il n’y a probablement aucun flux publié).')
        return
      }
    }
    return Promise
      .all(queries)
      .then(responses => {
        const routeOptions = []
        const stopOptions = []
        responses.forEach(response => {
          const {results, namespace: responseNamespace} = response
          const feed = feeds.find(f => f.publishedVersionId === responseNamespace)
          if (results.feed) {
            // Skip results if there was not a successful response
            const {stops, routes} = results.feed
            // Entities must be mapped to options here in order to make use of
            // feed references.
            stops && stopOptions.push(...stops.map(s => _entityToOption(s, feed)))
            routes && routeOptions.push(
              ...routes
                // Remove specified entity ids (route ids in this case) to exclude, except the current value.
                .filter(route =>
                  !excludedEntityIds.includes(route.route_id) ||
                  // (Extended type checks are for flow validation.)
                  (route.route_id === (typeof currentOption === 'object' ? currentOption && currentOption.value : currentOption))
                )
                .map(r => _entityToOption(r, feed))
            )
          } else {
            const feedName = feed ? feed.name : responseNamespace
            console.warn(`Impossible de chercher les entités GTFS (requête: "${input}") pour ${feedName}`, results)
          }
        })
        // Sort stop and route options independently (so that stops appear first)
        // using the input text string (so that options that begin with text
        // string bubble to the top).
        stopOptions.sort((a, b) => _sortOptions(a, b, input))
        routeOptions.sort((a, b) => _sortOptions(a, b, input))
        const options = [...stopOptions, ...routeOptions]
        return {options}
      })
  }

  _onChange = (value: GtfsOption) => {
    this.props.onChange && this.props.onChange(value)
    this.setState({value})
  }

  _onFocus = (input: string) => {
    // Clear options onFocus to ensure only valid route/stop combinations are
    // selected.
    this.refs.gtfsSelect.loadOptions('')
  }

  render () {
    const {entities, placeholder: propsPlaceholder} = this.props
    const placeholder = propsPlaceholder ||
      `Commence à écrire pour chercher ${entities.join(' ou ')}...`
    return (
      <Async
        {...this.props}
        ref='gtfsSelect'
        cache={false}
        onFocus={this._onFocus}
        filterOptions
        placeholder={placeholder}
        loadOptions={this._loadOptions}
        value={this.state.value}
        optionRenderer={_renderOption}
        onChange={this._onChange} />
    )
  }
}

const mapDispatchToProps = {}

const mapStateToProps = (state: AppState, ownProps) => ({user: state.user})

// $FlowFixMe https://github.com/flow-typed/flow-typed/issues/2628
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsSearch)
