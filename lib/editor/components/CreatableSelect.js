// @flow

// created following react-select docs: https://react-select.com/creatable

// $FlowFixMe React hook bindings not picked up
import React, { useState } from 'react'
import {Creatable} from 'react-select'

type Props = {
    disabled: boolean,
    onChange: (val: any) => void,
    options: Array<string>,
    placeholder: string,
    value: string
}

const createOption = (label: string) => ({
  label,
  value: label
})

const CreatableSelect = ({
  value,
  options,
  disabled,
  placeholder,
  onChange
}: Props) => {
  const [selectedValue, setSelectedValue] = useState(value || null)
  const [availableOptions, setOptions] = useState(options.map(o => createOption(o)) || [])

  return (
    <Creatable
      isDisabled={disabled}
      onChange={(option) => {
        onChange(option.value || null)
        setSelectedValue(option.value || null)
      }}
      onCreateOption={(inputValue) => {
        onChange(inputValue)
        setSelectedValue(inputValue)
        setOptions([...availableOptions, createOption(inputValue)])
      }}
      placeholder={placeholder}
      options={availableOptions}
      value={selectedValue}
    />
  )
}

export default CreatableSelect
