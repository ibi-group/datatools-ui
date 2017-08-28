import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Button} from 'react-bootstrap'
import DateTimeField from 'react-bootstrap-datetimepicker'
import moment from 'moment'

export default class ExceptionDate extends Component {
  static propTypes = {
    activeEntity: PropTypes.object,
    date: PropTypes.any,
    isNotValid: PropTypes.bool,
    updateActiveEntity: PropTypes.func,
    activeComponent: PropTypes.string,
    index: PropTypes.number
  }

  _onDateChange = (millis) => {
    const {activeComponent, activeEntity, index, updateActiveEntity} = this.props
    const dates = [...activeEntity.dates]
    dates[index] = moment(+millis).format('YYYYMMDD')
    updateActiveEntity(activeEntity, activeComponent, {dates})
  }

  _onRemoveDate = () => {
    const {activeComponent, activeEntity, index, updateActiveEntity} = this.props
    const dates = [...activeEntity.dates]
    dates.splice(index, 1)
    updateActiveEntity(activeEntity, activeComponent, {dates: dates})
  }

  render () {
    const {date, index, isNotValid} = this.props
    const dateTimeProps = {
      mode: 'date',
      dateTime: date ? +moment(date) : +moment(),
      onChange: this._onDateChange
    }
    if (!date) {
      dateTimeProps.defaultText = 'Please select a date'
    }
    return (
      <div
        key={index}
        style={{position: 'relative', width: '100%', marginBottom: '5px'}}>
        <Button
          bsStyle='danger'
          className='pull-right'
          style={{marginLeft: '5px'}}
          key={`date-remove-${index}`}
          onClick={this._onRemoveDate}>
          <Icon type='times' />
        </Button>
        <DateTimeField
          key={`date-${index}`}
          mode='date'
          {...dateTimeProps} />
        {isNotValid && date
          ? <small>
            {moment(date).format('MM/DD/YYYY')} appears in another schedule exception. Please choose another date.
          </small>
          : null
        }
      </div>
    )
  }
}
