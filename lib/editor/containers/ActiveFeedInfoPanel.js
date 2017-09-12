import { connect } from 'react-redux'

import { createSnapshot, fetchSnapshots, restoreSnapshot } from '../actions/snapshots'
import { displayRoutesShapefile } from '../actions/map'
import FeedInfoPanel from '../components/FeedInfoPanel'

const mapStateToProps = (state, ownProps) => { return { } }

const mapDispatchToProps = {
  createSnapshot,
  getSnapshots: fetchSnapshots,
  restoreSnapshot,
  displayRoutesShapefile
}

const ActiveFeedInfoPanel = connect(mapStateToProps, mapDispatchToProps)(FeedInfoPanel)

export default ActiveFeedInfoPanel
