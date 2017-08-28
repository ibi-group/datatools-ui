import { connect } from 'react-redux'

import GtfsMap from '../components/GtfsMap'
import { clearGtfsElements, refreshGtfsElements } from '../actions/general'
import { updateMapState } from '../actions/filter'
import { fetchFeedVersionIsochrones } from '../../manager/actions/versions'

const mapStateToProps = (state, ownProps) => {
  return {
    dateTime: state.gtfs.filter.dateTimeFilter,
    patterns: state.gtfs.patterns.data,
    routes: state.gtfs.routes.data,
    routing: state.routing.locationBeforeTransitions && state.routing.locationBeforeTransitions.pathname,
    sidebarExpanded: state.ui.sidebarExpanded,
    stops: state.gtfs.stops.data
  }
}

const mapDispatchToProps = {
  updateMapState,
  clearGtfsElements,
  refreshGtfsElements,
  fetchIsochrones: fetchFeedVersionIsochrones
}

const ActiveGtfsMap = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsMap)

export default ActiveGtfsMap
