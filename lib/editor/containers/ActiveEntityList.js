import {connect} from 'react-redux'

import {enterTimetableEditor} from '../actions/active'
import {updateEntitySort} from '../actions/editor'
import {getEntityName} from '../util/gtfs'
import EntityList from '../components/EntityList'
import {getActiveEntityList} from '../selectors'

const mapStateToProps = (state, ownProps) => {
  const entity =
    state.editor.data.active && state.editor.data.active.entity && state.editor.data.active.entity.id === ownProps.activeEntityId
    ? state.editor.data.active.entity
    : state.editor.data.active && state.editor.data.active.entity && ownProps.activeComponent === 'feedinfo'
    ? state.editor.data.active.entity
    : null
  const activeEntity = entity
    ? {
      name: getEntityName(entity),
      id: entity.id
    }
    : null
  const route = state.editor.data.tables.route
  const hasRoutes = route && route.length > 0
  const list = getActiveEntityList(state)
  const sort = state.editor.data.sort

  return {
    activeEntity,
    hasRoutes,
    list,
    sort
  }
}

const mapDispatchToProps = {
  enterTimetableEditor,
  updateEntitySort
}

const ActiveEntityList = connect(mapStateToProps, mapDispatchToProps)(EntityList)

export default ActiveEntityList
