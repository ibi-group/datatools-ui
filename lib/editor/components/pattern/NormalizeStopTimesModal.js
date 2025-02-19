// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Alert, Button, Checkbox, ControlLabel, FormControl, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'

import * as tripPatternActions from '../../actions/tripPattern'
import type { GtfsLocation, GtfsStop, Pattern } from '../../../types'
import { getComponentMessages } from '../../../common/util/config'

type Props = {
  activePattern: Pattern,
  locations: Array<GtfsLocation>,
  normalizeStopTimes: typeof tripPatternActions.normalizeStopTimes,
  onClose: any,
  show: boolean,
  stops: Array<GtfsStop>
}

  type State = { interpolateStopTimes: boolean, patternStopIndex: number, show: boolean }

export default class NormalizeStopTimesModal extends Component<Props, State> {
  messages = getComponentMessages('NormalizeStopTimesModal')

  state = {
    interpolateStopTimes: false,
    patternStopIndex: 0, // default to zeroth pattern stop
    show: false
  }

  _onClickNormalize = () => {
    const { activePattern, normalizeStopTimes } = this.props
    normalizeStopTimes(activePattern.id, this.state.patternStopIndex, this.state.interpolateStopTimes)
    this.setState({interpolateStopTimes: false})
  }

  _onChangeStop = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({patternStopIndex: +evt.target.value})
  }

  _onClose = () => {
    this.setState({ show: false, interpolateStopTimes: false })
    this.props.onClose()
  }

  _onChangeInterpolation = () => {
    this.setState({interpolateStopTimes: !this.state.interpolateStopTimes})
  }

  render () {
    const { Body, Footer, Header, Title } = Modal
    const { activePattern, locations, stops } = this.props
    const { patternStops } = activePattern
    const timepoints = patternStops.filter(ps => ps.timepoint === 1)
    const interpolationDisabled = timepoints.length < 2
    return (
      <Modal show={this.props.show || this.state.show} onHide={this._onClose}>
        <Header>
          <Title>{this.messages('normalizeStopTimesQuestion')}</Title>
        </Header>
        <Body>
          <p>
            Normalizing stop times will overwrite the arrival and departure
            times for <strong>all trips</strong> on this pattern to conform
            to the default travel and dwell times defined for the pattern stops.
          </p>
          <ControlLabel>{this.messages('selectBeginningPatternStop')}</ControlLabel>
          <FormControl
            value={this.state.patternStopIndex}
            componentClass='select'
            onChange={this._onChangeStop}>
            {patternStops.map((patternStop, index) => {
              let displayName
              // TODO: Add methods to return patternStop, patternLocation, patternStopArea separately and explicitly
              if (patternStop.stopId !== null) {
                const stop = stops.find(s => s.stop_id === patternStop.stopId)
                if (!stop) return null
                displayName = stop.stop_name
              } else if (patternStop.locationId !== null || patternStop.locationGroupId !== null) {
                const location = locations.find(l => l.location_id === patternStop.locationId)
                if (!location) return null
                displayName = location.stop_name || location.location_id
              } else {
                // TODO: when we have implemented areas for area naming, lookup the display name for the area.
                // $FlowFixMe: Flow doesn't recognize that above is a type check
                displayName = patternStop.areaId
              }
              return (
                <option
                  value={index}
                  key={index}>
                  {index + 1} - {displayName}
                </option>
              )
            }
            )}
          </FormControl>
          <div style={{alignContent: 'center', alignItems: 'center', display: 'flex'}}>
            <OverlayTrigger
              overlay={<Tooltip>{this.messages('tooFewTimepoints')}</Tooltip>}
              placement='bottom'
              // Semi-hack: Use the trigger prop to conditionally render the tooltip text only when checkbox is disabled.
              trigger={interpolationDisabled ? ['hover'] : []}
            >
              <Checkbox
                disabled={interpolationDisabled}
                onChange={this._onChangeInterpolation}
                value={this.state.interpolateStopTimes}
              />
            </OverlayTrigger>
            {/* Separate label so that tooltip appears over checkbox. Hack: Padding to align center with checkbox */}
            <span style={{paddingBottom: '2px'}}>{this.messages('interpolateStopTimes')}</span>
          </div>
          <br />
          <Alert bsStyle='warning'>
            {this.state.patternStopIndex === 0
              // TODO: figure out how yml messages with html tags can be rendered
              // correctly.
              ? <span>
                Stop times for <strong>all pattern stops</strong> will be
                normalized.
              </span>
              : <span>
                Stop times for <strong>stop {this.state.patternStopIndex + 1}{' '}
                through final stop</strong> will be normalized (any stop times
                prior will be unmodified).
              </span>
            }
          </Alert>
          <Alert bsStyle='info'>
            <h5><Icon type='info-circle' />{this.messages('usageNotes')}</h5>
            <small>
              {this.messages('usageExplanationOne')}
              <hr />
              {this.messages('usageExplanationTwo')}
              <hr />
              <strong>Note:</strong> this does not account for any variation
              in travel time between stops for trips throughout the day (e.g.,
              due to slower travel speeds during the AM peak). It overwrites ALL
              stop times for trips on this pattern with the pattern stop values.
            </small>
          </Alert>
        </Body>
        <Footer>
          <Button
            bsStyle='primary'
            onClick={this._onClickNormalize}
          >
            {this.messages('normalizeStopTimes')}
          </Button>
          <Button
            onClick={this._onClose}>
            {this.messages('close')}
          </Button>
        </Footer>
      </Modal>
    )
  }
}
