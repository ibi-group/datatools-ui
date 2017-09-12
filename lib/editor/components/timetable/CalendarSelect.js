import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Label } from 'react-bootstrap'
import Select from 'react-select'

export default class CalendarSelect extends Component {
  static propTypes = {
    activePattern: PropTypes.object,
    route: PropTypes.object,
    feedSource: PropTypes.object,
    activeCalendar: PropTypes.object,
    calendars: PropTypes.array,
    setActiveEntity: PropTypes.func,
    trips: PropTypes.array
  }

  _optionRenderer = (option) => {
    const {activePattern} = this.props
    const patternTrips = (activePattern && activePattern.tripCountByCalendar[option.value]) || 0
    const routeCount = Object.keys(option.calendar.routes).length
    return (
      <span title={`${option.label} (${option.service_id})`}>
        <Icon type='calendar-o' /> {option.label}
        {' '}
        <Label
          bsStyle={patternTrips ? 'success' : 'default'}
          title={`Calendar has ${patternTrips} trips for pattern and ${option.routeTrips} for route`}>
          <Icon type='bars' /> {patternTrips}/{option.routeTrips}
        </Label>
        {' '}
        <Label
          title={`Calendar has trips for ${routeCount} routes`}>
          <Icon type='bus' /> {routeCount}
        </Label>
        {' '}
        <Label
          title={`Calendar has ${option.totalTrips} trips for feed`}>
          <Icon type='building-o' /> {option.totalTrips}
        </Label>
      </span>
    )
  }

  _onChange = (value) => {
    const {activePattern, feedSource, route, setActiveEntity} = this.props
    const calendar = value && value.calendar
    setActiveEntity(feedSource.id, 'route', route, 'trippattern', activePattern, 'timetable', calendar)
  }

  render () {
    const { activePattern, route, activeCalendar, calendars, trips } = this.props
    const options = calendars && route
      ? calendars.sort((a, b) => {
        if (route.id in a.routes && !(route.id in b.routes)) return -1
        else if (route.id in b.routes && !(route.id in a.routes)) return 1
        else return b.numberOfTrips - a.numberOfTrips
      }).map(calendar => {
        return {
          label: calendar.description,
          value: calendar.id,
          service_id: calendar.service_id,
          calendar,
          totalTrips: calendar.numberOfTrips,
          routeTrips: calendar.routes[route.id] || 0,
          calendarTrips: trips.length
        }
      })
      : []
    return (
      <Select
        value={activeCalendar && activeCalendar.id}
        placeholder={<span><Icon type='calendar-o' /> Select calendar...</span>}
        valueRenderer={this._optionRenderer}
        optionRenderer={this._optionRenderer}
        disabled={!activePattern || activePattern.id === 'new'}
        options={options}
        onChange={this._onChange}
        filterOptions />
    )
  }
}
