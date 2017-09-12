import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'

import { TIMETABLE_FORMATS } from '../../util/timetable'

export default class EditableCell extends Component {
  static propTypes = {
    isEditing: PropTypes.bool
  }

  state = {
    isEditing: this.props.isEditing,
    edited: false,
    data: this.props.data,
    originalData: this.props.data
  }

  componentWillReceiveProps (nextProps) {
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
    this.setState({isEditing: true})
  }

  handleClick = (evt) => {
    const {columnIndex, isFocused, onClick, rowIndex} = this.props
    if (isFocused) {
      // console.log(rowIndex, columnIndex)
      this.beginEditing()
    } else {
      // console.log(rowIndex, columnIndex)
      onClick(rowIndex, columnIndex)
    }
  }

  handleKeyDown = (evt) => {
    const input = ReactDOM.findDOMNode(this.cellInput)
    switch (evt.keyCode) {
      case 88: // x
        if (this.props.renderTime) {
          evt.preventDefault()
          this.props.onRowSelect(evt)
          break
        } else {
          return true
        }
      case 79: // o
        if (this.props.renderTime) {
          evt.preventDefault()
          this.props.onRowSelect(evt)
          break
        } else {
          return true
        }
      case 222: // single quote
        if (evt.shiftKey) {
          console.log('dupe left')
          this.props.duplicateLeft && this.props.duplicateLeft(evt)
          this.props.onRight(evt)
          return false
        }
        break
      case 13: // Enter
        evt.preventDefault()
        if (this.props.isFocused) {
          this.beginEditing()
        }
        // handle shift
        if (evt.shiftKey) {
          this.save(evt)
          this.props.onUp(evt)
        } else {
          this.save(evt)
        }
        break
      case 9: // Tab
        evt.preventDefault()
        // handle shift
        if (evt.shiftKey) {
          this.save(evt)
        } else {
          this.save(evt)
        }
        break
      case 27: // Esc
        this.cancel()
        break
      case 39: // right
        if (input.selectionStart === input.value.length) {
          this.save(evt)
          return false
        } else {
          return true
        }
      case 37: // left
        if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
          this.save(evt)
          return false
        } else {
          return true
        }
      case 38: // up
        this.save(evt)
        break
      case 40: // down
        this.save(evt)
        break
      default:
        return true
    }
  }

  _createRef = (input) => {
    this.cellInput = input
    // focus on cell input when input is rendered
    this.cellInput && ReactDOM.findDOMNode(this.cellInput).focus()
  }

  _onOuterKeyDown = (e) => {
    if (document.activeElement === e.target && e.which === 13) {
      this.handleClick(e)
    }
  }

  save () {
    // for non-time rendering
    if (!this.props.renderTime) {
      if (this.state.data !== this.state.originalData) {
        this.setState({isEditing: false})
        this.props.onChange(this.state.data, this.props.rowIndex, this.props.column, this.props.columnIndex)
        this.props.onStopEditing()
      } else {
        this.cancel()
      }
    } else {
      // for time rendering
      let data = this.state.data
      // console.log(this.state.data)
      if (typeof this.state.data !== 'string') return this.cancel()
      const parts = this.state.data.split(':')
      const hours = +parts[0]
      let greaterThan24 = false

      // check for times greater than 24:00
      if (parts && parts[0] && hours >= 24 && hours < 34) {
        parts[0] = `0${hours - 24}`
        greaterThan24 = true
        data = parts.join(':')
      }
      const date = moment().startOf('day').format('YYYY-MM-DD')
      const momentTime = moment(date + 'T' + data, TIMETABLE_FORMATS, true)
      let value = momentTime.isValid() ? momentTime.diff(date, 'seconds') : null

      if (greaterThan24 && momentTime.isValid()) {
        value += 86400
      }
      // check for valid time and new value
      if ((data === '' || momentTime.isValid()) && value !== data) {
        this.setState({data: value, isEditing: false})
        this.props.onChange(value, this.props.rowIndex, this.props.column, this.props.columnIndex)
        this.props.onStopEditing()
      } else {
        this.cancel()
      }
    }
  }
  cellRenderer (value) {
    if (this.props.cellRenderer) {
      return this.props.cellRenderer(this.props.column, value)
    } else {
      return value
    }
  }

  handleChange = (evt) => {
    this.setState({data: evt.target.value})
  }

  handlePaste = (evt) => {
    const text = evt.clipboardData.getData('Text')
    const rowDelimiter = text.indexOf('\n') > -1 // google sheets row delimiter
      ? '\n'
      : text.indexOf(String.fromCharCode(13)) > -1 // excel row delimiter
      ? String.fromCharCode(13)
      : null
    const rows = text.split(rowDelimiter)

    for (var i = 0; i < rows.length; i++) {
      rows[i] = rows[i].split(String.fromCharCode(9))
    }

    if (rows.length > 1 || rows[0].length > 1) {
      this.cancel()
      this.props.handlePastedRows(rows, this.props.rowIndex, this.props.columnIndex)
      evt.preventDefault()
    }
  }

  _onInputFocus = (evt) => {
    evt.target.select()
  }

  render () {
    // console.log(this.props)
    const rowCheckedColor = '#F3FAF6'
    const focusedNotEditing = this.props.isFocused && !this.state.isEditing
    const edgeDiff = this.props.isFocused ? 0 : 0.5
    const divStyle = {
      height: '100%',
      display: 'inline-block',
      paddingTop: `${3 + edgeDiff}px`,
      paddingLeft: `${3 + edgeDiff}px`,
      UserSelect: 'none',
      userSelect: 'none',
      fontWeight: this.state.edited ? 'bold' : 'normal'
    }
    const inputStyle = {
      width: '100%',
      height: '100%',
      outline: 'none',
      margin: '1px',
      marginLeft: '2px',
      padding: '1px',
      border: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    }
    const cellStyle = {
      backgroundColor: this.props.invalidData && !this.state.isEditing
        ? 'pink'
        : focusedNotEditing
        ? '#F4F4F4'
        : this.state.isEditing
        ? '#fff'
        : this.props.isSelected
        ? rowCheckedColor
        : '#fff',
      border: this.props.invalidData && focusedNotEditing
        ? '2px solid red'
        : this.props.isFocused
        ? `2px solid #66AFA2`
        : '1px solid #ddd',
      margin: `${-0.5 + edgeDiff}px`,
      padding: `${-edgeDiff}px`,
      whiteSpace: 'nowrap',
      cursor: 'default',
      fontWeight: '400',
      // fontFamily: '"Courier New", Courier, monospace',
      color: this.props.lightText ? '#aaa' : '#000',
      ...this.props.style
    }
    const cellHtml = this.state.isEditing
      ? <input
        type='text'
        ref={this._createRef}
        readOnly={!this.state.isEditing}
        defaultValue={this.cellRenderer(this.state.data)}
        placeholder={this.props.placeholder || ''}
        onPaste={this.handlePaste}
        style={inputStyle}
        onKeyDown={this.handleKeyDown}
        onChange={this.handleChange}
        onFocus={this._onInputFocus}
        onBlur={this.cancel} />
      : <div
        style={divStyle}>
        {this.cellRenderer(this.state.data)}
      </div>
    return (
      <div
        className='editable-cell small'
        role='button'
        style={cellStyle}
        tabIndex={0}
        onClick={this.handleClick}
        onKeyDown={this._onOuterKeyDown}>
        {cellHtml}
      </div>
    )
  }
}
