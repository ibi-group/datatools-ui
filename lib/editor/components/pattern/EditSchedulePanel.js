import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Button, FormGroup, ControlLabel, ButtonGroup, DropdownButton, MenuItem} from 'react-bootstrap'

import OptionButton from '../../../common/components/OptionButton'

const DIRECTIONS = [0, 1]

export default class EditSchedulePanel extends Component {
  static propTypes = {
    feedSource: PropTypes.object
  }

  _editTimetables = () => {
    const {setActiveEntity, feedSource, activeEntity, activePattern} = this.props
    setActiveEntity(feedSource.id, 'route', activeEntity, 'trippattern', activePattern, 'timetable')
  }

  _onChangeDirection = (patternDirection) => {
    this.props.updateActiveEntity(this.props.activePattern, 'trippattern', {patternDirection})
    this.props.saveActiveEntity('trippattern')
  }

  _onChangeUseFrequency = (key) => {
    const useFrequency = key !== 'timetables'
    const other = key === 'timetables' ? 'frequencies' : 'timetables'
    this.props.showConfirmModal({
      title: `Use ${key} for ${this.props.activePattern.name}?`,
      body: `Are you sure you want to use ${key} for this trip pattern? Any trips created using ${other} will be lost.`,
      onConfirm: () => {
        this.props.updateActiveEntity(this.props.activePattern, 'trippattern', {useFrequency})
        this.props.saveActiveEntity('trippattern')
      }
    })
  }

  render () {
    const { activePattern, activePatternId } = this.props
    const timetableOptions = [
      <span><Icon type='table' /> Use timetables</span>,
      <span><Icon type='clock-o' /> Use frequencies</span>
    ]
    const editSchedulesDisabled = activePatternId === 'new' ||
      (activePattern && activePattern.patternStops && activePattern.patternStops.length === 0)
    return (
      <div>
        <h4 className='line'>
          Schedules {`(${activePattern.numberOfTrips} trip${activePattern.numberOfTrips !== 1 ? 's' : ''})`}
        </h4>
        <FormGroup style={{marginTop: '5px'}}>
          <ButtonGroup className='pull-right'>
            <DropdownButton
              onSelect={this._onChangeUseFrequency}
              pullRight
              style={{width: '170px'}}
              bsSize='small'
              title={activePattern.useFrequency ? timetableOptions[1] : timetableOptions[0]}
              id='frequency-dropdown'>
              <MenuItem
                eventKey={activePattern.useFrequency ? 'timetables' : 'frequencies'}>
                {activePattern.useFrequency ? timetableOptions[0] : timetableOptions[1]}
              </MenuItem>
            </DropdownButton>
          </ButtonGroup>
          <ControlLabel style={{marginTop: '3px'}}><small>Type</small></ControlLabel>
        </FormGroup>
        <FormGroup style={{marginTop: '5px'}}>
          <ButtonGroup className='pull-right'>
            {DIRECTIONS.map(dir => (
              <OptionButton
                key={dir}
                active={activePattern.patternDirection === dir}
                value={dir}
                bsSize='small'
                style={{width: '85px'}}
                name={dir}
                title={dir === 0 ? 'Outbound (0)' : 'Inbound (1)'}
                onClick={this._onChangeDirection}>
                <Icon type={dir === 0 ? 'sign-out' : 'sign-in'} />
              </OptionButton>
            ))}
          </ButtonGroup>
          <ControlLabel><small>Direction</small></ControlLabel>
        </FormGroup>
        <Button
          disabled={editSchedulesDisabled}
          title={editSchedulesDisabled ? `Must add stops to pattern before editing schedules for ${activePattern.name}` : `Edit schedules for ${activePattern.name}`}
          block
          bsSize='small'
          onClick={this._editTimetables}>
          <Icon type='calendar' /> Edit schedules
        </Button>
      </div>
    )
  }
}
