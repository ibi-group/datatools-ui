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

export default class ZoneSelect extends Component<Props, State> {
  static defaultProps = {
    placeholder: 'Seleccionar ID de zona...'
  }

  state = {
    value: null
  }

  /**
   * NOTE: this method adds "Create new zone" custom option when using
   * ZoneSelect to edit stop entities.
   */
  _filterZoneOptions = (options: Array<ZoneOption>, filter: string, values: Array<ZoneOption>) => {
    // Filter options on already selected values
    const valueKeys = values && values.map(i => i.value)
    let filteredOptions: Array<ZoneOption> = valueKeys
      ? options.filter(option => valueKeys.indexOf(option.value) === -1)
      : options
    if (filter !== undefined && filter != null && filter.length > 0) {
      // Filter options on labels
      filteredOptions = filteredOptions
        .filter(option => RegExp(filter, 'ig').test(option.label))
    }
    // Append Addition option
    if (filteredOptions.length === 0) {
      filteredOptions.push({
        label: <span><strong>Crear nueva zona</strong>: {filter}</span>,
        value: filter,
        create: true
      })
    }
    return filteredOptions
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
        data-test-id='fare-zone-selector'
        filterOptions={filterOptions}
        noResultsText={`No se encontraron zonas. Especificar zonas en parada.`}
        onChange={onChange || this._onChange}
        options={options}
        placeholder={placeholder}
        value={value || this.state.value} />
    )
  }
}
