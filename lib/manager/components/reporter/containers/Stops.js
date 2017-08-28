import { connect } from 'react-redux'

import StopLayout from '../components/StopLayout'
import { stopPatternFilterChange, stopRouteFilterChange, stopDateTimeFilterChange } from '../../../../gtfs/actions/stops'
import { fetchRoutes } from '../../../../gtfs/actions/routes'

const mapStateToProps = (state, ownProps) => {
  return {
    stops: state.gtfs.stops,
    routes: state.gtfs.routes,
    patterns: state.gtfs.patterns,
    dateTime: state.gtfs.filter.dateTimeFilter
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedId = ownProps.version.id.replace('.zip', '')
  return {
    onComponentMount: (initialProps) => {
      if (!initialProps.routes.fetchStatus.fetched) {
        dispatch(fetchRoutes(feedId))
      }
    },
    stopRouteFilterChange: (newValue) => {
      dispatch(stopRouteFilterChange(feedId, newValue))
    },
    stopPatternFilterChange: (newValue) => {
      dispatch(stopPatternFilterChange(feedId, newValue))
    },
    stopDateTimeFilterChange: (props) => {
      dispatch(stopDateTimeFilterChange(feedId, props))
    }
  }
}

const Stops = connect(
  mapStateToProps,
  mapDispatchToProps
)(StopLayout)

export default Stops
