// @flow

// $FlowIgnore - TODO: need to update Flow to like the useEffect or useState hooks
import React, {useEffect, useState} from 'react'
import moment from 'moment'

import * as tripActions from '../../actions/trip'
import {secondsAfterMidnightToHHMM} from '../../../common/util/gtfs'
import { isTimeFormat } from '../../util/timetable'
import type {TimetableColumn} from '../../../types'
import type {EditorValidationIssue} from '../../util/validation'

export type CellData = ?(number | string)

type Props = {
  column: TimetableColumn,
  columnIndex: number,
  data: CellData,
  handlePastedRows: (Array<any>, number, number) => void,
  invalidData: ?EditorValidationIssue,
  isEditing: boolean,
  isFocused: boolean,
  isSelected: boolean,
  lightText: boolean,
  offsetScrollCol: number => void,
  offsetScrollRow: number => void,
  onChange: (?(number | string), number, TimetableColumn, number) => void,
  onClick: (number, number) => void,
  onStopEditing: () => void,
  placeholder: ?string,
  rowIndex: number,
  setActiveCell: typeof tripActions.setActiveCell,
  style: {[string]: string | number}
}

type State = {
  data: CellData,
  edited: boolean,
  isEditing: boolean,
  isFocused: boolean,
  originalData: CellData
}

const renderCell = (
  col: TimetableColumn,
  value: ?(number | string)
): number | string => {
  if (!isTimeFormat(col.type)) {
    // If not a time format, return string value (or empty string to avoid null)
    return value || ''
  } else {
    return secondsAfterMidnightToHHMM(value)
  }
}

/**
 * A component to handle the editing of a cell in a timetable editor
 */
