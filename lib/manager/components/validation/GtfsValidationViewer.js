import moment from 'moment'
import React, {Component, PropTypes} from 'react'
import {
  // Badge,
  // Button
} from 'react-bootstrap'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

import {ValidationSummaryTable} from './GtfsValidationSummary'

export default class GtfsValidationViewer extends Component {
  static propTypes = {
    fetchValidationResult: PropTypes.func,
    validationResult: PropTypes.object,
    version: PropTypes.object
  }
  componentWillMount () {
    this.props.fetchValidationResult()
  }
  sortPriority (a, b, order) {
    const priorityToNum = p => {
      switch (p) {
        case 'HIGH':
          return 3
        case 'MEDIUM':
          return 2
        case 'LOW':
          return 1
        default:
          return 0
      }
    }
    if (order === 'desc') {
      return priorityToNum(a.priority) - priorityToNum(b.priority)
    } else {
      return priorityToNum(b.priority) - priorityToNum(a.priority)
    }
  }
  formatter (cell, row) {
    return <span title={cell}>{cell}</span>
  }
  render () {
    const {
      validationResult: result,
      version
    } = this.props
    const dateFormat = 'MMM. DD, YYYY'
    const timeFormat = 'h:MMa'
    // const messages = getComponentMessages('GtfsValidationViewer')
    const tableOptions = {
      striped: true,
      search: true,
      hover: true,
      exportCSV: true,
      // maxHeight: '500px',
      tableStyle: { marginLeft: '0px', marginRight: '0px' },
      pagination: true,
      options: {
        paginationShowsTotal: true,
        sizePerPageList: [10, 20, 50, 100]
      }
    }
    // let report = null
    const files = ['routes', 'stops', 'trips', 'shapes', 'stop_times']
    const errors = {}
    result && result.errors.map((error, i) => {
      error.index = i
      const key = files.indexOf(error.file) !== -1 ? error.file : 'other'
      if (!errors[error.file]) {
        errors[key] = []
      }
      errors[key].push(error)
    })
    return (
      <div>
        <h2 style={{marginTop: '0px'}}>{version.name} <small>{moment(version.updated).format(dateFormat + ', ' + timeFormat)}</small></h2>
        <ValidationSummaryTable version={version} />
        <BootstrapTable
          data={result && result.errors ? result.errors : []}
          {...tableOptions}
        >
          <TableHeaderColumn hidden isKey dataField='index' />
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='65' dataField='file'>File</TableHeaderColumn>
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='120' dataField='field'>Field</TableHeaderColumn>
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='60' dataField='line'>Line</TableHeaderColumn>
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='140' dataField='errorType'>Type</TableHeaderColumn>
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='400' dataField='message'>Description</TableHeaderColumn>
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='90' sortFunc={this.sortPriority} dataField='priority'>Priority</TableHeaderColumn>
          <TableHeaderColumn dataSort dataFormat={this.formatter} width='90' dataField='affectedEntityId'>Entity ID</TableHeaderColumn>
          {/* <TableHeaderColumn dataSort dataFormat={(cell, row) => {
              return (
                <LinkContainer to={`/feed/${this.props.version.feedSource.id}/edit/${row.file.replace(/s\s*$/, '')}/${cell}`}>
                  <Button
                    bsStyle='success'
                    bsSize='small'
                  >
                    Edit
                  </Button>
                </LinkContainer>
              )
            }} width='90' dataField='affectedEntityId'>Action</TableHeaderColumn>
          */}
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
        </BootstrapTable>
      </div>
    )
  }
}
