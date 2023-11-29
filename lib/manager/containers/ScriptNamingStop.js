// @flow

import {connect} from 'react-redux'

import {fetchProjects, updateProject} from '../actions/projects'
import {setVisibilitySearchText} from '../actions/visibilityFilter'
import ProjectsList from '../components/ProjectsList'
import {getProjects} from '../selectors'

import type {AppState, RouterProps} from '../../types/reducers'

export type Props = RouterProps

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    projects: getProjects(state),
    user: state.user,
    visibilitySearchText: state.projects.filter.searchText
  }
}

const mapDispatchToProps = {
  fetchProjects,
  setVisibilitySearchText,
  updateProject
}

const ScriptNamingStop = connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectsList)

export default ScriptNamingStop
