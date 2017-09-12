import { connect } from 'react-redux'

import GtfsValidationExplorer from '../../components/validation/GtfsValidationExplorer'
import { fetchFeedSourceAndProject } from '../../actions/feeds'
import {
  fetchFeedVersions,
  fetchValidationResult,
  fetchFeedVersionIsochrones
} from '../../actions/versions'

const mapStateToProps = (state, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  const feedVersionIndex = ownProps.routeParams.feedVersionIndex
  const user = state.user

  // find the containing project
  const project = state.projects.all
    ? state.projects.all.find(p => {
      if (!p.feedSources) return false
      return (p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1)
    })
    : null

  let feedSource, version
  if (project) {
    feedSource = project.feedSources.find(fs => fs.id === feedSourceId)
  }
  if (feedSource && feedSource.feedVersions) {
    version = feedSource.feedVersions[feedVersionIndex - 1]
  }
  return {
    version,
    project,
    user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  const feedVersionIndex = ownProps.routeParams.feedVersionIndex

  return {
    onComponentMount: (initialProps) => {
      let unsecured = true
      if (initialProps.user.profile !== null) {
        unsecured = false
      }

      if (!initialProps.project) { // loaded directly via URL
        dispatch(fetchFeedSourceAndProject(feedSourceId, unsecured))
        .then((feedSource) => {
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
        .then((feedVersions) => {
          const version = feedVersions[feedVersionIndex - 1]
          dispatch(fetchValidationResult(version))
        })
      }
    },
    fetchValidationResult: (feedVersion) => dispatch(fetchValidationResult(feedVersion)),
    fetchIsochrones: (feedVersion, fromLat, fromLon, toLat, toLon) =>
      dispatch(fetchFeedVersionIsochrones(feedVersion, fromLat, fromLon, toLat, toLon))
  }
}

const ActiveGtfsValidationExplorer = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsValidationExplorer)

export default ActiveGtfsValidationExplorer
