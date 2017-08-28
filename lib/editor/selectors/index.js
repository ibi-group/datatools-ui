import {List} from 'immutable'
import SortDirection from 'react-virtualized/dist/commonjs/Table/SortDirection'
import {createSelector} from 'reselect'

import {getEditorTable} from '../util'
import {validate} from '../util/validation'
import {getEntityName} from '../util/gtfs'

const getActiveEntity = (state) => state.editor.data.active.entity

const getActiveId = createSelector(
  [state => state.editor.data.active.entity],
  (entity) => entity ? entity.id : undefined
)

const getActiveComponent = (state) => state.editor.data.active.component

const getActiveTable = createSelector(
  [getActiveComponent, state => state.editor.data.tables],
  (component, tableData) => tableData[component]
)

export const getValidationErrors = createSelector(
  [ getActiveComponent, getActiveEntity, getActiveTable, state => state.editor.data.tables ],
  (component, entity, entities, tableData) => {
    return getEditorTable(component) && entity
    ? getEditorTable(component).fields
      .map((field, colIndex) => validate(field, entity[field.name], entities, entity, tableData))
      .filter(e => e)
    : []
  }
)

export const getActiveEntityList = createSelector(
  [ getActiveId, getActiveComponent, getActiveTable, state => state.editor.data.sort ],
  (activeId, component, entities, sort) => {
    const list = entities && entities.length
      ? entities.map((entity, index) => {
        const {id} = entity
        const isActive = activeId && id === activeId
        const name = getEntityName(entity) || '[Unnamed]'
        return {...entity, name, id, isActive}
      })
      : []
    // return sorted Immutable List (based on sort value from store)
    return List(list)
      .sortBy(entity => entity[sort.key])
      .update(list =>
          sort.direction === SortDirection.DESC
            ? list.reverse()
            : list
        )
  }
)
