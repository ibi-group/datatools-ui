// @flow

import React, {Component} from 'react'
import Select from 'react-select'

// FLEX TODO: double check Location Group Option Type
import type {LocationGroupOption} from '../../types'

type Props = {
  addCreateOption?: boolean,
  onChange: ?LocationGroupOption => void,
  options: Array<LocationGroupOption>,
  placeholder: string,
  value: ?LocationGroupOption
}

type State = {
  value: any
}

/**
 * This component presents a searchable dropdown of location groups
 */
export default class LocationGroupSelect extends Component<Props, State> {
  static defaultProps = {
    placeholder: 'Select location group ID...'
  }

  state = {
    value: null
  }

  /**
   * NOTE: this method adds "Create new location group" custom option when using
   * ZoneSelect to edit stop entities.
   */
  _filterLocationGroupOptions = (options: Array<LocationGroupOption>, filter: string, values: Array<LocationGroupOption>) => {
    // Filter options on already selected values
    const valueKeys = values && values.map(val => val.value)
    let filteredOptions: Array<LocationGroupOption> = valueKeys
    // If valueKeys exist, filter options down to only those that apply to values not in valueKeys
      ? options.filter(option => valueKeys.indexOf(option.value) === -1)
      : options // Otherwise keep all options
    if (filter != null && filter.length > 0) { // != null condition checks both undefined and null
      // Filter options on labels
      filteredOptions = filteredOptions
        .filter(option => RegExp(filter, 'ig').test(option.label)) // We search for the filter text, ignoring casing in the option label
    }
    // Creating a new group isn't a location group, so must be manually appended
    if (filteredOptions.length === 0) {
      filteredOptions.push({
        create: true,
        label: <span><strong>Create new location group</strong>: {filter}</span>,
        value: filter
      })
    }
    return filteredOptions
  }

  _onChange = (option: LocationGroupOption) => {
    const value = option ? option.value : null
    this.setState({value})
  }

  render () {
    const {addCreateOption, onChange, options, placeholder, value} = this.props
    const filterOptions = addCreateOption ? this._filterLocationGroupOptions : undefined
    if (value && typeof value === 'string' && !options.find(option => option.value === value)) {
      console.warn(`${value} not found in location group options. Adding to options.`)
      options.push({label: value, value})
    }
    return (
      <Select
        clearable
        data-test-id='location-group-selector'
        filterOptions={filterOptions}
        noResultsText={'No location groups found. Specify location groupings in stops/locations.'}
        onChange={onChange || this._onChange}
        options={options}
        placeholder={placeholder}
        value={value || this.state.value}
      />
    )
  }
}
