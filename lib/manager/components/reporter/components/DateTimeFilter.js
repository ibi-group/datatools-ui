// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Alert, Col, ControlLabel, FormControl, Row } from 'react-bootstrap'
import moment from 'moment'
import DateTimeField from 'react-bootstrap-datetimepicker'

import * as filterActions from '../../../../gtfs/actions/filter'

import type {Props as ContainerProps} from '../containers/ActiveDateTimeFilter'
import type {DateTimeFilter as DateTimeFilterState} from '../../../../types/reducers'

type Props = ContainerProps & {
  dateTime: DateTimeFilterState,
  updateDateTimeFilter: typeof filterActions.updateDateTimeFilter
}

const timeOptions = [
  {
    label: 'Todo el día (12 am - 4 am del día siguiente)',
    from: 0,
    to: 60 * 60 * 28
  },
  {
    label: 'Pico de la mañana (6am - 9am)',
    from: 60 * 60 * 6,
    to: 60 * 60 * 9
  },
  {
    label: 'Pico del mediodía (11am - 2pm)',
    from: 60 * 60 * 11,
    to: 60 * 60 * 14
  },
  {
    label: 'Pico de la tarde (4pm - 7pm)',
    from: 60 * 60 * 16,
    to: 60 * 60 * 19
  },
  {
    label: 'Servicio de la tarde (7pm - 10pm)',
    from: 60 * 60 * 19,
    to: 60 * 60 * 22
  },
  {
    label: '24 horas (12am - 11:59pm)',
    from: 0,
    to: (60 * 60 * 24) - 1 // 86399
  }
]

export default class DateTimeFilter extends Component<Props> {
  _onChangeDateTime = (millis: number) => {
    const date = moment(+millis).format('YYYYMMDD')
    this.props.updateDateTimeFilter({date})
    this.props.onChange && this.props.onChange({date})
  }

  _onChangeTimeRange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const fromTo = evt.target.value.split('-')
    const from = +fromTo[0]
    const to = +fromTo[1]
    this.props.updateDateTimeFilter({from, to})
    this.props.onChange && this.props.onChange({from, to})
  }

  render () {
    const {dateTime, hideDateTimeField, version} = this.props
    const dateTimeProps = {
      dateTime: dateTime.date ? +moment(dateTime.date, 'YYYY-MM-DD') : +moment(),
      defaultText: !dateTime.date ? 'Por favor seleccione una fecha' : undefined,
      mode: 'date',
      onChange: this._onChangeDateTime
    }
    const validDate =
      version &&
      moment(dateTime.date).isBetween(
        version.validationSummary.startDate,
        version.validationSummary.endDate,
        // Set units undefined
        undefined,
        // [] indicates that check is inclusive of dates
        '[]'
      )
    return (
      <div>
        <Row>
          <Col xs={12} md={4} style={{paddingTop: '10px'}}>
            <ControlLabel>Fecha:</ControlLabel>
            <DateTimeField
              {...dateTimeProps} />
          </Col>
          {!hideDateTimeField &&
            <Col xs={12} md={4} style={{paddingTop: '10px'}}>
              <ControlLabel>Espacio de tiempo:</ControlLabel>
              <FormControl
                componentClass='select'
                placeholder='Seleccionar rango de tiempo'
                value={`${dateTime.from}-${dateTime.to}`}
                onChange={this._onChangeTimeRange}>
                {timeOptions.map((t, i) => {
                  return <option key={i} value={`${t.from}-${t.to}`}>{t.label}</option>
                })}
              </FormControl>
            </Col>
          }
        </Row>
        {!validDate
          ? <Row>
            <Col xs={12} style={{paddingTop: '10px'}}>
              <Alert bsStyle='danger'>
                <Icon type='exclamation-triangle' />
                <span><strong>Advertencia!</strong> La fecha elegida está fuera del intervalo de fechas válido para la versión del feed.</span>
              </Alert>
            </Col>
          </Row>
          : null
        }
      </div>
    )
  }
}
