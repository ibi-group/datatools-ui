import { connect } from 'react-redux'

import { fetchProjects, updateProject, createProject, saveProject } from '../actions/projects'
import { setVisibilitySearchText } from '../actions/visibilityFilter'
import ProjectsList from '../components/ProjectsList'

const mapStateToProps = (state, ownProps) => {
  return {
    projects: state.projects.all ? state.projects.all.filter(p => p.isCreating || state.user.permissions.isApplicationAdmin() || state.user.permissions.hasProject(p.id, p.organizationId)) : [],
    visibilitySearchText: state.projects.filter.searchText,
    user: state.user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      dispatch(setVisibilitySearchText(null))
      dispatch(fetchProjects())
    },
    onNewProjectClick: (project) => dispatch(createProject(project)),
    saveProject: (project) => dispatch(saveProject(project)),
    projectNameChanged: (project, name) => dispatch(updateProject(project, {name})),
    searchTextChanged: (text) => dispatch(setVisibilitySearchText(text))
  }
}

const ActiveProjectsList = connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectsList)

export default ActiveProjectsList
