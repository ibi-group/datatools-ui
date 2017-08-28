import React, { Component, PropTypes } from 'react'
import { FormControl } from 'react-bootstrap'

import modes from '../modes'

export default class ModeSelector extends Component {
  static propTypes = {
    feeds: PropTypes.array,
    entity: PropTypes.object,
    entityUpdated: PropTypes.func
  }

  _onChange = (evt) => this.props.entityUpdated(this.props.entity, 'MODE', this.getMode(evt.target.value))

  getMode = (id) => modes.find((mode) => mode.gtfsType === +id)

  render () {
    const {entity} = this.props
    return (
      <div>
        <FormControl
          componentClass='select'
          value={entity.mode.gtfsType}
          onChange={this._onChange}>
          {modes.map((mode, i) => (
            <option key={i} value={mode.gtfsType}>{mode.name}</option>
          ))}
        </FormControl>
      </div>
    )
  }
}
