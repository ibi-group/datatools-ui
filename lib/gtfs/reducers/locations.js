// @flow

import type {Action} from '../../types/actions'
import type {LocationsState} from '../../types/reducers'

export const defaultState = {
  data: [],
  fetchStatus: {
    fetched: false,
    fetching: false,
    error: false
  },
  routeFilter: null,
  patternFilter: null
}

export default function reducer (
  state: LocationsState = defaultState,
  action: Action
): LocationsState {
  switch (action.type) {
    case 'SET_ACTIVE_FEEDVERSION':
      return defaultState
    case 'FETCH_GRAPHQL_LOCATIONS':
      return {
        ...state,
        data: [],
        fetchStatus: {
          fetched: false,
          fetching: true,
          error: false
        }
      }
    case 'FETCH_GRAPHQL_STOPS_REJECTED':
      return {
        ...state,
        data: [],
        fetchStatus: {
          fetched: false,
          fetching: false,
          error: true
        }
      }
    case 'RECEIVED_GTFS_ELEMENTS':
      return {
        ...state,
        data: action.payload.locations,
        fetchStatus: {
          fetched: true,
          fetching: false,
          error: false
        }
      }
    default:
      return state
  }
}
