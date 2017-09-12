import React, { Component, PropTypes } from 'react'

import { Panel, Row, Col, ButtonGroup, Button, Glyphicon, Label } from 'react-bootstrap'

import GtfsSearch from '../../gtfs/components/gtfssearch'

import { getFeed } from '../../common/util/modules'

export default class AffectedEntity extends Component {
  static propTypes = {
    feeds: PropTypes.array
  }

  getEntitySummary = (entity, feeds) => {
    let agencyName = ''
    if (entity.agency) {
      agencyName = entity.agency.name
    } else if (entity.stop) {
      const feed = getFeed(feeds, entity.stop.feed_id)
      agencyName = typeof feed !== 'undefined' ? feed.name : 'Unknown agency'
    }
    const labelComponents = []
    const stopName = entity.stop
      ? <span key='stop-name'>{entity.stop.stop_name} ({entity.stop.stop_id}) <Label>{agencyName}</Label></span>
      : <span key='stop-id'>entity.stop_id</span>
    labelComponents.push(stopName)

    const routes = entity.route
      ? <span key='for-routes'> for {entity.route.length} routes</span>
      : entity.route_id
      ? <span key='for-routes'> for {entity.route_id}</span>
      : <span key='add-routes'>[add routes]</span>
    labelComponents.push(routes)
    return (
      <span>
        {labelComponents ? labelComponents.map(l => (l)) : null}
      </span>
    )
  }

  _onClickDelete = () => this.props.onDeleteEntityClick(this.props.entity)

  render () {
    const {
      entity,
      activeFeeds,
      feeds,
      entityUpdated
    } = this.props
    var indent = {paddingLeft: '30px'}
    const selectedFeeds = [entity.agency] || activeFeeds
    const selectedStop = entity.stop
    return (
      <Panel
        collapsible
        header={
          <Row>
            <Col xs={10}>
              <span><Glyphicon glyph='map-marker' /> {this.getEntitySummary(entity, feeds)}</span>
            </Col>
            <Col xs={2}>
              <ButtonGroup className='pull-right'>
                <Button bsSize='small' onClick={this._onClickDelete}>
                  <Glyphicon glyph='remove' />
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        }>
        {/* Panel Body */}
        <div>
          <span><b>Stop:</b></span>
          <StopSelector
            feeds={activeFeeds}
            stop={entity.stop}
            clearable={false}
            entityUpdated={entityUpdated}
            entity={entity} />
          <div style={indent}>
            <span><i>Refine by Route:</i></span>
            <RouteSelector
              feeds={selectedFeeds}
              minimumInput={0}
              filterByStop={selectedStop}
              route={entity.route}
              entityUpdated={entityUpdated}
              entity={entity} />
          </div>
        </div>
      </Panel>
    )
  }
}

class RouteSelector extends Component {
  static propTypes = {
    clearable: PropTypes.bool,
    entityUpdated: PropTypes.func,
    feeds: PropTypes.array,
    filterByStop: PropTypes.bool,
    minimumInput: PropTypes.number,
    route: PropTypes.object
  }
  getRouteName = (route) => {
    const routeName = route.route_short_name && route.route_long_name
      ? `${route.route_short_name} - ${route.route_long_name}`
      : route.route_long_name ? route.route_long_name
      : route.route_short_name ? route.route_short_name
      : route.RouteId ? route.RouteId
      : null
    return routeName
  }

  _onChangeRoute = (input) => {
    if (input) {
      const routes = input.map(e => e.route)
      this.props.entityUpdated(this.props.entity, 'ROUTES', routes)
    } else {
      this.props.entityUpdated(this.props.entity, 'ROUTES', [])
    }
  }

  render () {
    const {
      clearable,
      feeds,
      filterByStop,
      minimumInput,
      route
    } = this.props
    return (
      <GtfsSearch
        feeds={feeds}
        limit={100}
        multi
        minimumInput={minimumInput}
        filterByStop={filterByStop}
        clearable={clearable}
        entities={['routes']}
        onChange={this._onChangeRoute}
        value={
          route
          ? route.map(r => ({'route': r, 'value': r.route_id, 'label': `${this.getRouteName(r)}`}))
          : ''
        } />
    )
  }
}

class StopSelector extends Component {
  static propTypes = {
    clearable: PropTypes.bool,
    entityUpdated: PropTypes.func,
    feeds: PropTypes.array,
    filterByRoute: PropTypes.bool,
    minimumInput: PropTypes.number,
    stop: PropTypes.object
  }
  _onChangeStop = (input) => {
    if (typeof input !== 'undefined' && input !== null) {
      this.props.entityUpdated(this.props.entity, 'STOP', input.stop, input.agency)
    } else if (input === null) {
      this.props.entityUpdated(this.props.entity, 'STOP', null, null)
    }
  }

  render () {
    const {clearable, feeds, filterByRoute, minimumInput, stop} = this.props
    const feed = stop ? getFeed(feeds, stop.feed_id) : null
    const agencyName = feed ? feed.name : 'Unknown agency'
    return (
      <GtfsSearch
        feeds={feeds}
        limit={100}
        minimumInput={minimumInput}
        filterByRoute={filterByRoute}
        entities={['stops']}
        clearable={clearable}
        onChange={this._onChangeStop}
        value={stop
          ? {
            stop,
            value: stop.stop_id,
            label: `${stop.stop_name} (${agencyName})`
          }
          : ''
        } />
    )
  }
}
