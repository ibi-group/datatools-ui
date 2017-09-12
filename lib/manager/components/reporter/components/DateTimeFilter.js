import React, { Component, PropTypes } from 'react'
import { Row, Col, FormControl, Alert } from 'react-bootstrap'
import moment from 'moment'
import DateTimeField from 'react-bootstrap-datetimepicker'

const timeOptions = [
  {
    label: 'Morning peak (6am - 9am)',
    from: 60 * 60 * 6,
    to: 60 * 60 * 9
  },
  {
    label: 'Midday peak (11am - 2pm)',
    from: 60 * 60 * 11,
    to: 60 * 60 * 14
  },
  {
    label: 'Afternoon peak (4pm - 7pm)',
    from: 60 * 60 * 16,
    to: 60 * 60 * 19
  },
  {
    label: 'Evening service (7pm - 10pm)',
    from: 60 * 60 * 19,
    to: 60 * 60 * 22
  },
  {
    label: '24 hours (12am - 11:59pm)',
    from: 0,
    to: (60 * 60 * 24) - 1 // 86399
  }
]

export default class DateTimeFilter extends Component {
  static propTypes = {
    onChange: PropTypes.func,
    dateTime: PropTypes.object,
    version: PropTypes.object,

    updateDateTimeFilter: PropTypes.func
  }

  static defaultProps = {
    dateTime: {date: null, from: null, to: null}
  }

  _onChangeDateTime = (millis) => {
    const date = moment(+millis).format('YYYY-MM-DD')
    this.props.updateDateTimeFilter({date})
    this.props.onChange && this.props.onChange({date})
  }

  _onChangeTimeRange = (evt) => {
    const fromTo = evt.target.value.split('-')
    const from = +fromTo[0]
    const to = +fromTo[1]
    this.props.updateDateTimeFilter({from, to})
    this.props.onChange && this.props.onChange({from, to})
  }

  render () {
    const {dateTime, version} = this.props
    const dateTimeProps = {
      mode: 'date',
      dateTime: dateTime.date ? +moment(dateTime.date, 'YYYY-MM-DD') : +moment(),
      onChange: this._onChangeDateTime
    }
    if (!dateTime.date) {
      dateTimeProps.defaultText = 'Please select a date'
    }
    const validDate = version && moment(dateTime.date).isBetween(version.validationSummary.startDate, version.validationSummary.endDate)
    // console.log(validDate, this.props, moment(dateTime.date).isBetween(version.validationSummary.startDate, version.validationSummary.endDate))
    return (
      <div>
        <Row>
          <Col xs={12} md={3} mdOffset={3} style={{paddingTop: '10px'}}>
            <DateTimeField
              {...dateTimeProps} />
          </Col>
          <Col xs={12} md={3} style={{paddingTop: '10px'}}>
            <FormControl
              componentClass='select'
              placeholder='Select time range'
              value={`${dateTime.from}-${dateTime.to}`}
              onChange={this._onChangeTimeRange}>
              {timeOptions.map((t, i) => {
                return <option key={i} value={`${t.from}-${t.to}`}>{t.label}</option>
              })}
            </FormControl>
          </Col>
        </Row>
        {!validDate
          ? <Row>
            <Col xs={12} md={6} mdOffset={3} style={{paddingTop: '10px'}}>
              <Alert bsStyle='danger'>
                <span><strong>Warning!</strong> Chosen date is outside of valid date range for feed version.</span>
              </Alert>
            </Col>
          </Row>
          : null
        }
      </div>
    )
  }
}
