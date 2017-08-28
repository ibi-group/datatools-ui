import update from 'react-addons-update'
import { latLngBounds } from 'leaflet'

import { getFeedBounds } from '../util/map'

const defaultState = {
  zoom: null,
  bounds: latLngBounds([[60, 60], [-60, -20]]), // entire globe
  target: null
}

const mapState = (state = defaultState, action) => {
  let updatedState
  switch (action.type) {
    case 'RECEIVE_FEEDSOURCE':
      return update(state, {
        bounds: {$set: latLngBounds(getFeedBounds(action.feedSource))},
        target: {$set: action.feedSource && action.feedSource.id}
      })
    case 'RECEIVED_ROUTES_SHAPEFILE':
      return update(state, {
        routesGeojson: {$set: action.geojson}
      })
    case 'UPDATE_MAP_SETTING':
      updatedState = {}
      for (const key in action.props) {
        updatedState[key] = {$set: action.props[key]}
      }
      if (!('target' in action.props)) {
        updatedState.target = {$set: null}
      }
      return update(state, updatedState)
    default:
      return state
  }
}

export default mapState
