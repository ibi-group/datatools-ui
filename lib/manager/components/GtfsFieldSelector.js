// @flow

import React from 'react'
import Select from 'react-select'

import { getGtfsSpec, getGtfsPlusSpec, isModuleEnabled } from '../../common/util/config'

import type { GtfsSpecTable, ReactSelectOption } from '../../types'

type GtfsFieldSelectorProps = {
  onChange: (ReactSelectOption => void),
  selectedField: ?string,
  tableName: ?string
}

/**
 * Obtains the desired table from the provided GTFS/GTFS plus spec.
 */
function getTableFromSpec (spec: Array<GtfsSpecTable>, specName: string, tableName: string): ?GtfsSpecTable {
  if (!spec) {
    throw new Error(`${specName} n'a pas été trouvé!`)
  }
  const tableFile = `${tableName}.txt`
  return spec.find(t => t.name === tableFile)
}

/**
 * Obtains the desired GTFS spec table.
 */
function getGtfsTableSpec (tableName: string): ?GtfsSpecTable {
  return getTableFromSpec(getGtfsSpec(), 'GTFS spec', tableName)
}

/**
 * Obtains the desired GTFS Plus spec table (if the GTFS Plus module is enabled).
 */
function getGtfsPlusTableSpec (tableName: string): ?GtfsSpecTable {
  return isModuleEnabled('gtfsplus')
    ? getTableFromSpec(getGtfsPlusSpec(), 'GTFS Plus spec', tableName)
    : null
}

/**
 * Dropdown selector to select a field from a given GTFS table.
 */
const GtfsFieldSelector = (props: GtfsFieldSelectorProps) => {
  const { onChange, selectedField, tableName } = props
  let options = []
  let placeholder = 'Sélectionner une table'
  if (tableName) {
    const table = getGtfsTableSpec(tableName) || getGtfsPlusTableSpec(tableName)
    options = table && table.fields.map(field => ({ label: field.name, value: field.name }))
    placeholder = 'Choisir un champ à normaliser'
  }

  return (
    <Select
      clearable={false}
      disabled={!tableName}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      style={{margin: '10px 0px', width: '230px'}}
      value={selectedField}
    />
  )
}

export default GtfsFieldSelector
