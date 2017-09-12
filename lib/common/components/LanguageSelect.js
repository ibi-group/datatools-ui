import React from 'react'
import { shallowEqual } from 'react-pure-render'
import Select from 'react-select'
import ISO6391 from 'iso-639-1'

import { getComponentMessages, getMessage } from '../util/config'

export default class LanguageSelect extends React.Component {
  state = {
    value: this.props.value
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
    }
  }

  _onChange = (value) => {
    this.setState({value})
    this.props.onChange && this.props.onChange(value)
  }

  _getOptions = () => ISO6391.getAllCodes().map(code => ({value: code, label: ISO6391.getName(code)}))

  render () {
    const messages = getComponentMessages('LanguageSelect')
    const placeholder = getMessage(messages, 'placeholder')
    return (
      <Select
        ref='langSelect'
        tabIndex={this.props.tabIndex ? this.props.tabIndex : null}
        cache={false}
        style={{marginBottom: '20px'}}
        filterOptions
        minimumInput={this.props.minimumInput !== null ? this.props.minimumInput : 1}
        clearable={this.props.clearable}
        placeholder={this.props.placeholder || placeholder}
        options={this._getOptions()}
        value={this.state.value}
        onChange={this._onChange} />
    )
  }
}
