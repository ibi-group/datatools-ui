// @flow

// $FlowFixMe Flow doesn't recognize react KeyboardEvent
import React, {Component, KeyboardEvent} from 'react'
import {FormControl} from 'react-bootstrap'

type Props = {
  onChange: (number) => any,
  seconds: ?number,
  showSeconds: ?boolean,
  standaloneInput?: boolean,
  style?: {[string]: string | number}
}

type State = {
  hours?: number,
  minutes?: number,
  seconds?: number
}

export default class HourMinuteInput extends Component<Props, State> {
  state = {}

  _onKeyDown = (evt: KeyboardEvent) => {
    const {key} = evt

    // Move to minute or second field when colon is typed
    if (key === ':') {
      evt.preventDefault()
      const focusElement = evt.currentTarget.id === 'hours' ? 'minutes' : 'seconds'
      // $FlowFixMe this is a terrible hack, but unless we upgrade to react 17 and use modern refs, this is not possible otherwise
      document.getElementById(focusElement).select()
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
    if (id !== 'hours' && id !== 'minutes' && id !== 'seconds') {
      return
    }

    this.setState({[id]: parseInt(value)}, this.handleChange)
  }

  _onFocus = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    evt.target.select()
  }

  handleChange = () => {
    const {onChange} = this.props

    const {hours, minutes, seconds} = this.state
    onChange && onChange(((hours || 0) * 3600) + ((minutes || 0) * 60) + (seconds || 0))
  }

  componentDidUpdate (prevProps: Props) {
    const {seconds, showSeconds} = this.props
    if (seconds !== prevProps.seconds && seconds !== null && seconds !== undefined) {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor(seconds / 60 % 60)
      const remainingSeconds = seconds - hours * 3600 - minutes * 60

      this.setState({minutes, hours, seconds: showSeconds ? remainingSeconds : 0})
    }
  }

  render () {
    const {seconds: initialSeconds, showSeconds, standaloneInput, style, ...otherProps} = this.props
    const {hours, minutes, seconds} = this.state

    const defaultValue = typeof minutes === 'undefined' && typeof hours === 'undefined' ? '' : '00'
    const separatorStyle = {zIndex: 9, position: 'relative', left: -2.5, fontWeight: 900}
    const minuteSecondInputStyle = {
      borderBottomRightRadius: standaloneInput ? 3 : 0,
      borderLeft: 'none',
      borderRadius: 0,
      borderTopRightRadius: standaloneInput ? 3 : 0,
      marginLeft: -5,
      ...style
    }

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
        <span style={separatorStyle}>:</span>
        <FormControl
          {...otherProps}
          id='minutes'
          onChange={this._onChange}
          onFocus={this._onFocus}
          onKeyDown={this._onKeyDown}
          placeholder={'mm'}
          style={{...minuteSecondInputStyle, width: '6.5ch'}}
          value={minutes && minutes < 10 ? `0${minutes}` : minutes || defaultValue}
        />
        {showSeconds && <>
          <span style={separatorStyle}>:</span>
          <FormControl
            {...otherProps}
            id='seconds'
            onChange={this._onChange}
            onFocus={this._onFocus}
            onKeyDown={this._onKeyDown}
            placeholder={'ss'}
            style={{...minuteSecondInputStyle, width: '5.5ch'}}
            value={seconds || defaultValue}
          />
        </>
        }
      </span>
    )
  }
}
