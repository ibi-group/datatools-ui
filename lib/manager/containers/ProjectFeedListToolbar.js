// @flow

import {connect} from 'react-redux'

import {
  calculateFeedSourceTableComparisonColumn,
  downloadFeedForProject,
  fetchFeedsForProject,
  setFeedSort,
  setFeedSourceTableFilterCountStrategy,
  thirdPartySync
} from '../actions/projects'
import {
  setVisibilityFilter,
  setVisibilitySearchText,
  setVisibilityLabel,
  setVisibilityLabelMode
} from '../actions/visibilityFilter'
import {deploymentsEnabledAndAccessAllowedForProject} from '../../common/util/permissions'
import ProjectFeedListToolbar from '../components/ProjectFeedListToolbar'
import {
  getFeedFilterCounts,
  projectHasAtLeastOneDeployment,
  projectHasAtLeastOneFeedWithAPublishedVersion
} from '../util'
import type {Project} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  onNewFeedSourceClick: () => void,
  project: Project
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {user} = state
  const {filter, sort} = state.projects
  const {project} = ownProps
  const projectEditDisabled = !user.permissions ||
    !user.permissions.isProjectAdmin(project.id, project.organizationId)

  const possibleComparisons = ['LATEST']

  if (
    deploymentsEnabledAndAccessAllowedForProject(project, user) &&
    projectHasAtLeastOneDeployment(project)
  ) {
    possibleComparisons.push('DEPLOYED')
  }

  if (projectHasAtLeastOneFeedWithAPublishedVersion(project)) {
    possibleComparisons.push('PUBLISHED')
  }

  return {
    filter,
    filterCounts: getFeedFilterCounts(
      project,
      filter.feedSourceTableFilterCountStrategy
    ),
    possibleComparisons,
    projectEditDisabled,
    sort,
    user
  }
}

const mapDispatchToProps = {
  calculateFeedSourceTableComparisonColumn,
  downloadFeedForProject,
  fetchFeedsForProject,
  setFeedSort,
  setFeedSourceTableFilterCountStrategy,
  setVisibilityFilter,
  setVisibilitySearchText,
  setVisibilityLabel,
  setVisibilityLabelMode,
  thirdPartySync
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectFeedListToolbar)