function EditableCell (props: Props) {
  const [state, setState] = useState<State>({
    isEditing: props.isEditing,
    isFocused: false,
    edited: false,
    data: props.data,
    originalData: props.data
  })

  /**
   * The component may receive data from a save event or
   * editing can be changed by a change in the activeCell in the TimetableGrid
   */
  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      data: props.data
    }))
    if (state.isEditing !== props.isEditing) {
      setState((prevState) => ({
        ...prevState,
        isEditing: props.isEditing
      }))
    }
  }, [props.data, props.isEditing])

  const cancel = () => {
    setState((prevState) => ({
      ...prevState,
      isEditing: false,
      isFocused: false,
      data: props.data
    }))
    props.onStopEditing()
  }

  const beginEditing = () => {
    const {columnIndex, rowIndex, setActiveCell} = props
    setActiveCell(`${rowIndex}-${columnIndex}`)
    setState((prevState) => ({
      ...prevState,
      isEditing: true
    }))
  }

  const handleClick = (evt) => {
    const {columnIndex, isFocused, onClick, rowIndex} = props
    if (isFocused) {
      beginEditing()
    } else {
      onClick(rowIndex, columnIndex)
    }
  }

  /**
   * Depending on the key pressed while focused on a cell, do some special things.
   */
  const handleKeyDown = (evt) => {
    const {
      isFocused,
      offsetScrollCol,
      offsetScrollRow
    } = props
    const {isEditing} = state
    switch (evt.keyCode) {
      case 13: // Enter
        evt.preventDefault()
        if (isFocused) {
          beginEditing()
          save()
          // handle shift
        } else if (evt.shiftKey) {
          offsetScrollRow(-1)
        }
        break

      case 9: // Tab
      // save and advance to next cell if editing
        evt.preventDefault()
        evt.stopPropagation()
        save()
        offsetScrollCol(evt.shiftKey ? -1 : 1)
        break

      case 27: // Esc
        cancel()
        break

      case 39: // right
      // cancel event propogation if cell is being edited
        if (isEditing) {
          evt.stopPropagation()
        } else {
          // update scroll position in TimetableGrid
          offsetScrollCol(1)
        }
        break

      case 37: // left
        if (!isEditing) {
          offsetScrollCol(-1)
        }
        break

      case 38: // Up
        save()
        break

      case 40: // down
        save()
        break

      default:
        return true
    }
  }

  const _onOuterKeyDown = (e) => {
    const {offsetScrollCol} = props
    switch (e.keyCode) {
      case 9: // tab
        // update scroll position in TimetableGrid
        offsetScrollCol(e.shiftKey ? -1 : 1)
        // prevent other listeners and default browser tabbing
        e.stopPropagation()
        e.preventDefault()
        break
      case 37: // left
        // update scroll position in TimetableGrid
        offsetScrollCol(-1)
        break
      case 39: // right
        // update scroll position in TimetableGrid
        offsetScrollCol(1)
        break
    }
  }

  const _handleSave = (value) => {
    const { rowIndex, column, columnIndex, onChange, onStopEditing } = props
    setState((prevState) => ({
      ...prevState,
      isEditing: false,
      data: value,
      originalData: value
    }))
    onChange(value, rowIndex, column, columnIndex)
    onStopEditing()
  }

  const save = () => {
    const {column} = props
    const {data} = state

    if (column.type === 'TEXT') {
      if (data !== state.originalData) {
        _handleSave(data)
      } else {
        cancel()
      }
    } else if (column.type === 'SECONDS') {
      const value = +data

      if (!isNaN(value) && value >= 0) {
        _handleSave(value)
      } else {
        window.alert('Please enter a positive number.')
        cancel()
      }
    } else if (isTimeFormat(column.type)) {
      if (!isTimeFormat(data)) {
        window.alert('Please enter a valid time format.')
        cancel()
      } else {
        const duration = moment.duration(data)
        // $FlowExpectedError - Flow throws "mixed" type linting error, but this should be okay
        const value = duration.isValid() ? duration.valueOf() / 1000 : false

        if (value !== false) {
          _handleSave(value)
        } else {
          cancel()
        }
      }
    }
  }

  const handleBlur = () => {
    save()
  }

  const handleChange = (evt) => {
    setState((prevState) => ({
      ...prevState,
      data: evt.target.value
    }))
  }

  const handlePaste = (evt: ClipboardEvent) => {
    const {handlePastedRows, rowIndex, columnIndex} = props
    const {clipboardData} = evt
    if (!clipboardData) {
      console.warn('No clipboard data found.')
      return
    }
    const text = clipboardData.getData('Text')
    const rowDelimiter = text.indexOf('\n') > -1 // google sheets row delimiter
      ? '\n'
      : text.indexOf(String.fromCharCode(13)) > -1 // excel row delimiter
        ? String.fromCharCode(13)
        : undefined
    const rows = text.split(rowDelimiter)
    // Remove carriage return characters (/r) from rows to handle pasted data from Excel
    const rowsAndColumns = rows.map(row => row.split(String.fromCharCode(9)).map(cellValue => cellValue.replace(/\r/g, '')))
    if (rowsAndColumns.length > 1 || rowsAndColumns[0].length > 1) {
      cancel()
      handlePastedRows(rowsAndColumns, rowIndex, columnIndex)
      evt.preventDefault()
    }
  }

  const _onInputFocus = (evt) => {
    evt.target.select()
  }

  const {column, invalidData, isFocused, isSelected, lightText, placeholder, style} = props
  const {data, edited, isEditing} = state
  const rowCheckedColor = '#F3FAF6'
  const focusedNotEditing = isFocused && !isEditing
  const edgeDiff = isFocused ? 0 : 0.5
  const divStyle = {
    paddingTop: `${3 + edgeDiff}px`,
    paddingLeft: `${3 + edgeDiff}px`,
    fontWeight: edited ? 'bold' : 'normal'
  }
  const cellStyle = {
    backgroundColor: invalidData && !isEditing
      ? 'pink'
      : focusedNotEditing
        ? '#F4F4F4'
        : isEditing
          ? '#fff'
          : isSelected
            ? rowCheckedColor
            : '#fff',
    border: invalidData && focusedNotEditing
      ? '2px solid red'
      : isFocused
        ? `2px solid #66AFA2`
        : '1px solid #ddd',
    margin: `${-0.5 + edgeDiff}px`,
    padding: `${-edgeDiff}px`,
    // fontFamily: '"Courier New", Courier, monospace',
    color: lightText ? '#aaa' : '#000',
    ...style
  }
  const cellHtml = isEditing
    ? <input
      /* enable autofocus against jsx-a11y`s best judget so the inputs behave
          like a spreadsheet where cells are automatically in edit mode when
          selected */
      /* eslint-disable-next-line jsx-a11y/no-autofocus */
      autoFocus
      defaultValue={renderCell(column, data)}
      className='cell-input'
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={_onInputFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      placeholder={placeholder || ''}
      readOnly={!isEditing}
      type='text' />
    : <div
      className='cell-div noselect'
      style={divStyle}>
      {renderCell(column, data)}
    </div>
  return (
    <div
      className='editable-cell small'
      role='button'
      title={!isEditing && invalidData
        ? invalidData.reason
        : undefined
      }
      style={cellStyle}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={_onOuterKeyDown}>
      {cellHtml}
    </div>
  )
}

export default EditableCell
