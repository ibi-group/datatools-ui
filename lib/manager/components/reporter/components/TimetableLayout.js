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
            <label htmlFor='route_name'>Itinéraire:</label>
            <Select
              options={routes.data || []}
              labelKey={'route_name'}
              valueKey={'route_id'}
              placeholder={'Sélectionner un itinéraire'}
              value={routeFilter}
              onChange={this._onRouteFilterChange} />
          </Col>
          {routeFilter &&
            <Col xs={12} md={6}>
              <label htmlFor='pattern'>Circulation:</label>
              <Select
                options={patterns.data.patterns}
                labelKey={'name'}
                valueKey={'pattern_id'}
                placeholder={'Sélectionner une circulation'}
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
              Montrer seulement les arrêts avec des horaires
            </Checkbox>
          </Col>
          <Col xs={12} md={6}>
            <Checkbox
              checked={!showArrivals}
              onChange={this._onShowArrivalsToggle}>
              Vue simplifiée (temps d'arrêt cachés)
            </Checkbox>
          </Col>
          <ul style={{fontSize: 'x-small', marginLeft: '15px'}} className='list-unstyled'>
            <li><span style={{minWidth: '40px', color: 'green'}}>HH:MM:SS</span> Temps de voyage jusqu'à l'arrêt <strong>plus rapide</strong> qu'à l'habitude.</li>
            <li><span style={{minWidth: '40px', color: 'red'}}>HH:MM:SS</span> Temps de voyage jusqu'à l'arrêt <strong>plus lent</strong> qu'à l'habitude.</li>
            <li><span style={{color: 'red'}}><Icon type='caret-up' /></span> <strong>Plus de temps</strong> avant le véhicule précédent qu'à l'habitude.</li>
            <li><span style={{color: 'green'}}><Icon type='caret-down' /></span> <strong>Moins de temps</strong> avant le véhicule précédent qu'à l'habitude.</li>
          </ul>
        </Row>
        {timetables.fetchStatus.fetching &&
          <Loading />
        }
        {timetables.fetchStatus.error &&
          <Alert bsStyle='danger'>
            Une erreur est survenue lors de la récupération de la donnée.
          </Alert>
        }
        {!allFiltersSelected &&
          <Alert>
            Sélectionner un itinéraire et une circulation
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
            Pas de trajets trouvés pour la sélection d'itinéraire, de circulation, de date et de plage horaire.
          </Alert>
        }
      </div>
    )
  }
}
