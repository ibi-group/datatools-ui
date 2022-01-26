// @flow

import {connect} from 'react-redux'

import {setActiveEntity} from '../actions/active'
import {fetchSnapshots, restoreSnapshot} from '../actions/snapshots'
import {displayRoutesShapefile} from '../actions/map'
import FeedInfoPanel from '../components/FeedInfoPanel'
import {findProjectByFeedSource} from '../../manager/util'
import {getTableById} from '../util/gtfs'
import type {AppState} from '../../types/reducers'

export type Props = {
  feedSourceId: string,
  showConfirmModal: any
}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  const {feedSourceId} = ownProps
  const project = findProjectByFeedSource(state.projects.all, feedSourceId)
  const feedSource = project && project.feedSources && project.feedSources.find(fs => fs.id === feedSourceId)
  const feedInfo = getTableById(state.editor.data.tables, 'feedinfo')[0]
  return {
    feedInfo,
    feedSourceId,
    feedSource,
    project
  }
}

const mapDispatchToProps = {
  displayRoutesShapefile,
  fetchSnapshots,
  restoreSnapshot,
  setActiveEntity
}

const ActiveFeedInfoPanel = connect(mapStateToProps, mapDispatchToProps)(FeedInfoPanel)

export default ActiveFeedInfoPanel
