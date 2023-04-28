// @flow
// $FlowFixMe: Flow doesn't know about useState: https://stackoverflow.com/questions/53105954/cannot-import-usestate-because-there-is-no-usestate-export-in-react-flow-with
import React, {useCallback, useState} from 'react'
import {Button, Modal} from 'react-bootstrap'

import * as tripActions from '../../actions/trip'
import {getComponentMessages} from '../../../common/util/config'
import HourMinuteInput from '../HourMinuteInput'
import type {Trip} from '../../../types'

type Props = {
  addNewTrip: typeof tripActions.addNewTrip,
  constructNewRow: (trip: ?Trip, tripSeriesStartTime: number) => ?Trip,
  onClose: () => void,
  show: boolean
}

const TripSeriesModal = (props: Props) => {
  const [startTime, setStartTime] = useState(null)
  const [headway, setHeadway] = useState(null)
  const [endTime, setEndTime] = useState(null)

  const messages = getComponentMessages('TripSeriesModal')

  const onClickGenerate = useCallback(() => {
    const {addNewTrip, constructNewRow, onClose} = props
    // Check state variables to make flow happy
    if (startTime === null || endTime === null || headway === null) return
    const adjustedEndTime = startTime < endTime ? endTime : endTime + 24 * 60 * 60
    for (let time = startTime; time <= adjustedEndTime; time += headway) {
      addNewTrip(constructNewRow(null, time))
    }
    setStartTime(null)
    setEndTime(null)
    setHeadway(null)
    onClose()
  }, [endTime, startTime, headway])

  const {Body, Footer, Header, Title} = Modal
  const {onClose, show} = props
  const generateTripsDisabled = startTime === null || endTime === null || !headway
  return (
    <Modal show={show} onHide={onClose}>
      <Header><Title>{messages('createTripSeriesQuestion')}</Title></Header>
      <Body>
        <p>{messages('createTripSeriesBody')}</p>
        {messages('startTime')} <div><HourMinuteInput onChange={setStartTime} seconds={startTime} standaloneInput /></div>
        {messages('headway')} <div><HourMinuteInput onChange={setHeadway} seconds={headway} standaloneInput /></div>
        {messages('endTime')} <div><HourMinuteInput onChange={setEndTime} seconds={endTime} standaloneInput /></div>
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
