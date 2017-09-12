import { divIcon } from 'leaflet'
import React, {Component, PropTypes} from 'react'
import {Marker, Popup} from 'react-leaflet'
import {Row, Col, FormGroup, ControlLabel} from 'react-bootstrap'

import MinuteSecondInput from '../MinuteSecondInput'
import PatternStopButtons from '../pattern/PatternStopButtons'

export default class PatternStopMarker extends Component {
  static propTypes = {
    activePattern: PropTypes.object,
    addStopToPattern: PropTypes.func,
    controlPoints: PropTypes.array,
    patternEdited: PropTypes.bool.isRequired,
    feedSource: PropTypes.object,
    index: PropTypes.number,
    patternStop: PropTypes.object,
    removeStopFromPattern: PropTypes.func,
    saveActiveEntity: PropTypes.func,
    setActiveEntity: PropTypes.func,
    stop: PropTypes.object,
    updateActiveEntity: PropTypes.func
  }

  componentWillReceiveProps (nextProps) {
    // open popup if active
    // if (nextProps.active !== this.props.active) {
    //   if (nextProps.active) {
    //     this.refs[nextProps.patternStop.id].leafletElement.openPopup()
    //   } else {
    //     this.refs[nextProps.patternStop.id].leafletElement.closePopup()
    //   }
    // }
  }

  _onChangeDwellTime = (value) => {
    const {activePattern, index, updateActiveEntity} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].defaultDwellTime = value
    updateActiveEntity(activePattern, 'trippattern', {patternStops})
  }

  _onChangeTravelTime = (value) => {
    const {activePattern, index, updateActiveEntity} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].defaultTravelTime = value
    updateActiveEntity(activePattern, 'trippattern', {patternStops})
  }

  _onClick = () => {
    const {active, index, setActiveStop} = this.props
    const {id} = this.props.patternStop
    if (!active) {
      setActiveStop({id, index})
    } else {
      setActiveStop({id: null, index: null})
    }
  }

  render () {
    const {active, stop, index, patternStop} = this.props
    const stopName = `${index + 1}. ${stop.stop_name} (${stop.stop_code ? stop.stop_code : stop.stop_id})`
    const MARKER_SIZE = 24 // active ? 30 : 24
    const patternStopIcon = divIcon({
      html: `<span title="${stopName}" class="fa-stack">
              <i class="fa fa-circle fa-stack-2x" style="opacity: 0.8; ${active ? 'color: blue' : ''}"></i>
              <strong class="fa-stack-1x fa-inverse calendar-text">${index + 1}</strong>
            </span>`,
      className: '',
      iconSize: [MARKER_SIZE, MARKER_SIZE]
      // iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2]
    })
    return (
      <Marker
        ref={patternStop.id}
        position={[stop.stop_lat, stop.stop_lon]}
        onClick={this._onClick}
        zIndexOffset={active ? 1000 : 0}
        icon={patternStopIcon}>
        <Popup ref={`${patternStop.id}-popup`}>
          <div // popup requires single child (i.e., single div)
            style={{minWidth: '240px'}}>
            <h5>{stopName}</h5>
            <Row>
              <Col xs={12}>
                <PatternStopButtons
                  {...this.props} />
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
                  controlId='defaultDwellTime'>
                  <ControlLabel>Dwell time</ControlLabel>
                  <MinuteSecondInput
                    seconds={patternStop.defaultDwellTime}
                    onChange={this._onChangeDwellTime} />
                </FormGroup>
              </Col>
            </Row>
          </div>
        </Popup>
      </Marker>
    )
  }
}
