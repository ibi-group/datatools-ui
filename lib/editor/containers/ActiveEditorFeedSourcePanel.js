// @flow

import {connect} from 'react-redux'

import {
  deleteSnapshot,
  downloadSnapshot,
  fetchSnapshots,
  restoreSnapshot
} from '../actions/snapshots.js'
import {createFeedVersionFromSnapshot} from '../../manager/actions/versions'
import EditorFeedSourcePanel from '../components/EditorFeedSourcePanel'
import type {Feed, Project} from '../../types'
import type {AppState} from '../../types/reducers'

export type Props = {
  feedSource: Feed,
  project: Project
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {user} = state
  return {
    user
  }
}

const mapDispatchToProps = {
  createFeedVersionFromSnapshot,
  deleteSnapshot,
  downloadSnapshot,
  fetchSnapshots,
  restoreSnapshot
}

const ActiveEditorFeedSourcePanel = connect(
  mapStateToProps,
  mapDispatchToProps
)(EditorFeedSourcePanel)

export default ActiveEditorFeedSourcePanel
