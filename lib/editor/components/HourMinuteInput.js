import React, {Component, PropTypes} from 'react'
import {FormControl} from 'react-bootstrap'

export default class HourMinuteInput extends Component {
  static propTypes = {
    seconds: PropTypes.number,
    onChange: PropTypes.func,
    style: PropTypes.object
  }

  state = {
    seconds: typeof this.props.seconds === 'undefined' ? '' : this.props.seconds
  }

  onChange = (evt) => {
    const {value} = evt.target
    const seconds = this.convertStringToSeconds(value)
    if (seconds === this.state.seconds) {
      this.setState({string: value})
    } else {
      this.setState({seconds, string: value})
      if (typeof this.props.onChange !== 'undefined') {
        this.props.onChange(seconds)
      }
    }
  }
  convertSecondsToString (seconds) {
    const hours = Math.floor(seconds / 60 / 60)
    const minutes = Math.floor(seconds / 60)
    return seconds ? `${hours}:${minutes < 10 ? '0' + minutes : minutes}` : '00:00'
  }
  convertStringToSeconds (string) {
    const hourMinute = string.split(':')
    // console.log(hourMinute)
    // if both hours and minutes are present
    if (!isNaN(hourMinute[0]) && !isNaN(hourMinute[1])) {
      return (Math.abs(+hourMinute[0]) * 60 * 60) + (Math.abs(+hourMinute[1]) * 60)
    } else if (isNaN(hourMinute[0])) {
      // if less than one hour
      return Math.abs(+hourMinute[1]) * 60
    } else if (isNaN(hourMinute[1])) {
      // if minutes are not present
      return Math.abs(+hourMinute[0]) * 60 * 60
    } else {
      // if no input
      return 0
    }
  }
  render () {
    const {style} = this.props
    const {seconds, string} = this.state
    return (
      <FormControl
        {...this.props}
        value={typeof string !== 'undefined' ? string : this.convertSecondsToString(seconds)}
        placeholder={'hh:mm'}
        style={style}
        onChange={this.onChange} />
    )
  }
}
