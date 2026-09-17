// @flow

import React from 'react'

import type { Entity, GtfsSpecField } from '../../types'

import EditorInput from './EditorInput'

type Props = {
  activeEntity: Entity,
  approveGtfsDisabled: boolean,
  fields: Array<GtfsSpecField>,
  isNotValidMethod: (GtfsSpecField) => any,
  serviceIds: Array<string>
}

const BookingRulesForm = (props: Props) => {
  const {activeEntity, approveGtfsDisabled, fields, isNotValidMethod, serviceIds} = props

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap'
    }}>
      {fields.map((field, index) => (
        <EditorInput
          activeComponent='bookingrule'
          approveGtfsDisabled={approveGtfsDisabled}
          currentValue={activeEntity[field.name]}
          field={field}
          isNotValid={isNotValidMethod(field)}
          key={`${activeEntity.id || ''}-${field.name}`}
          serviceIds={serviceIds}
          {...props}
        />
      ))}
    </div>
  )
}

export default BookingRulesForm
