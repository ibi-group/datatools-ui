// @flow
// $FlowFixMe: Flow doesn't know about useState: https://stackoverflow.com/questions/53105954/cannot-import-usestate-because-there-is-no-usestate-export-in-react-flow-with
import React, {useCallback, useState} from 'react'
import {Button, Checkbox, FormControl, Modal} from 'react-bootstrap'

import * as tripActions from '../../actions/trip'
import {getComponentMessages} from '../../../common/util/config'
import HourMinuteInput from '../HourMinuteInput'
import type {Trip} from '../../../types'

type Props = {
  addNewTrip: typeof tripActions.addNewTrip,
  constructNewRow: (trip: ?Trip, tripSeriesStartTime: ?number, autoTripId: ?string) => ?Trip,
  onClose: () => void,
  show: boolean,
  useSecondsInOffset: boolean
}

const TripSeriesModal = (props: Props) => {
  const [startTime, setStartTime] = useState(null)
  const [headway, setHeadway] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [useAutoTripIds, setUseAutoTripIds] = useState(false)
  const [autoTripIdStart, setAutoTripIdStart] = useState(0)
  const [autoTripIdIncrement, setAutoTripIdIncrement] = useState(1)
  const [autoTripIdPrefix, setAutoTripIdPrefix] = useState('')

  const messages = getComponentMessages('TripSeriesModal')

  const handleIncrementStartUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setAutoTripIdStart(+evt.target.value)
  const handleTripPrefixUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setAutoTripIdPrefix(evt.target.value)
  const handleTripIncrementUpdate = (evt: SyntheticInputEvent<HTMLInputElement>) => setAutoTripIdIncrement(+evt.target.value)
  const handleCheckBox = () => setUseAutoTripIds(!useAutoTripIds)

  const onClickGenerate = useCallback(() => {
    const {addNewTrip, constructNewRow, onClose} = props
    // Check state variables to make flow happy
    if (startTime === null || endTime === null || headway === null) return
    const adjustedEndTime = startTime < endTime ? endTime : endTime + 24 * 60 * 60

    let tripId = autoTripIdStart
    for (let time = startTime; time <= adjustedEndTime; time += headway) {
      // If we're upating the trip IDs automatically, increment the trip ID:
      addNewTrip(constructNewRow(null, time, useAutoTripIds ? `${autoTripIdPrefix}-${tripId}` : null))
      if (useAutoTripIds) tripId += autoTripIdIncrement
    }
    setStartTime(null)
    setEndTime(null)
    setHeadway(null)
    onClose()
  }, [endTime, startTime, headway, autoTripIdStart, autoTripIdIncrement, autoTripIdPrefix])

  const {Body, Footer, Header, Title} = Modal
  const {onClose, show, useSecondsInOffset} = props
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
            {messages('startTime')
            }<HourMinuteInput onChange={setStartTime} seconds={startTime} showSeconds={useSecondsInOffset} standaloneInput />
          </div>
          <div style={{marginLeft: '20px'}}>
            {messages('headway')}
            <HourMinuteInput onChange={setHeadway} seconds={headway} showSeconds={useSecondsInOffset} standaloneInput />
          </div>
          <div style={{margin: '0px 0px 0px 20px'}}>
            {messages('endTime')}
            <HourMinuteInput onChange={setEndTime} seconds={endTime} showSeconds={useSecondsInOffset} standaloneInput />
          </div>
        </div>
        <div>
          <Checkbox checked={useAutoTripIds} onChange={handleCheckBox}>{messages('automaticallyUpdateTripIds')}</Checkbox>
          <div style={{
            alignItems: 'center',
            display: 'flex'
          }}>
            {useAutoTripIds &&
              <>
                <FormControl
                  onChange={handleTripPrefixUpdate}
                  placeholder={messages('prefixPlaceholder')}
                  style={{width: '30%', marginRight: '5px'}}
                  type='text'
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
            }
          </div>
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
          onClick={onClose}>
          {messages('close')}
        </Button>
      </Footer>
    </Modal>
  )
}

export default TripSeriesModal
