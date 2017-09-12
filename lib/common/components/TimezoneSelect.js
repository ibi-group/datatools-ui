import React, { PropTypes } from 'react'
import { Glyphicon } from 'react-bootstrap'
import { shallowEqual } from 'react-pure-render'
import Select from 'react-select'

import timezones from '../util/timezones'
import { getComponentMessages, getMessage } from '../util/config'

export default class TimezoneSelect extends React.Component {
  static propTypes = {
    value: PropTypes.string
  }

  state = {
    value: this.props.value
  }

  cacheOptions (options) {
    options.forEach(o => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
      // console.log('props received', nextProps.value)
    }
  }

  renderOption (option) {
    return <span style={{ color: 'black' }}>{option.region ? <Glyphicon glyph='globe' /> : <Glyphicon glyph='option-horizontal' />} {option.label} {option.link}</span>
  }

  onChange = (value) => {
    this.setState({value})
    this.props.onChange && this.props.onChange(value)
  }

  onFocus = (input) => {
    // clear options to onFocus to ensure only valid route/stop combinations are selected
    // this.refs.gtfsSelect.loadOptions('')
  }

  render () {
    // console.log('render search feeds', this.props.feeds)
    const messages = getComponentMessages('TimezoneSelect')

    const options = timezones.map(tz => ({value: tz, label: tz}))

    const placeholder = getMessage(messages, 'placeholder')
    return (
      <Select
        ref='tzSelect'
        tabIndex={this.props.tabIndex ? this.props.tabIndex : null}
        cache={false}
        style={{marginBottom: '20px'}}
        onFocus={this.onFocus}
        filterOptions
        minimumInput={this.props.minimumInput !== null ? this.props.minimumInput : 1}
        clearable={this.props.clearable}
        placeholder={this.props.placeholder || placeholder}
        options={options}
        value={this.state.value}
        onChange={this.onChange} />
    )
  }
}
