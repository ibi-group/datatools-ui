// @flow

import React, {Component} from 'react'
import Select from 'react-select'

import type {ZoneOption} from '../../types'

type Props = {
  addCreateOption?: boolean,
  onChange: ?ZoneOption => void,
  options: Array<ZoneOption>,
  placeholder: string,
  value: ?ZoneOption
}

type State = {
  value: any
}

export default class FareProductSelect extends Component<Props, State> {
  static defaultProps = {
    placeholder: 'Select fare product ID...'
  }

  state = {
    value: null
  }

  _onChange = (option: ZoneOption) => {
    const value = option ? option.value : null
    this.setState({value})
  }

  render () {
    const {addCreateOption, onChange, placeholder, value, options} = this.props
    const filterOptions = addCreateOption ? this._filterZoneOptions : undefined
    if (value && typeof value === 'string' && !options.find(option => option.value === value)) {
      console.warn(`${value} not found in zone options. Adding to options.`)
      options.push({label: value, value})
    }
    return (
      <Select
        clearable
        data-test-id='fare-product-selector'
        filterOptions={filterOptions}
        noResultsText={`No fare products found.`}
        onChange={onChange || this._onChange}
        options={options}
        placeholder={placeholder}
        value={value || this.state.value} />
    )
  }
}
