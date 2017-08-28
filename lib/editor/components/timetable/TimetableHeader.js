import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { InputGroup, Col, Row, Checkbox, Button, Form, OverlayTrigger, Tooltip, ButtonGroup } from 'react-bootstrap'
import truncate from 'truncate'

import HourMinuteInput from '../HourMinuteInput'
import CalendarSelect from './CalendarSelect'
import RouteSelect from './RouteSelect'
import PatternSelect from './PatternSelect'
import {getConfigProperty} from '../../../common/util/config'

export default class TimetableHeader extends Component {
  static propTypes = {
    feedSource: PropTypes.object
    // timetable, setOffset, offsetRows, toggleDepartureTimes, addNewRow, removeSelectedRows, saveEditedTrips, route, tableData, activeScheduleId, activePattern, setActiveEntity, fetchTripsForCalendar, duplicateRows
  }

  _onClickAdd = () => this.props.addNewRow(true, true)

  _onClickClone = () => {
    const {duplicateRows, timetable} = this.props
    const {selected, trips} = timetable
    // if no rows selected, duplicate last
    // TODO: should this duplicate row in which cursor lies?
    if (selected.length === 0) {
      duplicateRows([trips.length - 1])
    } else {
      duplicateRows(selected)
    }
  }

  _onClickBack = () => {
    const {activePattern, feedSource, route, setActiveEntity} = this.props
    setActiveEntity(feedSource.id, 'route', route, 'trippattern', activePattern)
  }

  _onClickUndoButton = (e) => {
    const {activePattern, activeScheduleId, feedSource, fetchTripsForCalendar, tableData} = this.props
    const calendars = tableData.calendar || []
    const activeCalendar = calendars.find(c => c.id === activeScheduleId)
    fetchTripsForCalendar(feedSource.id, activePattern, activeCalendar.id)
  }

  _onClickSave = () => {
    const {activePattern, activeScheduleId, saveEditedTrips} = this.props
    saveEditedTrips(activePattern, activeScheduleId)
  }

  _onClickOffset = () => {
    const {offsetRows, timetable} = this.props
    const {selected, trips, offset} = timetable
    if (selected.length > 0) {
      offsetRows({rowIndexes: selected, offset})
    } else {
      // if no rows selected, offset last row
      offsetRows({rowIndexes: [trips.length - 1], offset})
    }
  }

  render () {
    const {feedSource, timetable, setOffset, toggleDepartureTimes, removeSelectedRows, route, tableData, activeScheduleId, activePattern, setActiveEntity} = this.props
    const {selected, trips, hideDepartureTimes, edited} = timetable
    const calendars = tableData.calendar || []
    const activeCalendar = calendars.find(c => c.id === activeScheduleId)
    const headerStyle = {
      backgroundColor: 'white'
    }
    const tableType = activePattern && activePattern.useFrequency
      ? 'Frequency editor'
      : 'Timetable editor'
    const patternName = activePattern && activePattern.name
    const calendarName = activeCalendar && activeCalendar.service_id
    const numberOfTrips = trips ? trips.length : 0
    const buttons = [{
      id: 'add',
      tooltip: 'Add blank trip',
      props: {
        onClick: this._onClickAdd,
        children: <Icon type='plus' />
      }
    }, {
      id: 'duplicate',
      tooltip: 'Duplicate trips',
      props: {
        onClick: this._onClickClone,
        children: <Icon type='clone' />
      }
    }, {
      id: 'delete',
      tooltip: 'Delete trips',
      props: {
        disabled: selected.length === 0,
        onClick: removeSelectedRows,
        bsStyle: 'danger',
        children: <Icon type='trash' />
      }
    }, {
      id: 'undo',
      tooltip: 'Undo changes',
      props: {
        disabled: edited.length === 0,
        onClick: this._onClickUndoButton,
        children: <Icon type='undo' />
      }
    }, {
      id: 'save',
      tooltip: 'Save changes',
      props: {
        disabled: edited.length === 0,
        onClick: this._onClickSave,
        bsStyle: 'primary',
        children: <Icon type='floppy-o' />
      }
    }]
    return (
      <div
        className='timetable-header'
        style={headerStyle}>
        <Row style={{marginTop: '20px'}}>
          <Col sm={3}>
            <h3 style={{margin: '0px'}}>
              {/* Back button */}
              <OverlayTrigger overlay={<Tooltip id='back-to-route'>Back to route</Tooltip>}>
                <Button
                  bsSize='small'
                  style={{marginTop: '-5px'}}
                  onClick={this._onClickBack}>
                  <Icon type='reply' />
                </Button>
              </OverlayTrigger>
              <span style={{marginLeft: '10px'}}><Icon type='calendar' /> {tableType}</span>
            </h3>
          </Col>
          <Col sm={6}>
            {/* title, etc. */}
            <h4 style={{margin: '0px', marginTop: '5px'}}>
              {numberOfTrips} trips for
              {' '}
              <span title={patternName}>{truncate(patternName, 15)}</span> on
              {' '}
              <span title={calendarName}>{truncate(calendarName, 13)}</span> calendar
            </h4>
          </Col>
          <Col sm={3}>
            <Form
              inline
              className='pull-right'>
              {/* Hide departures check */}
              {activePattern && !activePattern.useFrequency && getConfigProperty('application.dev')
                ? <Checkbox
                  value={hideDepartureTimes}
                  onChange={toggleDepartureTimes}>
                  <OverlayTrigger
                    placement='bottom'
                    overlay={<Tooltip id='hide-departures-check'>Hiding departure times will keep arrival and departure times in sync. WARNING: do not use if arrivals and departures differ.</Tooltip>}>
                    <small> Hide departures</small>
                  </OverlayTrigger>
                </Checkbox>
                : null
              }
              {'  '}
              {/* Offset number/button */}
              <InputGroup>
                <HourMinuteInput
                  ref='offsetInput'
                  bsSize='small'
                  style={{width: '65px'}}
                  onChange={setOffset} />
                <InputGroup.Button>
                  <Button
                    bsSize='small'
                    onClick={this._onClickOffset}>
                    Offset
                  </Button>
                </InputGroup.Button>
              </InputGroup>
            </Form>
          </Col>
        </Row>
        <Row style={{marginTop: '5px', marginBottom: '5px'}}>
          {/* Route, pattern, calendar selectors */}
          <Col xs={12} sm={3}>
            <RouteSelect
              feedSource={feedSource}
              route={route}
              routes={tableData.route}
              setActiveEntity={setActiveEntity} />
          </Col>
          <Col xs={12} sm={3}>
            <PatternSelect
              feedSource={feedSource}
              route={route}
              activePattern={activePattern}
              setActiveEntity={setActiveEntity} />
          </Col>
          <Col xs={12} sm={3}>
            <CalendarSelect
              activePattern={activePattern}
              route={route}
              feedSource={feedSource}
              activeCalendar={activeCalendar}
              calendars={calendars}
              setActiveEntity={setActiveEntity}
              trips={trips} />
          </Col>
          <Col sm={3}>
            {/* Edit timetable buttons */}
            <ButtonGroup className='pull-right'>
              {buttons.map(button => (
                <OverlayTrigger
                  placement='bottom'
                  key={button.id}
                  overlay={<Tooltip id={`tooltip-${button.id}`}>{button.tooltip}</Tooltip>}>
                  <Button
                    bsSize='small'
                    {...button.props} />
                </OverlayTrigger>
              ))}
            </ButtonGroup>
          </Col>
        </Row>
      </div>
    )
  }
}
