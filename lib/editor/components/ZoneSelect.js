import React, {PropTypes, Component} from 'react'
import Select from 'react-select'

export default class ZoneSelect extends Component {
  static propTypes = {
    value: PropTypes.any
  }

  state = {}

  // _filterZoneOptions adds "Create new zone" custom option when using ZoneSelect to edit stop entities
  _filterZoneOptions = (options, filter, values) => {
    // Filter already selected values
    const valueKeys = values && values.map(i => i.value)
    let filteredOptions = options.filter(option => {
      return valueKeys ? valueKeys.indexOf(option.value) === -1 : []
    })
    // Filter by label
    if (filter !== undefined && filter != null && filter.length > 0) {
      filteredOptions = filteredOptions.filter(option => {
        return RegExp(filter, 'ig').test(option.label)
      })
    }
    // Append Addition option
    if (filteredOptions.length === 0) {
      filteredOptions.push({
        label: <span><strong>Create new zone</strong>: {filter}</span>,
        value: filter,
        create: true
      })
    }
    return filteredOptions
  }

  onChange (option) {
    this.setState({value: option ? option.value : null})
  }

  render () {
    const {addCreateOption, onChange, placeholder, value, zoneOptions} = this.props
    return (
      <Select
        clearable
        placeholder={placeholder || 'Select zone ID...'}
        noResultsText={`No zones found. Specify zones in stop.`}
        value={value || this.state.value}
        onChange={onChange || this.onChange}
        filterOptions={addCreateOption && this._filterZoneOptions}
        options={zoneOptions}
        {...this.props} />
    )
  }
}
