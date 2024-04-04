// @flow
// $FlowFixMe: Flow doesn't know about useState: https://stackoverflow.com/questions/53105954/cannot-import-usestate-because-there-is-no-usestate-export-in-react-flow-with
import React, {useCallback, useState} from 'react'
import {Button, Checkbox, FormControl, Modal} from 'react-bootstrap'

import * as tripActions from '../../actions/trip'
import {getComponentMessages} from '../../../common/util/config'
import HourMinuteInput from '../HourMinuteInput'
import type {Trip} from '../../../types'

type State = {
  autoBlockIdIncrement: number,
  autoBlockIdPrefix: string,
  autoBlockIdStart: number,
  autoTripIdIncrement: number,
  autoTripIdPrefix: string,
  autoTripIdStart: number,
  endTime: ?number,
  headway: ?number,
  startTime: ?number,
  useAutoBlockIds: boolean,
  useAutoTripIds: boolean,
}

const initialState: State = {
  startTime: null,
  headway: null,
  endTime: null,
  useAutoTripIds: false,
  useAutoBlockIds: false,
  autoTripIdStart: 0,
  autoBlockIdStart: 1,
  autoTripIdIncrement: 1,
  autoBlockIdIncrement: 1,
  autoTripIdPrefix: '',
  autoBlockIdPrefix: ''
}

type Props = {
  addNewTrip: typeof tripActions.addNewTrip,
  constructNewRow: (trip: ?Trip, tripSeriesStartTime: ?number, autoTripId: ?string, autoBlockId: ?string) => ?Trip,
  onClose: () => void,
  show: boolean,
  useSecondsInOffset: boolean
}

