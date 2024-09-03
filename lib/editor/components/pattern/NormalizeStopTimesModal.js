// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Alert, Button, Checkbox, ControlLabel, FormControl, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'

import * as tripPatternActions from '../../actions/tripPattern'
import type { GtfsStop, Pattern } from '../../../types'
import { getComponentMessages } from '../../../common/util/config'

type Props = {
  activePattern: Pattern,
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
    const { activePattern, stops } = this.props
    const timepoints = activePattern.patternStops.filter(ps => ps.timepoint === 1)
    const interpolationDisabled = timepoints.length < 2
    return (
      <Modal show={this.props.show || this.state.show} onHide={this._onClose}>
        <Header>
          <Title>{this.messages('normalizeStopTimesQuestion')}</Title>
        </Header>
        <Body>
          <p>
            Normaliser les temps d'arrêt effacera les temps d'arrivée et de
            départ pour <strong>tous les trajets</strong> de la circulation pour se conformer 
            au temps de voyage et d'arrêt par défaut des arrêts de la circulation.
          </p>
          <ControlLabel>{this.messages('selectBeginningPatternStop')}</ControlLabel>
          <FormControl
            value={this.state.patternStopIndex}
            componentClass='select'
            onChange={this._onChangeStop}>
            {activePattern.patternStops.map((patternStop, index) => {
              const stop = stops.find(s => s.stop_id === patternStop.stopId)
              if (!stop) return null
              return (
                <option
                  value={index}
                  key={index}>
                  {index + 1} - {stop.stop_name}
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
                Les temps d'arrêt de <strong>tous les arrêts de la circulation</strong> vont être
                normalisés.
              </span>
              : <span>
                Les temps d'arrêt de <strong>l'arrêt {this.state.patternStopIndex + 1}{' '}
                au dernier arrêt</strong> vont être normalisés (les temps d'arrêt
                précédents ne seront pas modifiés).
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
              <strong>Note:</strong> cela ne prend pas en compte des
              variations du temps de voyage entre arrêts au cours de
              la journée (plus long durant les heures de pointe par
              exemple). Cela modifiera tous les temps d'arrêts des
              trajets de la circulaion par les valeurs de l'arrêt 
              de la circulation.
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
