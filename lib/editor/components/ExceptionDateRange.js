// @flow

import React, {Component} from 'react'
import {DropdownButton, FormGroup, MenuItem} from 'react-bootstrap'
import DateTimeField from 'react-bootstrap-datetimepicker'
import moment from 'moment'

import {updateActiveGtfsEntity} from '../actions/active'
import {modifyRangeOfDates, updateDates} from '../../common/util/exceptions'
import type {ExceptionDate, ScheduleException, ScheduleExceptionDateRange} from '../../types'

import {inputStyleProps} from './ExceptionDate'

type Props = {
  activeComponent: string,
  activeEntity: ScheduleException,
  index: number,
  range: ScheduleExceptionDateRange,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  validationState: string
}

type State = {
  forceErrorState: boolean
}

export const sortDates = (dates: Array<ExceptionDate>): void => { dates.sort((a, b) => moment(a).diff(moment(b))) }

export default class ExceptionDateRange extends Component<Props, State> {
  state = {
    forceErrorState: false
  }

  // This is kept as an arrow function in order to access the component's `this`
  _onRangeUpdate = (millis: number | string, isStartDate: boolean) => {
    if (millis === 'Invalid date') return // Invalid date thrown from Datetimepicker is usually caused by typing
    const {activeComponent, activeEntity, range, updateActiveGtfsEntity} = this.props
    const {endDate, startDate} = range

    const newRangeBoundary = moment(+millis)
    const startMoment = moment(startDate)
    const endMoment = moment(endDate)

    // This prevents the user from inputting invalid data. Validation is not required since this behaviour
    // is fully prevented (see also use of minDate and maxDate in DateTimePickers)
    if (
      (isStartDate && (isStartDate && newRangeBoundary.diff(endMoment) > 0)) ||
      (!isStartDate && newRangeBoundary.diff(startMoment) < 0)
    ) {
      // You should stop typing and have hit an incorrect date and we should flag the entry as incorrect
      // All we really need to do is set the validation state to be an error.
      this.setState({forceErrorState: true})
      return
    }
    // If we've made it here, our date is valid and so we should not override validation
    // TODO: add rest of method to callback in case state does not update?
    this.setState({forceErrorState: false}, () => {
      // Filter out new dates (0s), add them back in later to preserve new dates in final array
      const newDates = activeEntity.dates.filter(date => typeof date === 'number')
      let dates = activeEntity.dates.filter(date => typeof date === 'string')

      // Check the updated bounds are larger than before then add or remove dates accordingly.
      // $FlowFixMe: Flow doesn't recognise array filter above.
      dates = updateDates(isStartDate, newRangeBoundary, dates, startMoment, endMoment)

      // We need to sort the dates before update so that indices are maintained for validation.
      sortDates(dates)

      updateActiveGtfsEntity({
        component: activeComponent,
        entity: activeEntity,
        props: {dates: [...dates, ...newDates]}
      })
    })
  }

  _onSelect = (key: string) => {
    const {activeComponent, activeEntity, range, updateActiveGtfsEntity} = this.props
    let dates = [...activeEntity.dates]

    const newDates = activeEntity.dates.filter(date => typeof date === 'number')
    // $FlowFixMe Flow does not recognize filtering on typeof
    dates = (dates.filter(date => typeof date === 'string'): Array<string>)

    const startMoment = moment(range.startDate)
    const endMoment = moment(range.endDate)
    const deleteStart = key === 'range' ? startMoment : startMoment.add(1, 'days') // Preserve the first day if deleting only the end date

    dates = modifyRangeOfDates(dates, endMoment, deleteStart, true)

    // We need to sort the dates before update so that indices are maintained for valdiation.
    sortDates(dates)

    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {dates: [...dates, ...newDates]}
    })
  }

  render () {
    const {index, range, validationState} = this.props
    const endMoment = range.endDate ? moment(range.endDate) : moment(range.startDate).add(1, 'days')
    const startMoment = range.startDate ? moment(range.startDate) : undefined

    const dateTimeProps = {
      defaultText: undefined,
      mode: 'date',
      size: 'sm',
      style: {gridColumn: 'span 5'}
    }

    return (
      // Validation state override allows for control of input before date
      <FormGroup
        key={index}
        style={{
          display: 'grid',
          gridGap: '5px',
          gridTemplateColumns: 'repeat(12, 1fr)',
          marginBottom: '5px',
          textAlign: 'center'
        }}
        validationState={validationState === 'error' || this.state.forceErrorState ? 'error' : 'success'}
      >
        <div
          className='exception-date-picker'
          data-test-id={`exception-date-range-${index}-1`} // First range input
          style={{gridColumn: 'span 5'}}
        >
          <DateTimeField
            className='date-range'
            dateTime={startMoment}
            inputProps={{style: inputStyleProps}}
            // The maxDate API subtracts a day from the maxDate, see:
            // https://github.com/quri/react-bootstrap-datetimepicker/commit/eb5f700267d0cf945abfdac3a4f7ca879b314e70
            maxDate={endMoment.clone().subtract(1, 'day')}
            onChange={(millis) => this._onRangeUpdate(millis, true)}
            {...dateTimeProps}
          />
        </div>
        <i className='fa fa-minus' style={{gridColumn: 'span 1', placeSelf: 'center '}} />
        <div
          className='exception-date-picker'
          data-test-id={`exception-date-range-${index}-2`} // Second range input
          style={{gridColumn: 'span 5'}}
        >
          <DateTimeField
            className='date-range'
            dateTime={endMoment}
            inputProps={{style: dateTimeProps}}
            minDate={startMoment && startMoment.clone().startOf('day').add(2, 'days')} // See above, minDate subtracts an extra day.
            onChange={(millis) => this._onRangeUpdate(millis, false)}
            {...dateTimeProps}
          />
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <DropdownButton
            bsStyle='danger'
            id={`date-remove-${index}`}
            key={`date-remove-${index}`}
            onSelect={this._onSelect}
            pullRight
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: '2',
              padding: '7px 6px'
            }}
            title={<i className='fa fa-times' />}
          >
            <MenuItem eventKey='range'>Delete range</MenuItem>
            <MenuItem eventKey='end-date'>Delete end date</MenuItem>
          </DropdownButton>
        </div>
        {validationState === 'error' && startMoment && endMoment
          ? <small style={{gridColumn: 'span 12'}}>
            One or more dates between {startMoment.format('MM/DD/YYYY')} and {endMoment.format('MM/DD/YYYY')} appears in another schedule exception. Please choose another date.
          </small>
          : null
        }
      </FormGroup>
    )
  }
}
