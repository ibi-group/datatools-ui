// @flow

import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import {AutoSizer} from 'react-virtualized/dist/commonjs/AutoSizer'
// NOTE: We cannot use MultiGrid due to lack of colspan support, which is currently
// used to group arrival and departure times underneath a single stop name.
import {Grid} from 'react-virtualized/dist/commonjs/Grid'
import objectPath from 'object-path'

import * as tripActions from '../../actions/trip'
import {ENTITY} from '../../constants'
import {
  getHeaderColumns,
  HEADER_GRID_STYLE,
  HEADER_GRID_WRAPPER_STYLE,
  isTimeFormat,
  LEFT_COLUMN_WIDTH,
  LEFT_GRID_STYLE,
  LEFT_GRID_WRAPPER_STYLE,
  MAIN_GRID_WRAPPER_STYLE,
  OVERSCAN_COLUMN_COUNT,
  OVERSCAN_ROW_COUNT,
  parseCellValue,
  ROW_HEIGHT,
  SCROLL_SIZE,
  TOP_LEFT_STYLE,
  WRAPPER_STYLE
} from '../../util/timetable'
import type {Pattern, TimetableColumn} from '../../../types'
import type {TimetableState} from '../../../types/reducers'
import type {TripValidationIssues} from '../../selectors/timetable'

import EditableCell from './EditableCell'
import HeaderCell from './HeaderCell'

type Style = {[string]: number | string}

type Props = {
  activeCell: ?string,
  activePattern: Pattern,
  activeScheduleId: string,
  addNewRow: (?boolean, ?boolean) => void,
  cloneSelectedTrips: () => void,
  columns: Array<TimetableColumn>,
  data: Array<any>,
  hideDepartureTimes: boolean,
  offsetWithDefaults: (boolean) => void,
  onScroll: any => void,
  onSectionRendered: any => void,
  removeSelectedRows: () => void,
  saveEditedTrips: (Pattern, string) => void,
  scrollLeft: number,
  scrollToColumn: number,
  scrollToRow: number,
  scrollTop: number,
  selected: Array<number>,
  setActiveCell: typeof tripActions.setActiveCell,
  setOffset: typeof tripActions.setOffset,
  showHelpModal: () => void,
  style: Style,
  timetable: TimetableState,
  toggleAllRows: typeof tripActions.toggleAllRows,
  toggleRowSelection: typeof tripActions.toggleRowSelection,
  tripValidationErrors: TripValidationIssues,
  updateCellValue: typeof tripActions.updateCellValue,
  updateScroll: (number, number) => void
}

type CellProps = {
  columnIndex: number,
  key: string,
  rowIndex: number,
  style: Style
}

