// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Badge, Button, ButtonGroup, Tooltip, OverlayTrigger, Nav, NavItem} from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import {getLocations} from '../selectors'
import * as activeActions from '../actions/active'
import * as mapActions from '../actions/map'
import {getEntityBounds, getEntityName, getTripPatterns} from '../util/gtfs'
import {entityIsNew} from '../util/objects'
import {GTFS_ICONS} from '../util/ui'
import type {Entity, Feed, GtfsRoute, GtfsLocation, GtfsStop, Pattern} from '../../types'
import type {MapState, AppState, RouteParams} from '../../types/reducers'
import type {EditorValidationIssue} from '../util/validation/common'

type RouteWithPatterns = {tripPatterns: Array<Pattern>} & GtfsRoute

type Props = {
  activeComponent: string,
  activeEntity: Entity,
  activePattern: Pattern,
  activePatternStops: Array<GtfsStop>,
  editFareRules: boolean,
  entityEdited: boolean,
  feedSource: Feed,
  locations?: Array<GtfsLocation>,
  mapState: MapState,
  params?: RouteParams,
  resetActiveGtfsEntity: typeof activeActions.resetActiveGtfsEntity,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  subComponent: string,
  subEntity: number,
  toggleEditFareRules: boolean => void,
  updateMapSetting: typeof mapActions.updateMapSetting,
  validationErrors: Array<EditorValidationIssue>
}

class EntityDetailsHeader extends Component<Props> {
  messages = getComponentMessages('EntityDetailsHeader')

  _onClickSave = () => {
    if (this.props.subComponent === 'trippattern') {
      this.props.saveActiveGtfsEntity('trippattern')
    } else {
      this.props.saveActiveGtfsEntity(this.props.activeComponent)
    }
  }

  _onClickUndo = () => {
    const {
      activeComponent,
      activeEntity,
      activePattern,
      resetActiveGtfsEntity,
      subComponent
    } = this.props
    if (subComponent === 'trippattern') {
      const castedRoute = ((activeEntity: any): RouteWithPatterns)
      const pattern = castedRoute.tripPatterns.find(p => p.id === activePattern.id)
      if (pattern) resetActiveGtfsEntity({ entity: pattern, component: 'trippattern' })
      else console.warn(`Could not locate pattern with id=${activePattern.id}`)
    } else {
      resetActiveGtfsEntity({ entity: activeEntity, component: activeComponent })
    }
  }

  _onClickZoomTo = () => {
    const { activeEntity, activePatternStops, locations, subEntity, updateMapSetting } = this.props
    let props
    if (subEntity) {
      const castedRoute = ((activeEntity: any): RouteWithPatterns)
      const pattern = castedRoute.tripPatterns.find(p => p.id === subEntity)
      // Locations are needed to find bounds of pattern locations since shapes don't provide them
      props = { bounds: getEntityBounds(pattern, activePatternStops, locations), target: subEntity }
    } else {
      // We need locations & pattern stops to check against trip patterns
      props = { bounds: getEntityBounds(activeEntity, activePatternStops, locations), target: +activeEntity.id }
    }
    updateMapSetting(props)
  }

  _showFareAttributes = () => this.props.toggleEditFareRules(false)

  _showFareRules = () => this.props.toggleEditFareRules(true)

  _showRoute = () => {
    const {
      activeComponent,
      activeEntity,
      feedSource,
      setActiveEntity,
      subComponent
    } = this.props
    if (subComponent === 'trippattern') {
      setActiveEntity(feedSource.id, activeComponent, activeEntity)
    }
  }

  _showTripPatterns = () => {
    const {
      activeComponent,
      activeEntity,
      feedSource,
      setActiveEntity,
      subComponent
    } = this.props
    if (subComponent !== 'trippattern') {
      setActiveEntity(feedSource.id, activeComponent, activeEntity, 'trippattern')
    }
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      editFareRules,
      entityEdited,
      mapState,
      subComponent,
      subEntity,
      validationErrors
    } = this.props
    const validationTooltip = (
      <Tooltip id='tooltip'>
        {validationErrors.map((v, i) => (
          <p key={i}>{v.field}: {v.reason}</p>
        ))}
      </Tooltip>
    )
    const hasErrors = validationErrors.length > 0
    const noLocationShapes =
      activeEntity.location_shapes &&
      typeof activeEntity.location_shapes === 'object' &&
      !activeEntity.location_shapes.length
    const entityName = activeComponent === 'feedinfo'
      ? this.messages('feedInfo')
      : getEntityName(activeEntity)
    const icon = GTFS_ICONS.find(i => i.id === activeComponent)
    const zoomDisabled = activeEntity && !subComponent
      ? mapState.target === activeEntity.id
      : mapState.target === subEntity
    // prevent zooming to empty trip pattern
    const patterns = getTripPatterns(activeEntity)
    const emptyTripPattern = patterns.some(pattern => pattern.patternLocations.length === 0 && pattern.patternStops.length === 0)
    // flex zoom available only when a trip pattern is actually rendered on the map
    const tripPatternRendered = activeEntity.tripPatterns && (this.props.params ? !this.props.params.subEntityId : true)

