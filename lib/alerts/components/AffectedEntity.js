import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'

import { ListGroupItem, Row, Col, Button, Collapse, Glyphicon, Label } from 'react-bootstrap'
import { getFeed } from '../../common/util/modules'
import { getRouteNameAlerts } from '../../editor/util/gtfs'
import AgencySelector from './AgencySelector'
import ModeSelector from './ModeSelector'
import StopSelector from './StopSelector'
import RouteSelector from './RouteSelector'

export default class AffectedEntity extends Component {
  state = {
    active: false
  }

  _onRowClick = () => this.setState({active: !this.state.active})

  _onClickDeleteEntity = () => this.props.onDeleteEntityClick(this.props.entity)

  getEntitySummary (entity, feeds) {
    const type = entity.type
    const val = entity[type.toLowerCase()]
    let agencyName = ''
    if (typeof entity.agency !== 'undefined' && entity.agency !== null) {
      agencyName = entity.agency.name
    } else if (typeof entity.stop !== 'undefined' && entity.stop !== null) {
      const feed = getFeed(feeds, entity.stop.feed_id)
      agencyName = typeof feed !== 'undefined' ? feed.name : 'Unknown agency'
    }
    const routeName = entity.route ? getRouteNameAlerts(entity.route) : entity.route_id
    const stopName = entity.stop
      ? `${entity.stop.stop_name} (${entity.stop.stop_id}) ${agencyName}`
      : entity.stop_id
    let summary = ''
    switch (type) {
      case 'AGENCY' :
        return (
          <span>
            <Label bsStyle='warning'><Icon type='building' /></Label>{' '}
            {agencyName}<br />
            <small style={{marginLeft: '18px'}}>Note: this selection will apply to all stops and routes for {agencyName}.</small>
          </span>
        )
      case 'STOP' :
        summary = stopName
        if (routeName) {
          summary += ` for ${routeName}`
        }
        return <span><Icon type='map-marker' /> {summary}</span>
      case 'ROUTE' :
        summary = routeName
        if (stopName) {
          summary += ` at ${stopName}`
        }
        return <span><Glyphicon glyph='option-horizontal' /> {summary}</span>
      case 'MODE' :
        summary = val.name
        if (stopName) {
          summary += ` at ${stopName}`
        }
        return (
          <span>
            {type}: {summary}<br />
            <small style={{marginLeft: '18px'}}>Note: this selection will apply to all {val.name.toLowerCase()} routes{stopName && ` stopping at ${stopName}`}.</small>
          </span>
        )
    }
  }

  renderHeader (entity, feeds) {
    return (
      <Row
        className='list-group-item-heading'
        onClick={this._onRowClick}
        style={{cursor: 'pointer'}}>
        <Col xs={10}>
          <h5>
            <Icon type={this.state.active ? 'caret-down' : 'caret-right'} />
            {this.getEntitySummary(entity, feeds)}
          </h5>
        </Col>
        <Col xs={2}>
          <Button
            bsSize='small'
            className='pull-right'
            style={{marginTop: '5px'}}
            onClick={this._onClickDeleteEntity}>
            <Icon type='remove' />
          </Button>
        </Col>
      </Row>
    )
  }
  renderEntity (entity, activeFeeds, entityUpdated, feeds) {
    var indent = {
      paddingLeft: '30px'
    }
    const selectedFeeds = [entity.agency] || activeFeeds
    const selectedRoute = entity.route
    const selectedStop = entity.stop
    switch (entity.type) {
      case 'AGENCY':
        return (
          <div className='list-group-item-text'>
            <span><b>Agency:</b></span>
            <AgencySelector
              feeds={feeds}
              entityUpdated={entityUpdated}
              entity={entity} />
          </div>
        )
      case 'MODE':
        return (
          <div className='list-group-item-text'>
            <span><b>Mode:</b></span>
            <ModeSelector
              entityUpdated={entityUpdated}
              value={entity.type}
              entity={entity} />
            <div style={indent}>
              <span><i>Refine by Agency:</i></span>
              <AgencySelector
                feeds={feeds}
                entityUpdated={entityUpdated}
                entity={entity} />
              <span><i>Refine by Stop:</i></span>
              <StopSelector
                feeds={selectedFeeds}
                stop={entity.stop}
                entityUpdated={entityUpdated}
                entity={entity} />
            </div>
          </div>
        )
      case 'STOP':
        return (
          <div className='list-group-item-text'>
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
        )
      case 'ROUTE':
        return (
          <div className='list-group-item-text'>
            <span><b>Route:</b></span>
            <RouteSelector
              feeds={activeFeeds}
              route={entity.route}
              clearable={false}
              entityUpdated={entityUpdated}
              entity={entity} />
            <div style={indent}>
              <span><i>Refine by Stop:</i></span>
              <StopSelector
                feeds={selectedFeeds}
                minimumInput={0}
                filterByRoute={selectedRoute}
                stop={entity.stop}
                entityUpdated={entityUpdated}
                entity={entity} />
            </div>
          </div>
        )
    }
  }
  render () {
    const {
      entity,
      feeds,
      entityUpdated,
      activeFeeds
    } = this.props
    const bsStyle = (entity && entity.type === 'AGENCY') || (entity && entity.type === 'MODE') ? 'warning' : undefined
    return (
      <ListGroupItem bsStyle={bsStyle}>
        {this.renderHeader(entity, feeds)}
        <Collapse in={this.state.active}>
          {this.renderEntity(entity, activeFeeds, entityUpdated, feeds)}
        </Collapse>
      </ListGroupItem>
    )
  }
}
