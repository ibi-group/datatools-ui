// @flow

import React, {Component} from 'react'
import { shallowEqual } from 'react-pure-render'
import Select from 'react-select'

import {getComponentMessages} from '../util/config'

type Option = {text: string, value: string}

type Props = {
  clearable?: boolean,
  onChange: Option => void,
  placeholder?: string,
  serviceIds: Array<string>,
  value: ?string
}
type State = {value: ?(string | Option)}

// TODO: this shares a lot of code with TimezoneSelect, move this to a shared component.
export default class GtfsServiceSelect extends Component<Props, State> {
  messages = getComponentMessages('GtfsServiceSelect')

  componentWillMount () {
    this.setState({
      value: this.props.value
    })
  }

  componentWillReceiveProps (nextProps: Props) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
    }
  }

  onChange = (value: Option) => {
    const {onChange} = this.props
    this.setState({value})
    onChange && onChange(value)
  }

  render () {
    const {clearable, placeholder, serviceIds} = this.props
    const options = serviceIds.map(serviceId => ({label: serviceId, value: serviceId})) // Ensure we're passing a string to the select
    return (
      <Select
        ref='gtfsServiceSelect'
        style={{marginBottom: '20px'}}
        filterOptions
        clearable={clearable}
        placeholder={placeholder || this.messages('placeholder')}
        options={options}
        value={this.state.value}
        onChange={this.onChange} />
    )
  }
}
