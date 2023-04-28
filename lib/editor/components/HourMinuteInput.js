// @flow

// $FlowFixMe Flow doesn't recognize react KeyboardEvent
import React, {Component, KeyboardEvent} from 'react'
import {FormControl} from 'react-bootstrap'

type Props = {
  onChange: (number) => any,
  seconds: ?number,
  standaloneInput?: boolean,
  style?: {[string]: string | number}
}

type State = {
  hours?: number,
  minutes?: number
}

export default class HourMinuteInput extends Component<Props, State> {
  state = {}

  _onKeyDown = (evt: KeyboardEvent) => {
    const {key} = evt

    // Move to minute field when colon is typed
    if (key === ':') {
      evt.preventDefault()
      // $FlowFixMe this is a terrible hack, but unless we upgrade to react 17 and use modern refs, this is not possible otherwise
      document.getElementById('minutes').select()
      return
    }

    // Ignore non-number keystrokes
    if (key !== 'Backspace' && key !== 'Tab' && !key.includes('Arrow') && isNaN(parseInt(key))) {
      evt.preventDefault()
    }
  }
  _onChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {id, value} = evt.target

    // Ignore calls to this method that somehow don't come from the two inputs below
    if (id !== 'hours' && id !== 'minutes') {
      return
    }

    this.setState({[id]: parseInt(value)}, this.handleChange)
  }

  _onFocus = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    evt.target.select()
  }

  handleChange = () => {
    const {onChange} = this.props

    const {hours, minutes} = this.state
    onChange && onChange(((hours || 0) * 3600) + ((minutes || 0) * 60))
  }

  componentDidUpdate (prevProps: Props) {
    const {seconds} = this.props
    if (seconds !== prevProps.seconds && seconds !== null && seconds !== undefined) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor(seconds / 60 % 60)

      this.setState({minutes, hours})
    }
  }

  render () {
    const {seconds: initialSeconds, standaloneInput, style, ...otherProps} = this.props
    const {hours, minutes} = this.state

    const defaultValue = typeof minutes === 'undefined' && typeof hours === 'undefined' ? '' : '00'

    return (
      <span style={{display: 'flex', alignItems: 'baseline'}}>
        <FormControl
          {...otherProps}
          id='hours'
          onKeyDown={this._onKeyDown}
          onChange={this._onChange}
          onFocus={this._onFocus}
          placeholder={'hh'}
          style={{
            borderBottomRightRadius: 0,
            borderRight: 'none',
            borderTopRightRadius: 0,
            width: '5.5ch',
            ...style
          }}
          value={hours && hours < 10 ? `0${hours}` : hours || defaultValue}
        />
        <span style={{zIndex: 9, position: 'relative', left: -2.5, fontWeight: 900}}>:</span>
        <FormControl
          {...otherProps}
          id='minutes'
          onKeyDown={this._onKeyDown}
          onChange={this._onChange}
          onFocus={this._onFocus}
          placeholder={'mm'}
          style={{
            borderBottomRightRadius: standaloneInput ? 3 : 0,
            borderLeft: 'none',
            borderRadius: 0,
            borderTopRightRadius: standaloneInput ? 3 : 0,
            marginLeft: -5,
            width: '6.5ch',
            ...style
          }}
          value={minutes && minutes < 10 ? `0${minutes}` : minutes || defaultValue}
        />
      </span>
    )
  }
}