export default class TimetableGrid extends Component<Props> {
  grid = null

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.hideDepartureTimes !== this.props.hideDepartureTimes) {
      // force grid refresh because grid column width must change
      this.grid && this.grid.recomputeGridSize()
    }
  }

  /**
   * Handles a keypress event when the Timetable Grid is focused.
   * This occurs when an EditableCell is not in focus, but the grid is.
   * Whenever an EditableCell loses focus by an end in editing, the focus should
   * bubble up to this component.
   */
  _handleKeyPress = (evt: SyntheticKeyboardEvent<HTMLInputElement>) => {
    const {
      activeCell,
      activePattern,
      activeScheduleId,
      addNewRow,
      cloneSelectedTrips,
      columns,
      data,
      offsetWithDefaults,
      removeSelectedRows,
      saveEditedTrips,
      setActiveCell,
      scrollToColumn,
      scrollToRow,
      selected,
      setOffset,
      showHelpModal,
      timetable,
      toggleAllRows,
      toggleRowSelection,
      tripValidationErrors,
      updateScroll
    } = this.props
    // Check if command key or ctrl is pressed.
    const ctrlPressed = evt.ctrlKey || evt.metaKey
    const col = columns[this._getColIndex(scrollToColumn)]
    const currentValue = objectPath.get(data[scrollToRow], col.key)
    const renderTime = isTimeFormat(col.type)
    switch (evt.keyCode) {
      // TODO: Add shortcuts for duplicating/offsetting values
      case 191: // ?
        if (!activeCell && evt.shiftKey) {
          // if question mark is typed, show the keyboard shortcuts help modal.
          return showHelpModal()
        }
        break
      case 51: // # - Delete selected trips
        if (!activeCell && evt.shiftKey) return removeSelectedRows()
        break
      case 78: // n - New trip
        if (!activeCell && !ctrlPressed) return addNewRow(true, true)
        break
      case 67: // c - Clone selected trips (don't apply if ctrl key is pressed)
        if (!activeCell && !ctrlPressed) {
          return cloneSelectedTrips()
        }
        break
      case 65: // a - Select all trips if cell is not active
        if (!activeCell && !ctrlPressed && timetable.selected.length < data.length) {
          return toggleAllRows({active: true})
        }
        break
      case 68: // d - Deselect all trips if cell is not active
        if (!activeCell && !ctrlPressed && timetable.selected.length > 0) {
          return toggleAllRows({active: false})
        }
        break
      case 189: { // - Decrease offset if cell is not active
        const diff = evt.shiftKey ? 600 : 60
        if (!activeCell && !ctrlPressed) {
          const offset = timetable.offset - diff > 0
            ? timetable.offset - diff
            : 0 // min value is zero
          if (timetable.offset !== offset) return setOffset(offset)
          else {
            return console.warn(`Pas de mise à jour de l'offset (min=0)`)
          }
        } else break
      }
      case 187: { // +
        const diff = evt.shiftKey ? 600 : 60
        if (!activeCell && !ctrlPressed) {
          // Increase offset if cell is not active (and ctrl key not pressed).
          const MAX_OFFSET = 60 * 60 * 6 // 6 hours
          const offset = timetable.offset + diff < MAX_OFFSET
            ? timetable.offset + diff
            : MAX_OFFSET
          if (timetable.offset !== offset) return setOffset(offset)
          else {
            return console.warn(`Pas de mise à jour de l'offset (max=${MAX_OFFSET})`)
          }
        } else break
      }
      case 88: // x
        if (!activeCell && !ctrlPressed) {
          evt.preventDefault()
          const active = selected.indexOf(scrollToRow) !== -1
          return toggleRowSelection({active, rowIndex: scrollToRow})
        } else break
      case 79: // o -  Offset times for selected trips
        if (!activeCell && !ctrlPressed) {
          evt.preventDefault()
          // Apply offset to selected rows (shift applies a negative offset)
          return offsetWithDefaults(evt.shiftKey)
        } else break
      case 73: // i - Offset time for a single cell
        if (renderTime && !activeCell && !ctrlPressed) {
          evt.preventDefault()
          const diff = evt.shiftKey ? -1 * timetable.offset : timetable.offset
          const value = currentValue + diff
          // Apply offset to selected rows (shift applies a negative offset)
          return this._handleCellChange(value, scrollToRow, col, scrollToColumn)
        } else break
      case 222: { // single quote
        // Set current cell's value to adjacent cell's (leftward) value.
        const adjacentCol = columns[this._getColIndex(scrollToColumn) - 1]
        if (evt.shiftKey && !activeCell && isTimeFormat(adjacentCol.type)) {
          const value = objectPath.get(data[scrollToRow], adjacentCol.key)
          this._handleCellChange(value, scrollToRow, col, scrollToColumn)
          this.offsetScrollCol(1)
          return false
        }
        break
      }
      case 186: { // semi-colon
        // Set current cell's value to above cell's value.
        const previousRowIndex = scrollToRow - 1
        if (evt.shiftKey && !activeCell && previousRowIndex >= 0) {
          const value = objectPath.get(data[previousRowIndex], col.key)
          this._handleCellChange(value, scrollToRow, col, scrollToColumn)
          // duplicateLeft && duplicateLeft(evt)
          this.offsetScrollRow(1)
          return false
        }
        break
      }
      case 8: // DELETE
        // TODO: add delete cell value
        // updateCellValue({value: '', rowIndex, key: `${scrollToRow}.${col.key}`})
        break
      case 9: // tab
        this.offsetScrollCol(evt.shiftKey ? -1 : 1)
        evt.preventDefault()
        break
      case 13: // Enter
        if (!activeCell) {
          if (ctrlPressed) {
            // If Enter is pressed with CTRL or CMD and no cell is active, save
            // any unsaved trips.
            if (Object.keys(tripValidationErrors).length > 0) {
              return window.alert(`Impossible d'enregistrer les modifications du trajet. Veuillez résoudre les erreurs de validation (⚠️).`)
            }
            return saveEditedTrips(activePattern, activeScheduleId)
          } else {
            // Otherwise, set active cell
            return setActiveCell(`${scrollToRow}-${scrollToColumn}`)
          }
        } else {
          // Cell is active. Set to inactive and move up or down (with shift)
          // a row.
          setActiveCell(null)
          return this.offsetScrollRow(evt.shiftKey ? -1 : 1)
        }
      case 37: // left
        // prevent browser back
        evt.preventDefault()
        // override ArrowKeyStepper
        evt.stopPropagation()

        // check if done with command key or ctrl
        if (ctrlPressed) {
          // move all the way to the first column
          updateScroll(scrollToRow, 0)
        } else {
          this.offsetScrollCol(-1)
        }
        // retain active focus on the grid
        this._focusOnGrid()
        break
      case 75: // k
      case 38: // up
        // do nothing if k was pressed while in edit mode
        if (evt.keyCode === 75 && activeCell) return
        // check if done with command key or ctrl
        if (ctrlPressed) {
          // prevent default up behavior
          evt.preventDefault()
          // override ArrowKeyStepper
          evt.stopPropagation()

          // move all the way to top
          updateScroll(0, scrollToColumn)
        } else {
          this.offsetScrollRow(-1)
        }
        // retain active focus on the grid
        this._focusOnGrid()
        return
      case 39: // right
        // prevent browser back
        evt.preventDefault()
        // override ArrowKeyStepper
        evt.stopPropagation()

        // check if done with command key or ctrl
        if (ctrlPressed) {
          // move all the way to the first column
          updateScroll(scrollToRow, this._getColumnCount() - 1)
        } else {
          this.offsetScrollCol(1)
        }

        // retain active focus on the grid
        this._focusOnGrid()
        break
      case 74: // j
      case 40: // down
        // do nothing if j was pressed while in edit mode
        if (evt.keyCode === 74 && activeCell) return
        if (ctrlPressed) {
          // prevent default up behavior
          evt.preventDefault()
          // override ArrowKeyStepper
          evt.stopPropagation()

          // move all the way to the bottom
          updateScroll(data.length - 1, scrollToColumn)
        } else {
          this.offsetScrollRow(1)
        }
        // retain active focus on the grid
        return this._focusOnGrid()
      default:
        break
    }
  }

  _renderLeftHeaderCell = (cellProps: CellProps) => (
    <HeaderCell // This is the select all checkbox
      key={cellProps.key}
      onChange={this.props.toggleAllRows}
      style={cellProps.style}
      selectable />
  )

  _renderLeftColumnCell = (cellProps: CellProps & {selected: Array<number>}) => (
    <HeaderCell // Select row checkbox
      active={this.props.selected.indexOf(cellProps.rowIndex) !== -1}
      key={cellProps.key}
      index={cellProps.rowIndex}
      label={`${cellProps.rowIndex + 1}`}
      onChange={this.props.toggleRowSelection}
      style={cellProps.style}
      selectable />
  )

  _getColumnHeaderWidth = ({index}: {index: number}) => {
    const col = getHeaderColumns(this.props.columns)[index]
    return col.type === 'ARRIVAL_TIME' && !this.props.hideDepartureTimes
      ? col.width * 2
      : col
        ? col.width
        : 200
  }

  _renderHeaderCell = (cellProps: CellProps) => {
    const col = getHeaderColumns(this.props.columns)[cellProps.columnIndex]
    return (
      <HeaderCell
        key={cellProps.key}
        // TODO: Apply column index here.
        // render column headers as active if all rows selected
        active={this.props.selected.length > 0 &&
          this.props.selected.length === this.props.data.length}
        title={col.title ? col.title : col.name}
        label={col.name}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...cellProps.style
        }} />
    )
  }

  handlePastedRows = (pastedRows: Array<any>, rowIndex: number, colIndex: number) => {
    const {
      addNewRow,
      columns,
      data,
      hideDepartureTimes,
      updateCellValue,
      updateScroll
    } = this.props
    let activeRow = rowIndex
    let activeCol = colIndex
    let errorShown = false
    // Iterate over rows in pasted selection
    for (var i = 0; i < pastedRows.length; i++) {
      activeRow = rowIndex + i
      // Construct new row if it doesn't exist
      if (typeof data[activeRow] === 'undefined') {
        addNewRow()
      }
      // Iterate over number of columns in pasted selection
      for (var j = 0; j < pastedRows[0].length; j++) {
        activeCol = colIndex + j
        const col = columns[activeCol]
        const path = `${activeRow}.${col.key}`
        const originalValue = objectPath.get(data[activeRow], col.key)
        const value = parseCellValue(pastedRows[i][j], col, errorShown)
        if (value !== null) {
          const finalValue = value
          updateCellValue({ value: finalValue, rowIndex: activeRow, key: path })
          // If departure times are hidden, paste into adjacent time column
          const adjacentPath = `${activeRow}.${columns[activeCol + 2].key}`
          if (
            hideDepartureTimes &&
            isTimeFormat(col.type) &&
            typeof objectPath.get(data, adjacentPath) !== 'undefined'
          ) {
            updateCellValue({ value: finalValue, rowIndex: activeRow, key: adjacentPath })
          }
        } else {
          // If the value is rejected, keep the original value
          updateCellValue({ value: originalValue, rowIndex: activeRow, key: path })
          errorShown = true
        }
      }
    }
    updateScroll(activeRow, activeCol)
  }

  /**
   * Get column index adjusted for hidden departure times.
   */
  _getColIndex = (columnIndex: number) => {
    return this.props.hideDepartureTimes && columnIndex > 3
      ? (columnIndex * 2) - 3
      : columnIndex
  }

  _cellRenderer = (cellProps: CellProps) => {
    const {
      activeCell,
      columns,
      data,
      scrollToRow,
      scrollToColumn,
      selected,
      setActiveCell,
      hideDepartureTimes,
      tripValidationErrors,
      updateScroll
    } = this.props
    const {columnIndex, key, rowIndex, style} = cellProps
    // adjust columnIndex for hideDepartures (departure times will not be present in grid)
    const colIndex = this._getColIndex(columnIndex)
    const isFocused = columnIndex === scrollToColumn && rowIndex === scrollToRow
    const isEditing = activeCell === `${rowIndex}-${columnIndex}`
    const col = columns[colIndex]

    const rowIsChecked = (selected[0] === '*' && selected.indexOf(rowIndex) === -1) ||
      (selected[0] !== '*' && selected.indexOf(rowIndex) !== -1)

    let val = objectPath.get(data[rowIndex], col.key)
    if (col.key === 'tripId' && val === null) {
      // If current column is trip ID and the value is null, set val to the id
      // field's value
      val = objectPath.get(data[rowIndex], 'id') !== ENTITY.NEW_ID
        ? objectPath.get(data[rowIndex], 'id')
        : null
    }
    return (
      <EditableCell
        column={col}
        columnIndex={columnIndex} // pass original index to prevent issues with updateScroll/scrollsync
        data={val}
        handlePastedRows={this.handlePastedRows}
        hideDepartureTimes={hideDepartureTimes}
        invalidData={tripValidationErrors[`${rowIndex}-${colIndex}`]}
        isEditing={isEditing}
        isFocused={isFocused}
        isSelected={rowIsChecked}
        key={key}
        lightText={col.type === 'DEPARTURE_TIME'}
        offsetScrollCol={this.offsetScrollCol}
        offsetScrollRow={this.offsetScrollRow}
        onChange={this._handleCellChange}
        onClick={updateScroll}
        onStopEditing={this.handleEndEditing}
        placeholder={col.placeholder}
        rowIndex={rowIndex}
        setActiveCell={setActiveCell}
        style={style}
      />
    )
  }

  /**
   * Handle a change in the value of a cell.
   *
   * This function gets called with a post-processed value from the `save`
   * method of EditableCell.  The value can be a time value or non-time entry
   * such as Trip Id or Headsign. It also ensures that the companion departure
   * time gets appropriately updated if the departures times are hidden in the UI.
   */
  _handleCellChange = (value: ?(number | string), rowIndex: number, col: TimetableColumn, colIndex: number) => {
    const {
      activePattern,
      columns,
      data,
      hideDepartureTimes,
      updateCellValue
    } = this.props

    // Determine if the value is a time entry.
    if (isTimeFormat(col.type)) {
      // make sure stop time isn't null
      const splitColKeys = col.key.split('.')
      const stopTimeIdx = +splitColKeys[1]
      const trip = data[rowIndex]
      const stopTime = trip.stopTimes[stopTimeIdx]
      if (!stopTime && col.key.indexOf('.') !== -1) {
        // If stop time is null and there is a '.' in the column key, create a
        // new stop time. If there is no '.', this is a frequency start/end
        // time, which does not need a new stop time entry.

        // get stop id from pattern
        const {stopId} = activePattern.patternStops[stopTimeIdx]

        // create filler stop time object
        updateCellValue({
          value: { stopId },
          rowIndex,
          key: `${rowIndex}.stopTimes.${stopTimeIdx}`
        })
      }
    }
    updateCellValue({value, rowIndex, key: `${rowIndex}.${col.key}`})
    // if departure times are hidden, set departure time value equal to arrival time
    const nextCol = columns[colIndex + 1]
    if (hideDepartureTimes && nextCol && nextCol.type === 'DEPARTURE_TIME') {
      updateCellValue({value, rowIndex, key: `${rowIndex}.${nextCol.key}`})
    }
  }

  handleEndEditing = () => {
    this.props.setActiveCell(null)
    // refocus on grid after editing is done
    this._focusOnGrid()
  }

  _focusOnGrid () {
    const gridDOM = (ReactDOM.findDOMNode(this.grid): any)
    if (gridDOM) gridDOM.focus()
  }

  _getColumnWidth = ({index}: {index: number}) => {
    const {columns, hideDepartureTimes} = this.props
    const i = hideDepartureTimes && index > 3 ? (index * 2) - 3 : index
    const col = columns[i]
    return col.type === 'ARRIVAL_TIME' && hideDepartureTimes
      ? col.width * 2
      : col
        ? col.width
        : 90
  }

  /**
   * A helper method to move the active column a certain amount of cells left or right.
   * This was initially added to help with handling tab and shift + tab events.
   * @param {number} offset the number of columns to offset, can be positive or negative
   */
  offsetScrollCol = (offset: number) => {
    const {scrollToColumn, scrollToRow, updateScroll} = this.props
    updateScroll(
      scrollToRow,
      Math.max(Math.min(scrollToColumn + offset, this._getColumnCount() - 1), 0)
    )
  }

  offsetScrollRow = (offset: number) => {
    const {data, scrollToColumn, scrollToRow, updateScroll} = this.props
    updateScroll(
      Math.max(Math.min(scrollToRow + offset, data.length - 1), 0),
      scrollToColumn
    )
  }

  _getColumnCount () {
    const {columns, hideDepartureTimes} = this.props
    return hideDepartureTimes ? getHeaderColumns(columns).length : columns.length
  }

  render () {
    const {onScroll, scrollLeft, scrollTop, onSectionRendered, scrollToColumn, scrollToRow} = this.props
    const {style, data, columns, selected} = this.props
    const selectAll = selected.length === data.length
    const columnHeaderCount = getHeaderColumns(columns).length
    return (
      <div
        role='presentation'
        style={WRAPPER_STYLE}
        onKeyDown={this._handleKeyPress}>
        <div
          style={TOP_LEFT_STYLE}>
          <Grid // Top Left Cell
            cellRenderer={this._renderLeftHeaderCell}
            style={{outline: 'none'}}
            width={LEFT_COLUMN_WIDTH}
            height={ROW_HEIGHT}
            rowHeight={ROW_HEIGHT}
            columnWidth={LEFT_COLUMN_WIDTH}
            overscanColumnCount={1}
            overscanRowCount={1}
            rowCount={1}
            columnCount={1} />
        </div>
        <div style={{width: '100%', ...style}}>
          <AutoSizer>
            {({ width, height }: { height: number, width: number }) => (
              <div>
                <div
                  className='timetable-left-grid'
                  style={LEFT_GRID_WRAPPER_STYLE}>
                  <Grid // Left Side Column
                    overscanColumnCount={1}
                    overscanRowCount={OVERSCAN_ROW_COUNT}
                    style={LEFT_GRID_STYLE}
                    cellRenderer={this._renderLeftColumnCell}
                    // Pass selected row indexes as prop so that an update is
                    // triggered when selected rows change.
                    selected={selected}
                    columnWidth={LEFT_COLUMN_WIDTH}
                    columnCount={1}
                    selectAll={selectAll} // pass as bool prop to force update when all rows toggled
                    scrollTop={scrollTop}
                    height={height - SCROLL_SIZE}
                    rowHeight={ROW_HEIGHT}
                    rowCount={data.length}
                    width={LEFT_COLUMN_WIDTH} />
                </div>
                <div
                  style={{
                    width: width - SCROLL_SIZE,
                    ...HEADER_GRID_WRAPPER_STYLE
                  }}>
                  <Grid // Top Header Row
                    style={HEADER_GRID_STYLE}
                    columnWidth={this._getColumnHeaderWidth}
                    columnCount={columnHeaderCount} // columns.length
                    height={ROW_HEIGHT}
                    overscanColumnCount={OVERSCAN_COLUMN_COUNT}
                    overscanRowCount={1}
                    cellRenderer={this._renderHeaderCell}
                    rowHeight={ROW_HEIGHT}
                    rowCount={1}
                    scrollLeft={scrollLeft}
                    width={width - SCROLL_SIZE - LEFT_COLUMN_WIDTH} />
                </div>
                <div
                  style={MAIN_GRID_WRAPPER_STYLE}>
                  <Grid // Primary timetable grid
                    ref={Grid => { this.grid = Grid }}
                    style={{outline: 'none'}}
                    columnWidth={this._getColumnWidth}
                    columnCount={this._getColumnCount()}
                    height={height}
                    onScroll={onScroll}
                    overscanColumnCount={OVERSCAN_COLUMN_COUNT}
                    overscanRowCount={OVERSCAN_ROW_COUNT}
                    onSectionRendered={onSectionRendered}
                    cellRenderer={this._cellRenderer}
                    rowHeight={ROW_HEIGHT}
                    rowCount={data.length}
                    scrollToColumn={scrollToColumn}
                    scrollToRow={scrollToRow}
                    width={width - SCROLL_SIZE - LEFT_COLUMN_WIDTH} />
                </div>
              </div>
            )}
          </AutoSizer>
        </div>
      </div>
    )
  }
}
