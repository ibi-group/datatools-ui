// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Button} from 'react-bootstrap'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

import * as adminActions from '../actions/admin'
import {formatTimestamp} from '../../common/util/date-time'

import type {ServerJob} from '../../types'
import type {AppState} from '../../types/reducers'

const TIME_FORMAT = 'h:mm:ss a'

type Props = {
  fetchApplicationStatus: typeof adminActions.fetchApplicationStatus,
  jobs: Array<ServerJob>,
  requests: Array<any>
}

/**
 * Component that shows the currently active server jobs running for the
 * application, the latest HTTP requests made for each user, and a link to Auth0
 * logs.
 */
class ApplicationStatusView extends Component<Props, {refreshTime: ?Date}> {
  state = {
    refreshTime: null
  }

  componentWillMount () {
    this._refreshJobs()
  }

  _formatUser = (val: ?string) => {
    return val || '(unauthenticated)'
  }

  _refreshJobs = () => {
    this.setState({refreshTime: new Date()})
    this.props.fetchApplicationStatus()
  }

  render () {
    const {jobs, requests} = this.props
    const defaultTableOptions = {
      hover: true,
      pagination: true,
      options: {
        noDataText: undefined,
        paginationShowsTotal: true,
        sizePerPageList: [10, 20, 50, 100]
      },
      striped: true
    }
    const jobTableOptions = {...defaultTableOptions}
    jobTableOptions.options.noDataText = 'No hay trabajos activos.'
    const jobColumns = [
      {children: 'ID', dataField: 'jobId', isKey: true, hidden: true},
      {children: 'Nombre', dataField: 'name'},
      {children: 'Usuario', dataField: 'email', width: '120px'},
      {children: 'Estatus', dataField: 'message'},
      {children: '%', dataField: 'percentComplete', width: '60px'}
    ]
    const requestColumns = [
      {children: 'ID', dataField: 'id', isKey: true, hidden: true},
      {children: 'Ruta', dataField: 'path'},
      {children: 'Usuario', dataField: 'user', width: '180px', dataFormat: this._formatUser},
      {children: 'Hora', dataField: 'time', width: '140px', dataFormat: formatTimestamp}
    ]
    return (
      <div>
        <h3>
          Trabajos activos en el servidor
          <Button
            className='pull-right'
            onClick={this._refreshJobs}>
            <Icon type='refresh' /> Actualizar
          </Button>
          <br />
          <small>Última actualización: {moment(this.state.refreshTime).format(TIME_FORMAT)}</small>
        </h3>
        <BootstrapTable
          {...jobTableOptions}
          headerStyle={{
            fontSize: 'small',
            textWrap: 'normal',
            wordWrap: 'break-word',
            whiteSpace: 'no-wrap'
          }}
          bodyStyle={{fontSize: 'small'}}
          data={jobs.map(j => ({...j.status, ...j}))}>
          {jobColumns.map((col, index) => {
            return <TableHeaderColumn {...col} key={index} />
          })}
        </BootstrapTable>
        <h3>
          Últimas solicitudes de API por usuario
          <br />
          <small>Última actualización: {moment(this.state.refreshTime).format(TIME_FORMAT)}</small>
        </h3>
        <BootstrapTable
          {...defaultTableOptions}
          headerStyle={{fontSize: 'small', textWrap: 'normal', wordWrap: 'break-word', whiteSpace: 'no-wrap'}}
          bodyStyle={{fontSize: 'small'}}
          data={requests}>
          {requestColumns.map((col, index) => {
            return <TableHeaderColumn {...col} key={index} />
          })}
        </BootstrapTable>
        <h3>Logs de autenticación de usuarios</h3>
        <Button
          bsStyle='danger'
          bsSize='large'
          block
          href='https://manage.auth0.com/#/logs'>
          <Icon type='star' /> Ver logs de usuario en Auth0.com
        </Button>
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: {}) => {
  return {
    jobs: state.status.applicationJobs,
    requests: state.status.applicationRequests
  }
}

const { fetchApplicationStatus } = adminActions

const mapDispatchToProps = {
  fetchApplicationStatus
}

const ApplicationStatus = connect(
  mapStateToProps,
  mapDispatchToProps
)(ApplicationStatusView)

export default ApplicationStatus
