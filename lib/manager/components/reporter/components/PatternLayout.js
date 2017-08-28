import React, { Component, PropTypes } from 'react'
import { Row, Col, Alert, Button } from 'react-bootstrap'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'
import Select from 'react-select'
import clone from 'lodash.clonedeep'

import { formatHeadway, formatSpeed } from '../../../../gtfs/util/stats'
import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'
import Loading from '../../../../common/components/Loading'

export default class PatternLayout extends Component {
  static propTypes = {
    onComponentMount: PropTypes.func,
    patternDateTimeFilterChange: PropTypes.func,
    patternRouteFilterChange: PropTypes.func,
    patterns: PropTypes.object,
    routes: PropTypes.object,
    tableOptions: PropTypes.object,
    version: PropTypes.object,
    viewStops: PropTypes.func
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  render () {
    const {
      patternDateTimeFilterChange,
      patternRouteFilterChange,
      patterns,
      routes,
      tableOptions,
      version
    } = this.props
    const self = this
    const rows = patterns.data.map(p => {
      const flat = clone(p)
      if (p.stats) {
        delete flat.stats
        for (const key in p.stats) {
          flat[key] = p.stats[key]
        }
      }
      return flat
    })
    return (
      <div>
        {routes.fetchStatus.fetched &&
          <div>
            <Row>
              <Col xs={12} md={6} style={{padding: '20px'}}>
                <label htmlFor='route_name'>Filtering Patterns for Route:</label>
                <Select
                  id='route_name'
                  options={routes.data}
                  labelKey={'route_name'}
                  valueKey={'route_id'}
                  placeholder={'Select a Route'}
                  value={patterns.routeFilter}
                  onChange={patternRouteFilterChange} />
              </Col>
            </Row>
            <ActiveDateTimeFilter
              onChange={patternDateTimeFilterChange}
              version={version} />
          </div>
        }

        {patterns.fetchStatus.fetching &&
          <Loading />
        }

        {patterns.fetchStatus.error &&
          <Alert bsStyle='danger'>
            An error occurred while trying to fetch the data
          </Alert>
        }

        {patterns.fetchStatus.fetched &&
          <BootstrapTable
            data={rows}
            {...tableOptions}>
            <TableHeaderColumn columnTitle dataSort dataField='pattern_id' isKey hidden />
            <TableHeaderColumn columnTitle dataSort dataField='name'>Name</TableHeaderColumn>
            <TableHeaderColumn columnTitle dataSort dataField='trip_count'># of Trips</TableHeaderColumn>
            <TableHeaderColumn columnTitle dataSort dataField='stop_count'># of Stops</TableHeaderColumn>
            <TableHeaderColumn columnTitle dataSort dataFormat={formatHeadway} dataField='headway'>Headway</TableHeaderColumn>
            <TableHeaderColumn columnTitle dataSort dataFormat={formatSpeed} dataField='avgSpeed'>Avg. Speed</TableHeaderColumn>
            <TableHeaderColumn
              dataFormat={(cell, row) => {
                return (
                  <Button
                    bsStyle='primary'
                    bsSize='small'
                    // TODO: factor out inline func
                    onClick={() => { self.props.viewStops(row) }}>
                    View Stops
                  </Button>
                )
              }}>
                Stops
            </TableHeaderColumn>
          </BootstrapTable>
        }
      </div>
    )
  }
}
