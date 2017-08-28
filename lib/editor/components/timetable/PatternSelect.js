import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Label } from 'react-bootstrap'
import Select from 'react-select'

import { getEntityName } from '../../util/gtfs'

export default class PatternSelect extends Component {
  static propTypes = {
    activePattern: PropTypes.object,
    route: PropTypes.object,
    feedSource: PropTypes.object,
    calendars: PropTypes.array,
    setActiveEntity: PropTypes.func
  }

  _optionRenderer = (option) => {
    const calendarCount = Object.keys(option.pattern.tripCountByCalendar).length
    return (
      <span title={option.label}>
        <Icon type='code-fork' /> {option.label}
        {' '}
        <Label
          title={`Pattern has ${option.pattern.numberOfTrips} trips`}>
          <Icon type='bars' /> {option.pattern.numberOfTrips}
        </Label>
        {' '}
        <Label
          title={`Pattern has trips for ${calendarCount} calendars`}>
          <Icon type='calendar-o' /> {calendarCount}
        </Label>
      </span>
    )
  }

  _onChange = (value) => {
    const {feedSource, route, setActiveEntity} = this.props
    const pattern = value ? value.pattern : {id: 'new'}
    setActiveEntity(feedSource.id, 'route', route, 'trippattern', pattern, 'timetable', null)
  }

  render () {
    const {activePattern, route} = this.props
    const patterns = route && route.tripPatterns ? route.tripPatterns : []
    return (
      <Select
        value={activePattern && activePattern.id}
        component={'pattern'}
        valueRenderer={this._optionRenderer}
        optionRenderer={this._optionRenderer}
        placeholder={<span><Icon type='code-fork' /> Select pattern...</span>}
        options={patterns.map(pattern => (
          {
            value: pattern.id,
            label: `${getEntityName(pattern)}` || '[Unnamed]',
            pattern
          }))
        }
        onChange={this._onChange} />
    )
  }
}
