import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Button, Form, FormControl, FormGroup, ControlLabel } from 'react-bootstrap'
import Select from 'react-select'
import toSentenceCase from 'to-sentence-case'

import ExceptionDate from './ExceptionDate'
import { EXEMPLARS } from '../util'

export default class ScheduleExceptionForm extends Component {
  static propTypes = {
    activeEntity: PropTypes.object,
    updateActiveEntity: PropTypes.func,
    activeComponent: PropTypes.string,
    tableData: PropTypes.object,
    validationErrors: PropTypes.array
  }

  _onAddDate = () => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    const dates = [...activeEntity.dates]
    dates.push(0)
    updateActiveEntity(activeEntity, activeComponent, {dates: dates})
  }

  _onAddedServiceChange = (input) => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    const val = input ? input.map(i => i.value) : null
    updateActiveEntity(activeEntity, activeComponent, {addedService: val})
  }

  _onCustomScheduleChange = (input) => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    const val = input ? input.map(i => i.value) : null
    updateActiveEntity(activeEntity, activeComponent, {customSchedule: val})
  }

  _onExemplarChange = (evt) => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    updateActiveEntity(activeEntity, activeComponent, {exemplar: evt.target.value, customSchedule: null})
  }

  _onNameChange = (evt) => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    updateActiveEntity(activeEntity, activeComponent, {name: evt.target.value})
  }

  _onRemovedServiceChange = (input) => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    const val = input ? input.map(i => i.value) : null
    updateActiveEntity(activeEntity, activeComponent, {removedService: val})
  }

  calendarToOption = calendar => ({
    value: calendar.id,
    label: calendar.description,
    calendar
  })

  render () {
    const {
      activeEntity,
      tableData,
      validationErrors
    } = this.props

    return (
      <div>
        <Form>
          <FormGroup
            controlId={`name`}
            validationState={validationErrors.find(e => e.field === 'name') ? 'error' : undefined}
            className={`col-xs-12`}>
            <ControlLabel><small>Exception name*</small></ControlLabel>
            <FormControl
              value={activeEntity && activeEntity.name}
              placeholder='Thanksgiving Day'
              onChange={this._onNameChange} />
          </FormGroup>
          <FormGroup
            controlId={`schedule`}
            validationState={validationErrors.find(e => e.field === 'exemplar') ? 'error' : undefined}
            className={`col-xs-12`}>
            <ControlLabel><small>Run the following schedule:</small></ControlLabel>
            <FormControl componentClass='select'
              value={(activeEntity && activeEntity.exemplar) || ''}
              onChange={this._onExemplarChange}>
              <option value='' disabled>-- Select exception type --</option>
              {EXEMPLARS.map(exemplar => {
                return (
                  <option value={exemplar} key={exemplar}>
                    {exemplar === 'SWAP'
                      ? 'Swap, add, or remove'
                      : toSentenceCase(exemplar)
                    }
                  </option>
                )
              })}
            </FormControl>
          </FormGroup>
          {activeEntity && activeEntity.exemplar === 'CUSTOM'
            ? <FormGroup
              controlId={`custom`}
              className={`col-xs-12`}>
              <ControlLabel><small>Select calendar to run*</small></ControlLabel>
              <Select
                placeholder='Select calendar...'
                clearable
                multi
                value={activeEntity && activeEntity.customSchedule}
                onChange={this._onCustomScheduleChange}
                options={tableData.calendar
                  ? tableData.calendar.map(this.calendarToOption)
                  : []
                } />
            </FormGroup>
            : null
          }
          {activeEntity && activeEntity.exemplar === 'SWAP'
            ? <FormGroup
              controlId={`custom`}
              className={`col-xs-12`}>
              <ControlLabel><small>Select calendars to add (optional):</small></ControlLabel>
              <Select
                placeholder='Select calendar...'
                clearable
                multi
                value={activeEntity && activeEntity.addedService}
                onChange={this._onAddedServiceChange}
                options={tableData.calendar
                  ? tableData.calendar
                    .filter(cal => !activeEntity.removedService || activeEntity.removedService.indexOf(cal.id) === -1)
                    .map(this.calendarToOption)
                  : []
              } />
              <ControlLabel><small>Select calendars to remove (optional):</small></ControlLabel>
              <Select
                placeholder='Select calendar...'
                clearable
                multi
                value={activeEntity && activeEntity.removedService}
                onChange={this._onRemovedServiceChange}
                options={tableData.calendar
                  ? tableData.calendar
                    .filter(cal => !activeEntity.addedService || activeEntity.addedService.indexOf(cal.id) === -1)
                    .map(this.calendarToOption)
                  : []
              } />
            </FormGroup>
            : null
          }
          <FormGroup
            controlId={`exception-dates`}
            validationState={validationErrors.find(e => e.field === 'dates') ? 'error' : undefined}
            className={`col-xs-12`}>
            <ControlLabel><small>On these dates*</small></ControlLabel>
            {activeEntity && activeEntity.dates.length
              ? activeEntity.dates.map((date, index) => (
                <ExceptionDate
                  index={index}
                  key={index}
                  date={date}
                  isNotValid={validationErrors.find(e => e.field === `dates-${index}`)}
                  {...this.props} />
              )
            )
          : <div>No dates specified</div>
        }
          </FormGroup>
          <div className={`col-xs-12`}>
            <Button
              onClick={this._onAddDate}>
              <Icon type='plus' /> Add date
            </Button>
          </div>
        </Form>
      </div>
    )
  }
}
