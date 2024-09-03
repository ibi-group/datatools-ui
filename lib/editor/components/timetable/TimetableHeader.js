// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Button,
  ButtonGroup,
  Col,
  Checkbox,
  FormGroup,
  HelpBlock,
  InputGroup,
  OverlayTrigger,
  Popover,
  Row,
  Tooltip
} from 'react-bootstrap'
import truncate from 'truncate'

import * as activeActions from '../../actions/active'
import * as tripActions from '../../actions/trip'
import OptionButton from '../../../common/components/OptionButton'
import HourMinuteInput from '../HourMinuteInput'
import {getTableById} from '../../util/gtfs'
import {getActiveCalendar, getExceptionBasedCalendars} from '../../util/timetable'
import {getComponentMessages} from '../../../common/util/config'
import type {TripValidationIssues} from '../../selectors/timetable'
import type {Feed, GtfsRoute, Pattern, ServiceCalendar, ScheduleException, ScheduleExceptionCalendar, TripCounts} from '../../../types'
import type {EditorTables, TimetableState} from '../../../types/reducers'

import PatternSelect from './PatternSelect'
import RouteSelect from './RouteSelect'
import CalendarSelect from './CalendarSelect'

type Props = {
  activePattern: Pattern,
  activeScheduleId: string,
  addNewRow: (?boolean, ?boolean) => void,
  cloneSelectedTrips: () => void,
  feedSource: Feed,
  fetchCalendarTripCountsForPattern: typeof tripActions.fetchCalendarTripCountsForPattern,
  fetchTripsForCalendar: typeof tripActions.fetchTripsForCalendar,
  offsetWithDefaults: (boolean) => void,
  removeSelectedRows: () => void,
  route: GtfsRoute,
  saveEditedTrips: (Pattern, string) => void,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setOffset: typeof tripActions.setOffset,
  setScrollIndexes: typeof tripActions.setScrollIndexes,
  showHelpModal: () => void,
  showTripSeriesModal: () => void,
  tableData: EditorTables,
  timetable: TimetableState,
  toggleDepartureTimes: typeof tripActions.toggleDepartureTimes,
  toggleUseSeconds: typeof tripActions.toggleUseSeconds,
  tripCounts: TripCounts,
  tripValidationErrors: TripValidationIssues
}

export default class TimetableHeader extends Component<Props> {
  messages = getComponentMessages('TimetableHeader')

  _onClickAdd = () => this.props.addNewRow(true, true)

  _onClickBack = () => {
    const {activePattern, feedSource, route, setActiveEntity} = this.props
    setActiveEntity(feedSource.id, 'route', route, 'trippattern', activePattern)
  }

  _onClickUndoButton = (e: SyntheticInputEvent<HTMLInputElement>) => {
    const {activePattern, activeScheduleId, feedSource, fetchTripsForCalendar, tableData} = this.props
    const calendars: Array<ServiceCalendar> = getTableById(tableData, 'calendar')
    const scheduleExceptions: Array<ScheduleException> = getTableById(tableData, 'scheduleexception')
    const exceptionBasedCalendars: Array<ScheduleExceptionCalendar> = getExceptionBasedCalendars(scheduleExceptions)
    const activeCalendar = getActiveCalendar(calendars, exceptionBasedCalendars, activeScheduleId)
    if (activeCalendar) {
      fetchTripsForCalendar(feedSource.id, activePattern, activeCalendar.service_id)
    } else console.warn(`Impossible de trouver le calendrier avec le service_id=${activeScheduleId}`)
  }

  _jumpToCell = (rowCol: string) => {
    const cellIndexes = rowCol.split('-')
    if (cellIndexes.length === 2) {
      this.props.setScrollIndexes({scrollToRow: +cellIndexes[0], scrollToColumn: +cellIndexes[1]})
    } else {
      console.warn(`L'adresse de la cellule ${rowCol} est mal-définie.`)
    }
  }

  _onClickSave = () => {
    const {activePattern, activeScheduleId, saveEditedTrips} = this.props
    saveEditedTrips(activePattern, activeScheduleId)
  }

  /**
   * Offset selected trips (subtract offset value if shift key held).
   */
  _onClickOffset = (evt: SyntheticKeyboardEvent<HTMLInputElement>) =>
    this.props.offsetWithDefaults(evt.shiftKey)