const TripSeriesModal = (props: Props) => {
  const [state, setState] = useState<State>(initialState)

  const messages = getComponentMessages('TripSeriesModal')

  const handleIncrementStartUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setState((prevState) => ({ ...prevState, autoTripIdStart: +evt.target.value }))
  const handleBlockIdStartUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    // Check the input to make sure it's within the valid range.
    let input = +evt.target.value
    if (isNaN(input)) return null
    if (input > autoBlockIdIncrement) input = autoBlockIdIncrement
    else if (input < 1) input = 1
    setState((prevState) => ({ ...prevState, autoBlockIdStart: input }))
  }

  const handleTripPrefixUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setState((prevState) => ({ ...prevState, autoTripIdPrefix: evt.target.value }))
  const handleBlockPrefixUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setState((prevState) => ({ ...prevState, autoBlockIdPrefix: evt.target.value }))

  const handleTripIncrementUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setState((prevState) => ({ ...prevState, autoTripIdIncrement: +evt.target.value }))
  const handleBlockIncrementUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setState((prevState) => ({ ...prevState, autoBlockIdIncrement: +evt.target.value }))

  const handleAutoTripIDCheckBox = () => setState((prevState) => ({ ...prevState, useAutoTripIds: !prevState.useAutoTripIds }))
  const handleAutoBlockIDCheckBox = () => setState((prevState) => ({ ...prevState, useAutoBlockIds: !prevState.useAutoBlockIds }))

  const _onClose = () => {
    const { onClose } = props
    setState(initialState)
    onClose()
  }

  const onClickGenerate = useCallback(() => {
    const {addNewTrip, constructNewRow} = props
    // Check state variables to make flow happy
    if (state.startTime === null || state.endTime === null || state.headway === null) return
    const adjustedEndTime = state.startTime < state.endTime ? state.endTime : state.endTime + 24 * 60 * 60

    let tripId = state.autoTripIdStart
    let currentBlockIdSuffix = state.autoBlockIdStart
    for (let time = state.startTime; time <= adjustedEndTime; time += state.headway) {
      const autoTripId = state.useAutoTripIds ? `${state.autoTripIdPrefix}-${tripId}` : null
      const autoBlockId = state.useAutoBlockIds ? `${state.autoBlockIdPrefix}-${currentBlockIdSuffix}` : null
      addNewTrip(constructNewRow(null, time, autoTripId, autoBlockId))
      // If we're updating the trip IDs automatically, increment the trip ID:
      if (useAutoTripIds) tripId += autoTripIdIncrement
      // If we're updating the Block IDs automatically, alternate according to input number
      if (useAutoBlockIds) {
        currentBlockIdSuffix += 1
        // If we increase past the alternating number, use the modulus to reset
        if (currentBlockIdSuffix > autoBlockIdIncrement) currentBlockIdSuffix = currentBlockIdSuffix % autoBlockIdIncrement
      }
    }
    _onClose()
  }, [state.startTime, state.endTime, state.headway, state.autoTripIdStart, state.autoTripIdIncrement, state.autoTripIdPrefix, state.autoBlockIdPrefix, state.autoBlockIdIncrement, state.autoBlockIdStart, state.useAutoTripIds, state.useAutoBlockIds])

  const {Body, Footer, Header, Title} = Modal
  const {onClose, show, useSecondsInOffset} = props
  const {
    startTime,
    endTime,
    headway,
    useAutoTripIds,
    autoTripIdPrefix,
    autoTripIdIncrement,
    useAutoBlockIds,
    autoBlockIdPrefix,
    autoBlockIdIncrement,
    autoBlockIdStart
  } = state
  const generateTripsDisabled = startTime === null || endTime === null || !headway
  return (
    <Modal show={show} onHide={onClose}>
      <Header><Title>{messages('createTripSeriesQuestion')}</Title></Header>
      <Body>
        <p>{messages('createTripSeriesBody')}</p>
        <div style={{
          display: 'flex',
          flexDirection: 'row'
        }}>
          <div>
            {messages('startTime')}
            <HourMinuteInput
              onChange={(value) => setState((prevState) => ({ ...prevState, startTime: value }))}
              seconds={startTime}
              showSeconds={useSecondsInOffset}
              standaloneInput
            />
          </div>
          <div style={{marginLeft: '20px'}}>
            {messages('headway')}
            <HourMinuteInput
              onChange={(value) => setState((prevState) => ({ ...prevState, headway: value }))}
              seconds={headway}
              showSeconds={useSecondsInOffset}
              standaloneInput
            />
          </div>
          <div style={{margin: '0px 0px 0px 20px'}}>
            {messages('endTime')}
            <HourMinuteInput
              onChange={(value) => setState((prevState) => ({ ...prevState, endTime: value }))}
              seconds={endTime}
              showSeconds={useSecondsInOffset}
              standaloneInput
            />
          </div>
        </div>
        <hr />
        <div>
          <Checkbox checked={useAutoTripIds} onChange={handleAutoTripIDCheckBox}>
            {messages('automaticallyUpdateTripIds')}
          </Checkbox>
          {useAutoTripIds && (
            <>
              <div style={{alignItems: 'center', display: 'flex'}}>
                <>
                  <FormControl
                    onChange={handleTripPrefixUpdate}
                    placeholder={messages('prefixPlaceholder')}
                    style={{width: '30%', marginRight: '5px'}}
                    type='text'
                    value={autoTripIdPrefix}
                  />
                  -
                  <FormControl
                    onChange={handleIncrementStartUpdate}
                    placeholder={messages('incrementStartPlaceholder')}
                    style={{width: '40%', marginLeft: '5px', marginRight: '5px'}}
                    type='number'
                  />
                  {messages('incrementBy')}
                  <FormControl
                    onChange={handleTripIncrementUpdate}
                    placeholder={messages('incrementAmountPlaceholder')}
                    style={{width: '15%', marginLeft: '5px'}}
                    type='number'
                    value={autoTripIdIncrement}
                  />
                </>
              </div>
              <hr />
            </>
          )}
        </div>
        <div>
          <Checkbox checked={useAutoBlockIds} onChange={handleAutoBlockIDCheckBox}>{messages('automaticallyUpdateBlockIds')}</Checkbox>
          {useAutoBlockIds && (
            <>
              <div style={{alignItems: 'center', display: 'flex'}}>
                <FormControl
                  onChange={handleBlockPrefixUpdate}
                  placeholder={messages('blockIdPrefixPlaceholder')}
                  style={{width: '20%', marginRight: '5px'}}
                  type='text'
                  value={autoBlockIdPrefix}
                />
                {messages('alternateEvery')}
                <FormControl
                  onChange={handleBlockIncrementUpdate}
                  placeholder={messages('blockIncrementPlaceholder')}
                  style={{width: '15%', marginLeft: '5px', marginRight: '5px'}}
                  type='number'
                  value={autoBlockIdIncrement}
                />
                {messages('tripsStartingWith')}
                <FormControl
                  max={autoBlockIdIncrement}
                  min={1}
                  onChange={handleBlockIdStartUpdate}
                  style={{width: '15%', marginLeft: '5px', marginRight: '5px'}}
                  type='number'
                  value={autoBlockIdStart}
                />
              </div>
              <span style={{fontSize: 'smaller'}}>{messages('formatExplanation')}</span>
            </>
          )}
        </div>

      </Body>
      <Footer>
        <Button
          bsStyle='primary'
          disabled={generateTripsDisabled}
          onClick={onClickGenerate}
          title={generateTripsDisabled && messages('disabledTooltip')}
        >
          {messages('generateTrips')}
        </Button>
        <Button
          onClick={_onClose}>
          {messages('close')}
        </Button>
      </Footer>
    </Modal>
  )
}

export default TripSeriesModal
