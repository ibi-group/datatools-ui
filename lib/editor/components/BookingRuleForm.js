// @flow

import React, {Component} from 'react'
import FlipMove from 'react-flip-move'

import type { Entity, GtfsSpecField } from '../../types'

import EditorInput from './EditorInput'

type Props = {
  activeEntity: Entity,
  approveGtfsDisabled: boolean,
  fields: Array<GtfsSpecField>,
  isNotValidMethod: (GtfsSpecField) => any
}

type State = {
  updatePrevented: boolean,
}

export default class BookingRulesForm extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {updatePrevented: false}
  }

  _preventUpdate = () => {
    this.setState({updatePrevented: true})
  }

  render () {
    const {activeEntity, approveGtfsDisabled, fields, isNotValidMethod} = this.props
    const priorFields = fields.filter(f => f.name.includes('prior'))
    const otherFields = fields.filter(f => !f.name.includes('prior'))
    // $FlowFixMe: Need entity check for BookingRule
    const hidePriorFields = !activeEntity.booking_type || activeEntity.booking_type === '0' // TODO: make these a true enum value?
    // $FlowFixMe: Need entity check for BookingRule
    const priorFieldsEmpty = activeEntity.booking_type && !Object.keys(activeEntity).some(key => key.includes('prior') && activeEntity[key]) // 0's are strings here so truthy check is fine.

    if (this.state.updatePrevented && priorFieldsEmpty) {
      this.setState({updatePrevented: false})
    }

    return (
      <div>
        {otherFields.map((field, index) => {
          // if we are immediately after booking_type and we're not hiding these fields ... render our custom component
          if (field.name === 'booking_type') {
            return <>
              <EditorInput
                activeComponent='bookingrule'
                // $FlowFixMe: need to check entity is BookingRule
                currentValue={activeEntity[field.name]}
                field={field}
                approveGtfsDisabled={approveGtfsDisabled}
                isNotValid={isNotValidMethod(field)}
                key={field.name}
                preventUpdate={this._preventUpdate}
                updatePrevented={this.state.updatePrevented}
                {...this.props} />
              {!hidePriorFields && priorFields.map((priorField, index) => (
                <FlipMove appearAnimation='accordionVertical'>
                  <EditorInput
                    activeComponent='bookingrule'
                    approveGtfsDisabled={approveGtfsDisabled}
                    currentValue={activeEntity[priorField.name]}
                    field={priorField}
                    isNotValid={isNotValidMethod(priorField)}
                    {...this.props}
                    key={index}
                  />
                </FlipMove>
              ))}
            </>
          }
          return <EditorInput
            activeComponent='bookingrule'
            field={field}
            currentValue={activeEntity[field.name]}
            approveGtfsDisabled={approveGtfsDisabled}
            isNotValid={isNotValidMethod(field)}
            key={field.name}
            {...this.props} />
        })}
      </div>
    )
  }
}
