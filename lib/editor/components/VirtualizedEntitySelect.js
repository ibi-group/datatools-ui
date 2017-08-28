import React, {Component, PropTypes} from 'react'
import VirtualizedSelect from 'react-virtualized-select'

import { getEntityName } from '../util/gtfs'

export default class VirtualizedEntitySelect extends Component {
  static propTypes = {
    entities: PropTypes.array,
    component: PropTypes.string,
    entityKey: PropTypes.string
  }

  state = {
    value: this.props.value
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.value !== nextProps.value && typeof this.props.value !== 'undefined') {
      this.setState({value: nextProps.value})
    }
  }

  onChange = (value) => {
    this.setState({value})
    this.props.onChange(value)
  }

  render () {
    const { component, entities, entityKey } = this.props
    const key = entityKey || 'id'
    const options = entities
      ? entities.map(entity => ({
        value: entity[key],
        label: getEntityName(entity) || '[Unnamed]',
        entity
      }))
      : []
    return (
      <VirtualizedSelect
        // maxHeight={500}
        placeholder={`Select ${component}...`}
        options={options}
        searchable
        clearable={typeof this.props.clearable !== 'undefined' ? this.props.clearable : true}
        onChange={this.onChange}
        value={this.state.value}
        style={this.props.style}
        optionRenderer={this.props.optionRenderer} />
    )
  }
}
