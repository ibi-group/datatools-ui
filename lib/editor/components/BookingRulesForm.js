// @flow

import React, {Component} from 'react'

import type { Entity, GtfsSpecField } from '../../types'

import EditorInput from './EditorInput'

type Props = {
  activeEntity: Entity,
  approveGtfsDisabled: boolean,
  fields: Array<GtfsSpecField>,
  isNotValidMethod: (GtfsSpecField) => any,
  serviceIds: Array<string>
}

export default class BookingRulesForm extends Component<Props> {
  render () {
    const {activeEntity, approveGtfsDisabled, fields, isNotValidMethod, serviceIds} = this.props
    return (
      <div>
        {fields.map((field, index) => (
          <EditorInput
            activeComponent='bookingrule'
            field={field}
            currentValue={activeEntity[field.name]}
            approveGtfsDisabled={approveGtfsDisabled}
            isNotValid={isNotValidMethod(field)}
            key={field.name}
            serviceIds={serviceIds}
            {...this.props}
          />
        ))}
      </div>
    )
  }
}
