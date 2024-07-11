// @flow

import { divIcon } from 'leaflet'
import React, {Component} from 'react'
import {FeatureGroup, Popup} from 'react-leaflet'
import {Row, Col, FormGroup, ControlLabel} from 'react-bootstrap'

import * as activeActions from '../../actions/active'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import MinuteSecondInput from '../MinuteSecondInput'
import PatternStopButtons from '../pattern/PatternStopButtons'
import type {ControlPoint, Feed, GtfsLocation, Pattern, PatternStop } from '../../../types'
import { groupLocationShapePoints } from '../../util/location'

import PolygonWithLabel from './PolygonWithLabel'

type Props = {
  active: boolean,
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  controlPoints: Array<ControlPoint>,
  feedSource: Feed,
  index: number,
  location: GtfsLocation,
  patternEdited: boolean,
  patternStop: PatternStop,
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  updatePatternStops: typeof tripPatternActions.updatePatternStops
}

/**
 * Renders pattern location zone on map and a popup to manage the
 * pattern location
 */
export default class PatternLocationMarker extends Component<Props> {
  componentWillReceiveProps (nextProps: Props) {
    // open popup if active
    // if (nextProps.active !== this.props.active) {
    //   if (nextProps.active) {
    //     this.refs[nextProps.patternLocation.id].leafletElement.openPopup()
    //   } else {
    //     this.refs[nextProps.patternLocation.id].leafletElement.closePopup()
    //   }
    // }
  }

  _onChangeTimeInLocation = (value: number) => {
    const {activePattern, index, updatePatternStops} = this.props
    const patternStops = {activePattern}
    if (patternStops[index].hasOwnProperty('defaultDwellTime')) {
      patternStops[index].defaultDwellTime = value
      updatePatternStops(activePattern, patternStops)
    } else {
      console.warn('Tried to update defaultDwellTime on a stop!')
    }
  }

  _onChangeTravelTime = (value: number) => {
    const {activePattern, index, updatePatternStops} = this.props
    const patternStops = {activePattern}
    if (patternStops[index].hasOwnProperty('defaultTravelTime')) {
      patternStops[index].defaultTravelTime = value
      updatePatternStops(activePattern, patternStops)
    } else {
      console.warn('Tried to update defaultTravelTime on a stop!')
    }
  }

  _onClick = () => {
    const {active, index, setActiveStop} = this.props

    const {id} = this.props.patternStop
    if (!active && id) {
      // The template string is used as string conversion in a way flow approves of
      setActiveStop({id: `${id}`, index})
    } else {
      setActiveStop({id: null, index: null})
    }
  }

  render () {
    const {active, index, location, patternStop} = this.props

    // If no location is passed, don't attempt to render anything
    if (!location) return null

    const stopName = `${index + 1}. ${location.stop_name || ''} (${location.location_id})`
    const MARKER_SIZE = 24
    const patternStopIcon: HTMLElement = divIcon({
      html: `<span class="fa-stack" title="${stopName}">
              <i class="fa fa-circle fa-stack-2x" style="opacity: 0.8; ${active ? 'color: blue' : ''}"></i>
              <strong class="fa-stack-1x fa-inverse calendar-text">${index + 1}</strong>
            </span>`,
      className: '',
      iconSize: [MARKER_SIZE, MARKER_SIZE]
    })

    // Don't render a stop
    if (!patternStop || patternStop.locationId === null) return null

    const groupedLocationShapePts = groupLocationShapePoints(location.location_shapes)

    return (
      <FeatureGroup>
        {groupedLocationShapePts && Object.keys(groupedLocationShapePts).map(key =>
          <PolygonWithLabel
            color={'#333'}
            fillColor={active ? 'blue' : '#666'}
            fillOpacity={0.25}
            icon={patternStopIcon}
            key={patternStop.locationId ? patternStop.id : location.id}
            onClick={this._onClick}
            opacity={0.6}
            positions={groupedLocationShapePts[key]}
            ref={`${patternStop.locationId ? patternStop.id || patternStop.locationId : location.id}`}
            tooltip={`${index + 1}`}
            zIndexOffset={active ? 1000 : 0}
          >
            <Popup>
              <div // popup requires single child (i.e., single div)
                style={{minWidth: '240px'}}>
                {patternStop.locationGroupId && <h4>Location Group</h4>}
                <h5>{stopName}</h5>
                { // If we do not have a patternLocation, do not render patternLocation edit buttons
                  patternStop.locationId !== null && (
                    <React.Fragment>
                      <Row>
                        <Col xs={12}>
                          <PatternStopButtons
                            {...this.props} patternStop={patternStop} stop={location} />
                        </Col>
                      </Row>
                      <Row>
                        <Col xs={6}>
                          <FormGroup
                            controlId='defaultTravelTime'>
                            <ControlLabel>Travel time</ControlLabel>
                            <MinuteSecondInput
                              seconds={patternStop.defaultTravelTime}
                              onChange={this._onChangeTravelTime} />
                          </FormGroup>
                        </Col>
                        <Col xs={6}>
                          <FormGroup
                            controlId='defaultTimeInLocation'>
                            <ControlLabel>Time in location</ControlLabel>
                            <MinuteSecondInput
                              seconds={patternStop.defaultDwellTime}
                              onChange={this._onChangeTimeInLocation} />
                          </FormGroup>
                        </Col>
                      </Row>
                    </React.Fragment>
                  )}
              </div>
            </Popup>
          </PolygonWithLabel>
        )}
      </FeatureGroup>
    )
  }
}