    const iconName = icon ? icon.icon : null
    const nameWidth = activeComponent === 'stop' || activeComponent === 'route' || activeComponent === 'location'
      ? '176px'
      : '210px'
    return (
      <div className='entity-details-header'>
        <h5 className='entity-details-heading'>
          {/* Zoom, undo, and save buttons */}
          <ButtonGroup className='pull-right'>
            {activeComponent === 'stop' || activeComponent === 'route' || activeComponent === 'location'
              ? <OverlayTrigger
                rootClose
                placement='bottom'
                overlay={<Tooltip id='tooltip'>{this.messages('zoomTo')} {activeComponent}</Tooltip>}>
                <Button
                  bsSize='small'
                  disabled={zoomDisabled || emptyTripPattern || tripPatternRendered}
                  onClick={this._onClickZoomTo}>
                  <Icon type='search' />
                </Button>
              </OverlayTrigger>
              : null
            }
            <OverlayTrigger
              rootClose
              placement='bottom'
              overlay={<Tooltip id='tooltip'>{this.messages('undoChanges')}</Tooltip>}>
              <Button
                bsSize='small'
                disabled={!entityEdited}
                onClick={this._onClickUndo}>
                <Icon type='undo' />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger
              rootClose
              placement='bottom'
              overlay={<Tooltip id='tooltip'>{this.messages('saveChanges')}</Tooltip>}>
              <Button
                bsSize='small'
                data-test-id='save-entity-button'
                disabled={!entityEdited || hasErrors || noLocationShapes}
                onClick={this._onClickSave}>
                <Icon type='floppy-o' />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
          <span className='entity-details-title' style={{width: nameWidth}}>
            {/* Entity Icon */}
            <span style={{position: 'relative', top: '-4px'}}>
              {activeComponent === 'route'
                ? <span className='fa-stack'>
                  <Icon
                    type='square'
                    style={{color: `#${typeof activeEntity.route_color === 'string' ? activeEntity.route_color : 'fff'}`}}
                    className='fa-stack-2x' />
                  <Icon
                    type='bus'
                    style={{color: `#${typeof activeEntity.route_text_color === 'string' ? activeEntity.route_text_color : '000'}`}}
                    className='fa-stack-1x' />
                </span>
                : iconName
                  ? <span className='fa-stack'>
                    <Icon type='square' className='fa-stack-2x' />
                    <Icon type={iconName} className='fa-inverse fa-stack-1x' />
                  </span>
                  // schedule exception icon if no icon found
                  : <span className='fa-stack'>
                    <Icon type='calendar' className='fa-stack-1x' />
                    <Icon type='ban' className='text-danger fa-stack-2x' />
                  </span>
              }
            </span>
            {'  '}
            {/* Entity name */}
            <span
              title={entityName}
              className='entity-details-name'>
              {entityName}
            </span>
          </span>
        </h5>
        {/* Validation issues */}
        <p style={{marginBottom: '2px'}}>
          <small style={{marginTop: '3px'}} className='pull-right'>
            <em className='text-muted'>{this.messages('requiredField')}</em>
          </small>
          <small
            className={`${hasErrors ? ' text-danger' : ' text-success'}`}>
            {hasErrors
              ? <span>
                <Icon type='times-circle' />
                {' '}
                Fix
                {' '}
                <OverlayTrigger
                  placement='bottom'
                  overlay={validationTooltip}>
                  <span style={{borderBottom: '1px dotted #000'}}>
                    {validationErrors.length} {this.messages('validationIssues')}
                  </span>
                </OverlayTrigger>
              </span>
              : <span><Icon type='check-circle' /> {this.messages('noValidationIssues')}</span>
            }
          </small>
        </p>
        <div className='clearfix' />
        {activeComponent === 'route'
          ? <Nav style={{marginBottom: '5px'}} bsStyle='pills' justified>
            <NavItem
              eventKey={'route'}
              active={subComponent !== 'trippattern'}
              onClick={this._showRoute}>
              {this.messages('routeDetails')}
            </NavItem>
            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>Trip patterns define a route&rsquo;s unique stop sequences and timings.</Tooltip>}>
              <NavItem
                active={subComponent === 'trippattern'}
                data-test-id='trippattern-tab-button'
                disabled={!activeEntity || entityIsNew(activeEntity)}
                eventKey={'trippattern'}
                onClick={this._showTripPatterns}
              >
                {this.messages('tripPatterns')}
                <Badge>{patterns.length}</Badge>
              </NavItem>
            </OverlayTrigger>
          </Nav>
          : activeComponent === 'fare'
            ? <Nav style={{marginBottom: '5px'}} bsStyle='pills' justified>
              <NavItem
                active={!editFareRules}
                data-test-id='fare-attributes-tab-button'
                eventKey={'fare'}
                onClick={this._showFareAttributes}
              >
                {this.messages('attributes')}
              </NavItem>
              <NavItem
                active={editFareRules}
                data-test-id='fare-rules-tab-button'
                disabled={!activeEntity || entityIsNew(activeEntity)}
                eventKey={'rules'}
                onClick={this._showFareRules}
              >
                {this.messages('rules')}
              </NavItem>
            </Nav>
            : null
        }
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: Props) => ({
  locations: getLocations(state)
})

const ActiveEntityDetailsHeader = connect(mapStateToProps)(EntityDetailsHeader)
export default ActiveEntityDetailsHeader
