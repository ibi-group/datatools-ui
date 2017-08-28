import React, { Component, PropTypes } from 'react'
import { Row, Col, Alert } from 'react-bootstrap'
import Select from 'react-select'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'
import moment from 'moment'
import clone from 'lodash.clonedeep'

import { formatHeadway } from '../../../../gtfs/util/stats'
import Loading from '../../../../common/components/Loading'
import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'

export default class StopLayout extends Component {
  static propTypes = {
    onComponentMount: PropTypes.func,
    stopRouteFilterChange: PropTypes.func,
    stopPatternFilterChange: PropTypes.func,
    stopDateTimeFilterChange: PropTypes.func,
    version: PropTypes.object,
    routes: PropTypes.object,
    patterns: PropTypes.object,
    stops: PropTypes.object,
    tableOptions: PropTypes.object,
    timeOptions: PropTypes.array,
    dateTime: PropTypes.object
  }
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }
  render () {
    const {
      stops,
      dateTime,
      stopDateTimeFilterChange,
      routes,
      stopRouteFilterChange,
      patterns,
      stopPatternFilterChange,
      version,
      tableOptions
    } = this.props
    const rows = stops.data.map(s => {
      const flat = clone(s)
      if (s.stats) {
        delete flat.stats
        for (const key in s.stats) {
          flat[key] = s.stats[key]
        }
      }
      return flat
    })
    const dateTimeProps = {
      mode: 'date',
      dateTime: dateTime.date ? +moment(dateTime.date, 'YYYY-MM-DD') : +moment(),
      onChange: (millis) => {
        const date = moment(+millis).format('YYYY-MM-DD')
        stopDateTimeFilterChange({date})
      }
    }
    if (!dateTime.date) {
      dateTimeProps.defaultText = 'Please select a date'
    }

    return (
      <div>
        <Row>
          <Col xs={12} md={6} style={{paddingLeft: '25px', paddingRight: '25px'}}>
            <label htmlFor='route_name'>Filtering Stops for Route:</label>
            <Select
              options={routes.data}
              labelKey={'route_name'}
              valueKey={'route_id'}
              placeholder={'Select a Route'}
              value={stops.routeFilter}
              onChange={stopRouteFilterChange} />
          </Col>
          {stops.routeFilter &&
            <Col xs={12} md={6} style={{paddingLeft: '25px', paddingRight: '25px'}}>
              <label htmlFor='pattern'>Filtering Stops for Pattern:</label>
              <Select
                options={patterns.data}
                labelKey={'name'}
                valueKey={'pattern_id'}
                placeholder={'Select a Pattern'}
                value={stops.patternFilter}
                onChange={stopPatternFilterChange} />
            </Col>
          }
        </Row>
        <ActiveDateTimeFilter
          onChange={stopDateTimeFilterChange}
          version={version} />
        {stops.fetchStatus.fetching &&
          <Loading />
        }
        {stops.fetchStatus.error &&
          <Alert bsStyle='danger'>
            An error occurred while trying to fetch the data
          </Alert>
        }
        {stops.fetchStatus.fetched &&
          <BootstrapTable
            data={rows}
            {...tableOptions}>
            <TableHeaderColumn dataSort dataField='stop_id' isKey>ID</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='stop_name'>Name</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='tripCount'># of Trips</TableHeaderColumn>
            <TableHeaderColumn dataSort dataFormat={formatHeadway} dataField='headway'>Headway</TableHeaderColumn>
            {/* <TableHeaderColumn dataSort dataField='best_headway'>Best Headway</TableHeaderColumn> */}
            {/* <TableHeaderColumn dataSort dataField='network_importance'>Network Importance</TableHeaderColumn> */}
          </BootstrapTable>
        }
      </div>
    )
  }
}
