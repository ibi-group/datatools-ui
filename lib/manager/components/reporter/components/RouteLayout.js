import React, { Component, PropTypes } from 'react'
import { Alert, Button } from 'react-bootstrap'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

import Loading from '../../../../common/components/Loading'

export default class RouteLayout extends Component {
  static propTypes = {
    onComponentMount: PropTypes.func,
    routes: PropTypes.object,
    tableOptions: PropTypes.object
  }
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  render () {
    const self = this
    return (
      <div>

        {this.props.routes.fetchStatus.fetching &&
          <Loading />
        }

        {this.props.routes.fetchStatus.error &&
          <Alert bsStyle='danger'>
            An error occurred while trying to fetch the data
          </Alert>
        }

        {this.props.routes.fetchStatus.fetched &&
          <BootstrapTable
            data={this.props.routes.data}
            {...this.props.tableOptions}
          >
            <TableHeaderColumn dataSort dataField='route_id' isKey>ID</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='route_short_name'>Short Name</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='route_long_name'>Long Name</TableHeaderColumn>
            {/*
              <TableHeaderColumn dataSort dataField='route_desc'>Description</TableHeaderColumn>
              <TableHeaderColumn
                dataSort dataField='route_url'
                dataFormat={(cell, row) => {
                  return cell ? ( <a href={cell} target={'_blank'} >Link</a> ) : ''
                }}>
                  Route URL
              </TableHeaderColumn>
            */}
            <TableHeaderColumn dataSort dataField='trip_count'># of Trips</TableHeaderColumn>
            <TableHeaderColumn dataSort dataField='pattern_count'># of Patterns</TableHeaderColumn>
            <TableHeaderColumn
              dataFormat={(cell, row) => {
                return (
                  <Button
                    bsStyle='primary'
                    bsSize='small'
                    onClick={() => { self.props.viewPatterns(row) }}>
                    View Patterns
                  </Button>
                )
              }}>
                Patterns
            </TableHeaderColumn>
          </BootstrapTable>
        }
      </div>
    )
  }
}
