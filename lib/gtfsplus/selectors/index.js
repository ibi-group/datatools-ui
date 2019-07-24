// @flow

import { createSelector } from 'reselect'

import type {GtfsPlusValidationIssue} from '../../types'
import type {AppState} from '../../types/reducers'

const getActiveTable = createSelector(
  [
    (state: AppState) => state.gtfsplus.activeTableId,
    (state: AppState) => state.gtfsplus.tableData
  ],
  (tableId, tableData): ?any => {
    return tableData && tableData[tableId]
  }
)

const getTableValidation = (state: AppState): Array<GtfsPlusValidationIssue> => {
  const { activeTableId } = state.gtfsplus
  const validation = getValidationIssuesForTable(state)
  if (validation && validation[activeTableId]) return validation[activeTableId]
  else return []
}

export const getValidationIssuesForTable = (state: AppState): ?{[key: string]: Array<GtfsPlusValidationIssue>} => {
  const validationTable = {}
  if (!state.gtfsplus.validation) return null
  for (const issue of state.gtfsplus.validation.issues) {
    if (!(issue.tableId in validationTable)) {
      validationTable[issue.tableId] = []
    }
    validationTable[issue.tableId].push(issue)
  }
  return validationTable
}

export const getFilteredRows = createSelector(
  [
    (state: AppState) => state.gtfsplus.visibility,
    getActiveTable,
    getTableValidation
  ],
  (visibility, table, validation): Array<any> => {
    switch (visibility) {
      case 'all':
        return table
      case 'validation':
        return table
          ? table.filter(record => (validation.find(v => v.rowIndex === record.origRowIndex)))
          : []
      default:
        return []
    }
  }
)

export const getFilteredPageCount = createSelector(
  [
    (state: AppState) => state.gtfsplus.recordsPerPage,
    getFilteredRows
  ],
  (recordsPerPage, rows): number => {
    const numRows = rows ? rows.length : 0
    return Math.ceil(numRows / recordsPerPage)
  }
)

export const getVisibleRows = createSelector(
  [
    (state: AppState) => state.gtfsplus.currentPage,
    (state: AppState) => state.gtfsplus.recordsPerPage,
    getFilteredRows
  ],
  (currentPage, recordsPerPage, rows): Array<any> => {
    return rows
      ? rows.slice((currentPage - 1) * recordsPerPage,
        Math.min(currentPage * recordsPerPage, rows.length))
      : []
  }
)
