// @flow

import {connect} from 'react-redux'

import {updateProject} from '../actions/projects'
import {
  createDeployment,
  saveDeployment,
  deleteDeployment,
  updateDeployment
} from '../actions/deployments'
import DeploymentsPanel from '../components/deployment/DeploymentsPanel'

import type {Project} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  activeSubComponent: ?string,
  expanded: boolean,
  project: Project
}

const mapStateToProps = (state: AppState, ownProps: Props) => ({})

const mapDispatchToProps = {
  createDeployment,
  deleteDeployment,
  saveDeployment,
  updateDeployment,
  updateProject
}

export default connect(mapStateToProps, mapDispatchToProps)(DeploymentsPanel)