  render () {
    const {
      activePattern,
      activeScheduleId,
      cloneSelectedTrips,
      feedSource,
      fetchCalendarTripCountsForPattern,
      removeSelectedRows,
      route,
      setActiveEntity,
      setOffset,
      showHelpModal,
      showTripSeriesModal,
      tableData,
      timetable,
      toggleDepartureTimes,
      toggleUseSeconds,
      tripCounts,
      tripValidationErrors
    } = this.props
    const {edited, hideDepartureTimes, selected, trips, useSecondsInOffset} = timetable
    const calendars: Array<ServiceCalendar> = getTableById(tableData, 'calendar')
    const exceptionBasedCalendars = getExceptionBasedCalendars(getTableById(tableData, 'scheduleexception'))
    const activeCalendar = getActiveCalendar(calendars, exceptionBasedCalendars, activeScheduleId)
    const headerStyle = {
      backgroundColor: 'white'
    }
    const errorCount = Object.keys(tripValidationErrors).length
    const tableType = activePattern && activePattern.useFrequency
      ? this.messages('frequencyEditor')
      : this.messages('timetableEditor')
    const patternName = activePattern && activePattern.name
    const calendarName = activeCalendar && activeCalendar.service_id
    const numberOfTrips = !activePattern || !activeCalendar
      ? 0
      : trips
        ? trips.length
        : 0
    const buttons = [{
      id: 'add',
      tooltip: this.messages('addBlankTrip'),
      props: {
        onClick: this._onClickAdd,
        children: <Icon type='plus' />
      }
    }, {
      id: 'duplicate',
      tooltip: this.messages('duplicateTrips'),
      props: {
        children: <Icon type='clone' />,
        'data-test-id': 'duplicate-trip-button',
        onClick: cloneSelectedTrips
      }
    }, {
      id: 'createSeries',
      tooltip: this.messages('createTripSeries'),
      props: {
        children: <Icon type='calendar-plus-o' />,
        'data-test-id': 'create-trip-series-button',
        disabled: activePattern && activePattern.useFrequency,
        onClick: showTripSeriesModal
      }
    }, {
      id: 'delete',
      tooltip: this.messages('deleteTrips'),
      props: {
        bsStyle: 'danger',
        children: <Icon type='trash' />,
        'data-test-id': 'delete-trip-button',
        disabled: selected.length === 0,
        onClick: removeSelectedRows
      }
    }, {
      id: 'undo',
      tooltip: this.messages('undoChanges'),
      props: {
        disabled: edited.length === 0,
        onClick: this._onClickUndoButton,
        children: <Icon type='undo' />
      }
    }, {
      id: 'save',
      tooltip: this.messages('saveChanges'),
      props: {
        bsStyle: 'primary',
        'data-test-id': 'save-trip-button',
        children: <Icon type='floppy-o' />,
        disabled: edited.length === 0 || errorCount,
        onClick: this._onClickSave
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
              <OverlayTrigger overlay={<Tooltip id='back-to-route'>{this.messages('backToRoute')}</Tooltip>}>
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
              {numberOfTrips} {this.messages('tripsFor')}
              <span title={patternName}>
                {patternName ? this.messages('patternsOn').replace('%truncatedPatternName%', truncate(patternName, 15)) : this.messages('selectPattern')}
              </span>
              <span title={calendarName}>
                {patternName && !calendarName
                  ? this.messages('selectCalendar')
                  : !patternName
                    ? ''
                    : this.messages('calendarName').replace('%truncatedCalendarName%', truncate(calendarName, 13))}
              </span>
            </h4>
          </Col>
          <Col sm={3}>
            {/* Offset number/button */}
            <FormGroup
              className='pull-right'
              style={{
                maxWidth: '150px',
                marginBottom: '0px',
                marginRight: '18px',
                minWidth: '60px'
              }}>
              <InputGroup>
                <HourMinuteInput
                  bsSize='small'
                  seconds={timetable.offset}
                  showSeconds={useSecondsInOffset}
                  onChange={setOffset}
                  standaloneInput={false} />
                <InputGroup.Button>
                  <Button
                    bsSize='small'
                    onClick={this._onClickOffset}>
                    Offset
                  </Button>
                </InputGroup.Button>
              </InputGroup>
              <HelpBlock
                className='pull-right'
                style={{fontSize: '10px', margin: '0px'}}>
                {this.messages('shiftClickToSubtract')}
              </HelpBlock>
            </FormGroup>
            <OverlayTrigger
              trigger='click'
              placement='bottom'
              overlay={
                <Popover
                  id='popover-advanced-settings'
                  title={this.messages('advancedSettings')}>
                  {/* Allow seconds in offset and trip series tools */}
                  <Checkbox
                    defaultChecked={useSecondsInOffset}
                    onChange={toggleUseSeconds}
                  >
                    <OverlayTrigger
                      placement='bottom'
                      overlay={
                        <Tooltip id='use-seconds-in-offset'>
                          {this.messages('useSecondsToolTip')}
                        </Tooltip>
                      }>
                      <small>{this.messages('useSeconds')}</small>
                    </OverlayTrigger>
                  </Checkbox>
                  {/* Hide departures checkbox */}
                  {activePattern && !activePattern.useFrequency
                    ? <Checkbox
                      defaultChecked={hideDepartureTimes}
                      onChange={toggleDepartureTimes}>
                      <OverlayTrigger
                        placement='bottom'
                        overlay={
                          <Tooltip id='hide-departures-check'>
                            {this.messages('hideDepartureTimesTooltip')}
                          </Tooltip>
                        }>
                        <small>{this.messages('hideDepartureTimes')}</small>
                      </OverlayTrigger>
                    </Checkbox>
                    : null
                  }
                </Popover>
              }>
              <Button
                bsSize='small'
                className='pull-right'
                title={this.messages('advancedSettings')}
                bsStyle='link'>
                <Icon type='cog' />
              </Button>
            </OverlayTrigger>
            {'  '}
            <Button
              onClick={showHelpModal}
              bsSize='small'
              className='pull-right'
              title={this.messages('showShortcuts')}
              bsStyle='link'>
              <Icon type='question' />
            </Button>
            {'  '}
            {errorCount
              ? <OverlayTrigger
                placement='left'
                trigger='click'
                overlay={
                  <Popover
                    id='popover-advanced-settings'
                    title={this.messages('numValidationIssues').replace('%errorCount%', errorCount.toString())}>
                    <ul className='list-unstyled small'>
                      {Object.keys(tripValidationErrors)
                        .map(k => {
                          return <li key={k}>
                            <OptionButton
                              bsStyle='link'
                              bsSize='xsmall'
                              value={k}
                              style={{margin: 0, padding: 0}}
                              onClick={this._jumpToCell}>
                              <span className='text-danger'>{this.messages('cellNumber').replace('%cellId%', k)}</span>
                            </OptionButton>{' '}
                            {tripValidationErrors[k].reason}
                          </li>
                        })
                      }
                    </ul>
                  </Popover>
                }>
                <Button
                  bsSize='small'
                  className='pull-right'
                  title={this.messages('validationIssues')}
                  bsStyle='link'>
                  <Icon className='text-warning' type='exclamation-triangle' />
                </Button>
              </OverlayTrigger>
              : null
            }
          </Col>
        </Row>
        <Row style={{marginTop: '5px', marginBottom: '5px'}}>
          {/* Route, pattern, calendar selectors */}
          <Col xs={12} sm={3}>
            <RouteSelect
              feedSource={feedSource}
              route={route}
              routes={getTableById(tableData, 'route')}
              tripCounts={tripCounts}
              setActiveEntity={setActiveEntity} />
          </Col>
          <Col xs={12} sm={3}>
            <PatternSelect
              fetchCalendarTripCountsForPattern={fetchCalendarTripCountsForPattern}
              feedSource={feedSource}
              route={route}
              activePattern={activePattern}
              tripCounts={tripCounts}
              setActiveEntity={setActiveEntity} />
          </Col>
          <Col xs={12} sm={3} data-test-id='calendar-select-container'>
            <CalendarSelect
              activeCalendar={activeCalendar}
              activePattern={activePattern}
              calendars={calendars}
              exceptionBasedCalendars={exceptionBasedCalendars}
              feedSource={feedSource}
              route={route}
              setActiveEntity={setActiveEntity}
              trips={trips}
              tripCounts={tripCounts}
            />
          </Col>
          <Col sm={3}>
            {/* Edit timetable buttons */}
            <ButtonGroup className='pull-right'>
              {buttons.map(button => (
                <OverlayTrigger
                  placement='bottom'
                  key={button.id}
                  overlay={
                    <Tooltip id={`tooltip-${button.id}`}>
                      {button.tooltip}
                    </Tooltip>
                  }>
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
