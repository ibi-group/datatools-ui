// @flow

import Icon from '@conveyal/woonerf/components/icon'
import Pure from '@conveyal/woonerf/components/pure'
import React, { Component } from 'react'
import {
  Alert,
  Button,
  Col,
  ListGroup,
  ListGroupItem,
  Row
} from 'react-bootstrap'
import Select from 'react-select'

import ActiveDateTimeFilter from '../containers/ActiveDateTimeFilter'
import Loading from '../../../../common/components/Loading'
import * as filterActions from '../../../../gtfs/actions/filter'
import * as patternsActions from '../../../../gtfs/actions/patterns'
import * as routesActions from '../../../../gtfs/actions/routes'
import * as timetablesActions from '../../../../gtfs/actions/timetables'
import type {Props as ContainerProps} from '../containers/Patterns'
import type {FetchStatus} from '../../../../types'
import type {AllRoutesSubState, RouteListItem} from '../../../../types/reducers'
import type {PatternRowData} from '../../../selectors'

import TripsPerHourChart from './TripsPerHourChart'

type Props = ContainerProps & {
  fetchRoutes: typeof routesActions.fetchRoutes,
  fetchStatus: FetchStatus,
  namespace: string,
  patternData: Array<PatternRowData>,
  patternDateTimeFilterChange: typeof patternsActions.patternDateTimeFilterChange,
  patternRouteFilterChange: typeof patternsActions.patternRouteFilterChange,
  routeFilter: ?string,
  routes: AllRoutesSubState,
  timetablePatternFilterChange: typeof timetablesActions.timetablePatternFilterChange,
  updatePatternFilter: typeof filterActions.updatePatternFilter
}

export default class PatternLayout extends Component<Props> {
  componentWillMount () {
    const {fetchStatus, fetchRoutes, version} = this.props
    if (!fetchStatus.fetched) {
      fetchRoutes(version.namespace)
    }
  }

  _onDateTimeFilterChange = () => {
    const {namespace, patternDateTimeFilterChange} = this.props
    patternDateTimeFilterChange(namespace)
  }

  _onSelectRoute = (newRoute: ?RouteListItem) => {
    const {namespace, patternRouteFilterChange} = this.props
    patternRouteFilterChange(namespace, newRoute ? newRoute.route_id : undefined)
  }

  render () {
    const {
      fetchStatus: {
        error,
        fetched,
        fetching
      },
      patternData,
      routeFilter,
      routes,
      selectTab,
      version,
      timetablePatternFilterChange,
      updatePatternFilter
    } = this.props

    const maxTripsPerHourAllPatterns = fetched
      ? patternData.reduce(
        (accumulator, currentPattern) => {
          return Math.max(accumulator, ...currentPattern.tripsPerHour)
        },
        0
      )
      : 0

    return (
      <div>
        {routes.fetchStatus.fetched &&
          <div>
            <Row>
              <Col xs={12} md={6}>
                <label htmlFor='route_name'>Itinéraire:</label>
                <Select
                  id='route_name'
                  options={routes.data}
                  labelKey={'route_name'}
                  valueKey={'route_id'}
                  placeholder={'Sélectionner un itinéraire'}
                  value={routeFilter}
                  onChange={this._onSelectRoute} />
              </Col>
            </Row>
            <ActiveDateTimeFilter
              hideDateTimeField
              onChange={this._onDateTimeFilterChange}
              version={version} />
          </div>
        }

        {fetching &&
          <Loading />
        }

        {error &&
          <Alert bsStyle='danger'>
            Une erreur est survenue lors de la récupération de la donnée.
          </Alert>
        }
        {/* Only display results if query completed and a route is selected. */}
        {fetched && routeFilter &&
          <Row style={{marginTop: 20}}>
            <Col xs={12}>
              <ListGroup className='route-list'>
                {patternData.length > 0
                  ? patternData.map((pattern, index) => (
                    <PatternRow
                      key={index}
                      {...pattern}
                      index={index}
                      maxTripsPerHourAllPatterns={maxTripsPerHourAllPatterns}
                      namespace={version.namespace}
                      selectTab={selectTab}
                      timetablePatternFilterChange={timetablePatternFilterChange}
                      updatePatternFilter={updatePatternFilter} />
                  ))
                  : <Alert bsStyle='warning'><Icon type='exclamation-circle' /> L'itinéraire n'a pas de circulations.</Alert>
                }
              </ListGroup>
            </Col>
          </Row>
        }
      </div>
    )
  }
}

class PatternRow extends Pure {
  props: PatternRowData & {
    index: number,
    maxTripsPerHourAllPatterns: number,
    namespace: string,
    selectTab: string => void,
    timetablePatternFilterChange: typeof timetablesActions.timetablePatternFilterChange,
    updatePatternFilter: typeof filterActions.updatePatternFilter
  }

  _onStopsClick = () => {
    const {namespace, patternId, selectTab, timetablePatternFilterChange} = this.props
    timetablePatternFilterChange(namespace, patternId)
    selectTab('stops')
  }

  _onTripsClick = () => {
    const {namespace, patternId, selectTab, updatePatternFilter} = this.props
    updatePatternFilter(namespace, patternId)
    selectTab('timetables')
  }

  render () {
    const {
      index,
      maxTripsPerHourAllPatterns,
      numStops,
      numTrips,
      patternName,
      tripsPerHour
    } = this.props

    const rowStyle = index % 2 === 0 ? {} : {backgroundColor: '#f7f7f7'}

    return (
      <ListGroupItem style={rowStyle}>
        <Row>
          <Col xs={12}>
            <Button
              bsStyle='link'
              style={{padding: 0, marginBottom: '10px', color: 'black'}}
              onClick={this._onTripsClick}><h5>{patternName}</h5></Button>
          </Col>
          <Col xs={12} md={6}>
            <TripsPerHourChart
              maxTripsPerHour={maxTripsPerHourAllPatterns}
              tripsPerHour={tripsPerHour} />
          </Col>
          <Col xs={12} md={3} style={{textAlign: 'center'}}>
            <Button onClick={this._onStopsClick}>
              <h5>{numStops} arrêts</h5>
            </Button>
          </Col>
          <Col xs={12} md={3} style={{textAlign: 'center'}}>
            <Button onClick={this._onTripsClick}>
              <h5>{numTrips} trajets</h5>
            </Button>
          </Col>
        </Row>
      </ListGroupItem>
    )
  }
}
