// @flow

import React, {Component} from 'react'
import moment from 'moment'

import * as tripActions from '../../actions/trip'
import {secondsAfterMidnightToHHMM} from '../../../common/util/gtfs'
import { isTimeFormat, parseCellValue } from '../../util/timetable'
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
export default class EditableCell extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      isEditing: this.props.isEditing,
      isFocused: false,
      edited: false,
      data: this.props.data,
      originalData: this.props.data
    })
  }

  /**
   * The component may receive data from a save event or
   * editing can be changed by a change in the activeCell in the TimetableGrid
   */
  componentWillReceiveProps (nextProps: Props) {
    if (this.props.data !== nextProps.data) {
      this.setState({data: nextProps.data})
    }
    if (this.state.isEditing !== nextProps.isEditing) {
      this.setState({isEditing: nextProps.isEditing})
    }
  }

  cancel = () => {
    this.setState({
      isEditing: false,
      isFocused: false,
      data: this.props.data
    })
    this.props.onStopEditing()
  }

  beginEditing () {
    const {columnIndex, rowIndex, setActiveCell} = this.props
    setActiveCell(`${rowIndex}-${columnIndex}`)
    this.setState({isEditing: true})
  }

  handleClick = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {columnIndex, isFocused, onClick, rowIndex} = this.props
    if (isFocused) this.beginEditing()
    else onClick(rowIndex, columnIndex)
  }

  /**
   * Depending on the key pressed while focused on a cell, do some special things.
   */
  handleKeyDown = (evt: SyntheticKeyboardEvent<HTMLInputElement>) => {
    const {
      isFocused,
      offsetScrollCol,
      offsetScrollRow
    } = this.props
    const {isEditing} = this.state
    switch (evt.keyCode) {
      case 13: // Enter
        evt.preventDefault()
        if (isFocused) {
          this.beginEditing()
        }
        // handle shift
        if (evt.shiftKey) {
          this.save()
          offsetScrollRow(-1)
        } else {
          this.save()
        }
        break
      case 9: // Tab
        // save and advance to next cell if editing
        this.save()
        offsetScrollCol(evt.shiftKey ? -1 : 1)
        evt.preventDefault()
        evt.stopPropagation()
        break
      case 27: // Esc
        this.cancel()
        break
      case 39: // right
        // cancel event propogation if cell is being edited
        if (isEditing) {
          evt.stopPropagation()
          return
        }

        // update scroll position in TimetableGrid
        offsetScrollCol(1)
        return
      case 37: // left
        // do nothing if cell is being edited
        if (isEditing) {
          evt.stopPropagation()
          return
        }

        // update scroll position in TimetableGrid
        offsetScrollCol(-1)
        return
      case 38: // up
      case 40: // down
        this.save()
        break
      default:
        return true
    }
  }

  _onOuterKeyDown = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
    const {offsetScrollCol} = this.props
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

  _handleSave = (value: any) => {
    const { rowIndex, column, columnIndex, onChange, onStopEditing } = this.props
    this.setState({isEditing: false, data: value, originalData: value})
    onChange(value, rowIndex, column, columnIndex)
    onStopEditing()
  }

  save () {
    this.cancel()
    const {column} = this.props
    const {data} = this.state
    // for non-time rendering
    if (column.type === 'TEXT') {
      if (data !== this.state.originalData) this._handleSave(data)
      else this.cancel()
    } else if (column.type === 'SECONDS') {
      // Ensure that only a positive integer value can be set.
      const value = +data
      this._handleSave(value)
    } else if (isTimeFormat(column.type)) {
      if (typeof data !== 'string') return this.cancel()
      const parsedValue = parseCellValue(data, column)
      if (parsedValue !== null) {
        this._handleSave(parsedValue)
      } else {
        this.cancel()
      }
    } else {
      if (typeof data !== 'string') return this.cancel()
      const duration = moment.duration(data)
      // $FlowFixMe: flow doesn't know about duration.isValid ensuring valueOf returns a number
      const value = duration.isValid() && duration.valueOf() / 1000 // valueOf returns milliseconds
      if (value !== false) this._handleSave(value)
      else this.cancel()
    }
  }

  handleBlur = () => {
    this.save()
  }

  handleChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({data: evt.target.value})
  }

  handlePaste = (evt: ClipboardEvent) => {
    const {handlePastedRows, rowIndex, columnIndex} = this.props
    const {clipboardData} = evt
    if (!clipboardData) {
      console.warn('Pas de données dans le presse-papiers.')
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
      this.cancel()
      handlePastedRows(rowsAndColumns, rowIndex, columnIndex)
      evt.preventDefault()
    }
  }

  _onInputFocus = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    evt.target.select()
  }

  render () {
    const {column, invalidData, isFocused, isSelected, lightText, placeholder, style} = this.props
    const {data, edited, isEditing} = this.state
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
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={this._onInputFocus}
        onKeyDown={this.handleKeyDown}
        onPaste={this.handlePaste}
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
        onClick={this.handleClick}
        onKeyDown={this._onOuterKeyDown}>
        {cellHtml}
      </div>
    )
  }
}
