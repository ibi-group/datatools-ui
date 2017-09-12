import React, {Component, PropTypes} from 'react'
import { FormControl } from 'react-bootstrap'

export default class MinuteSecondInput extends Component {
  static propTypes = {
    seconds: PropTypes.number,
    onChange: PropTypes.func,
    style: PropTypes.object
  }

  state = {
    seconds: typeof this.props.seconds === 'undefined' ? '' : this.props.seconds
  }

  componentWillReceiveProps (nextProps) {
    if (typeof nextProps.seconds !== 'undefined' && this.state.seconds !== nextProps.seconds) {
      this.setState({
        seconds: nextProps.seconds,
        string: this.convertSecondsToString(nextProps.seconds)
      })
    }
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
    const minutes = Math.floor(seconds / 60)
    const sec = seconds % 60
    return seconds
      ? `${minutes}:${sec < 10 ? '0' + sec : sec}`
      : this.state.string
      ? this.state.string
      : '00:00'
  }

  convertStringToSeconds (string) {
    const minuteSecond = string.split(':')
    console.log(minuteSecond)
    if (!isNaN(minuteSecond[0]) && !isNaN(minuteSecond[1])) {
      return (Math.abs(+minuteSecond[0]) * 60) + Math.abs(+minuteSecond[1])
    } else if (isNaN(minuteSecond[0])) {
      return Math.abs(+minuteSecond[1])
    } else if (isNaN(minuteSecond[1])) {
      return Math.abs(+minuteSecond[0] * 60)
    } else {
      return 0
    }
  }

  render () {
    const {seconds, string} = this.state
    return (
      <FormControl
        defaultValue={typeof string !== 'undefined' ? string : this.convertSecondsToString(seconds)}
        placeholder={'mm:ss'}
        style={this.props.style}
        onChange={this.onChange} />
    )
  }
}
