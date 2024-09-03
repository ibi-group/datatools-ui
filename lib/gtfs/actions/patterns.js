// @flow

import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, fetchGraphQL} from '../../common/actions'
import {patterns} from '../../gtfs/util/graphql'
import {updateRouteFilter, updatePatternFilter} from './filter'

import type {dispatchFn, getStateFn, ValidationStop} from '../../types/reducers'

export const errorFetchingPatterns = createVoidPayloadAction('FETCH_GRAPHQL_PATTERNS_REJECTED')
export const fetchingPatterns = createVoidPayloadAction('FETCH_GRAPHQL_PATTERNS')
export const receivePatterns = createAction(
  'FETCH_GRAPHQL_PATTERNS_FULFILLED',
  (payload: {
    routes: Array<{
      patterns: Array<{
        name: string,
        pattern_id: string,
        shape: Array<{
          shape_pt_lat: number,
          shape_pt_lon: number
        }>,
        stops: Array<{
          stop_id: string
        }>,
        trips: Array<{
          stop_times: Array<{
            arrival_time: number,
            departure_time: number
          }>
        }>
      }>,
      route_id: string,
      route_long_name: string,
      route_short_name: string,
      stops: Array<ValidationStop>
    }>
  }) => payload
)

export type GtfsPatternActions = ActionType<typeof errorFetchingPatterns> |
  ActionType<typeof fetchingPatterns> |
  ActionType<typeof receivePatterns>

export function patternDateTimeFilterChange (namespace: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {routeFilter: routeId} = getState().gtfs.filter
    dispatch(fetchPatterns(namespace, routeId))
  }
}

export function fetchPatterns (namespace: string, routeId: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(fetchingPatterns())
    if (!routeId) {
      const routes = []
      return dispatch(receivePatterns({routes}))
    }
    const {date} = getState().gtfs.filter.dateTimeFilter
    return dispatch(
      fetchGraphQL({query: patterns, variables: {namespace, routeId, date}})
    )
      .then(data => {
        if (data) {
          const {routes} = data.feed
          dispatch(receivePatterns({routes}))
        } else {
          console.error('Erreur lors de la récupération des motifs')
        }
      })
  }
}

export function patternRouteFilterChange (namespace: string, newRouteId: ?string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(updateRouteFilter(newRouteId))
    // If there's an active pattern, clear it
    dispatch(updatePatternFilter(null))
    dispatch(fetchPatterns(namespace, newRouteId))
  }
}
