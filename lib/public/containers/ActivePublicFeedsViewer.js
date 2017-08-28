import { connect } from 'react-redux'

import PublicFeedsViewer from '../components/PublicFeedsViewer'
import { setVisibilitySearchText } from '../../manager/actions/visibilityFilter'
import { fetchProjectsWithPublicFeeds } from '../../manager/actions/projects'

const mapStateToProps = (state, ownProps) => {
  return {
    visibilitySearchText: state.projects.filter.searchText,
    projects: state.projects.all
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  // const projectId = ownProps.routeParams.projectId
  return {
    onComponentMount: (initialProps) => {
      dispatch(fetchProjectsWithPublicFeeds())
    },
    searchTextChanged: (text) => dispatch(setVisibilitySearchText(text))
  }
}

const ActivePublicFeedsViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(PublicFeedsViewer)

export default ActivePublicFeedsViewer
