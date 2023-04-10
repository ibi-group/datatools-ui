// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Alert, Checkbox, Col, Row } from 'react-bootstrap'
import Select from 'react-select'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'

import Loading from '../../../../common/components/Loading'
import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'
import * as routesActions from '../../../../gtfs/actions/routes'
import * as timetablesActions from '../../../../gtfs/actions/timetables'

import type {Props as ContainerProps} from '../containers/Timetables'
import type {
  AllRoutesSubState,
  PatternsState,
  RouteListItem,
  TimetablesState,
  ValidationPattern
} from '../../../../types/reducers'

type Props = ContainerProps & {
  fetchRoutes: typeof routesActions.fetchRoutes,
  fetchTimetablesWithFilters: typeof timetablesActions.fetchTimetablesWithFilters,
  filter: {
    patternFilter: ?string,
    routeFilter: ?string,
    showArrivals: boolean,
    timepointFilter: boolean
  },
  patterns: PatternsState,
  routes: AllRoutesSubState,
  timetableDateTimeFilterChange: typeof timetablesActions.timetableDateTimeFilterChange,
  timetablePatternFilterChange: typeof timetablesActions.timetablePatternFilterChange,
  timetableRouteFilterChange: typeof timetablesActions.timetableRouteFilterChange,
  timetableShowArrivalToggle: typeof timetablesActions.timetableShowArrivalToggle,
  timetableTableData: {
    columns: Array<any>,
    rows: Array<any>
  },
  timetableTimepointToggle: typeof timetablesActions.timetableTimepointToggle,
  timetables: TimetablesState
}

export default class TimetableLayout extends Component<Props> {
  componentWillMount () {
    const {
      fetchRoutes,
      fetchTimetablesWithFilters,
      patterns,
      routes,
      timetables,
      version
    } = this.props
    const {namespace} = version
    if (!routes.fetchStatus.fetched) {
      fetchRoutes(namespace)
    } else if (
      routes.fetchStatus.fetched &&
      patterns.fetchStatus.fetched &&
      !timetables.fetchStatus.fetched
    ) {
      fetchTimetablesWithFilters(namespace)
    }
  }

  _onPatternFilterChange = (pattern: ?ValidationPattern) => {
    const {timetablePatternFilterChange, version} = this.props
    timetablePatternFilterChange(version.namespace, pattern && pattern.pattern_id)
  }

  _onRouteFilterChange = (route: ?RouteListItem) => {
    const {timetableRouteFilterChange, version} = this.props
    timetableRouteFilterChange(version.namespace, route && route.route_id)
  }

  _onShowArrivalsToggle = () => {
    const {timetableShowArrivalToggle, version} = this.props
    timetableShowArrivalToggle(version.namespace)
  }

  _onTimetableDateTimeFilterChange = () => {
    const {timetableDateTimeFilterChange, version} = this.props
    timetableDateTimeFilterChange(version.namespace)
  }

  _onTimepointFilterToggle = () => {
    const {timetableTimepointToggle, version} = this.props
    timetableTimepointToggle(version.namespace)
  }

  render () {
    const {
      filter,
      patterns,
      routes,
      tableOptions,
      timetableTableData,
      timetables,
      version
    } = this.props
    const {
      patternFilter,
      routeFilter,
      showArrivals,
      timepointFilter
    } = filter

    const allFiltersSelected = routeFilter && patternFilter
    return (
      <div>
        <Row style={{ marginBottom: '20px' }}>
          <Col xs={12} md={6}>
            <label htmlFor='route_name'>Ruta:</label>
            <Select
              options={routes.data || []}
              labelKey={'route_name'}
              valueKey={'route_id'}
              placeholder={'Seleccione una ruta'}
              value={routeFilter}
              onChange={this._onRouteFilterChange} />
          </Col>
          {routeFilter &&
            <Col xs={12} md={6}>
              <label htmlFor='pattern'>Patrón:</label>
              <Select
                options={patterns.data.patterns}
                labelKey={'name'}
                valueKey={'pattern_id'}
                placeholder={'Seleccione un patrón'}
                value={patternFilter}
                onChange={this._onPatternFilterChange} />
            </Col>
          }
        </Row>
        <ActiveDateTimeFilter
          onChange={this._onTimetableDateTimeFilterChange}
          version={version} />
        <Row style={{ margin: '20px 0' }}>
          <Col xs={12} md={6}>
            <Checkbox
              checked={timepointFilter}
              onChange={this._onTimepointFilterToggle}>
              Mostrar solo paradas con tiempos
            </Checkbox>
          </Col>
          <Col xs={12} md={6}>
            <Checkbox
              checked={!showArrivals}
              onChange={this._onShowArrivalsToggle}>
              Vista comprimida (ocultar los tiempos de espera)
            </Checkbox>
          </Col>
          <ul style={{fontSize: 'x-small', marginLeft: '15px'}} className='list-unstyled'>
            <li><span style={{minWidth: '40px', color: 'green'}}>HH:MM:SS</span> Tiempo de viaje hasta la parada <strong>Mas rapido</strong> de lo habitual</li>
            <li><span style={{minWidth: '40px', color: 'red'}}>HH:MM:SS</span> Tiempo de viaje hasta la parada <strong>Mas lento</strong> de lo habitual</li>
            <li><span style={{color: 'red'}}><Icon type='caret-up' /></span> Avance (tiempo desde el vehículo anterior) <strong>aumentó</strong> más de lo habitual</li>
            <li><span style={{color: 'green'}}><Icon type='caret-down' /></span> Avance (tiempo desde el vehículo anterior) <strong>disminuido</strong> más de lo habitual</li>
          </ul>
        </Row>
        {timetables.fetchStatus.fetching &&
          <Loading />
        }
        {timetables.fetchStatus.error &&
          <Alert bsStyle='danger'>
            Se produjo un error al intentar obtener los datos
          </Alert>
        }
        {!allFiltersSelected &&
          <Alert>
            Seleccione una ruta y un patrón
          </Alert>
        }
        {allFiltersSelected && timetables.fetchStatus.fetched && timetableTableData.rows.length > 0 &&
          <BootstrapTable
            {...tableOptions}
            headerStyle={{fontSize: 'small', textWrap: 'normal', wordWrap: 'break-word', whiteSpace: 'no-wrap'}}
            bodyStyle={{fontSize: 'small'}}
            data={timetableTableData.rows}>
            {timetableTableData.columns.map((col, index) => {
              const {name, ...props} = col
              return (
                <TableHeaderColumn {...props} key={index} />
              )
            })}
          </BootstrapTable>
        }
        {allFiltersSelected && timetables.fetchStatus.fetched && timetableTableData.rows.length === 0 &&
          <Alert bsStyle='warning'>
            No se encontraron viajes para la ruta seleccionada, patrón, fecha, 'desde' fecha y 'hasta' fecha
          </Alert>
        }
      </div>
    )
  }
}
