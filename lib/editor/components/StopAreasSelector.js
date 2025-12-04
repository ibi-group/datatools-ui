// @flow

// $FlowFixMe React hook bindings not picked up
import React, { useState } from 'react'
import Icon from '@conveyal/woonerf/components/icon'
import { Button } from 'react-bootstrap'

import type { GtfsArea, GtfsStop } from '../../types'

import VirtualizedEntitySelect from './VirtualizedEntitySelect'

type Props = {
  areas: Array<GtfsArea>,
  currentValue: Array<string> | string,
  disabled?: boolean,
  processFieldChange: (val: any) => void
}

const StopAreasSelector = ({ currentValue, areas, disabled = false, processFieldChange }: Props) => {
  const [dropdownShowing, setDropdownShowing] = useState(false)
  const getAreaName =
    (entityId) => {
      const entity = areas.find((area) => area.area_id === entityId)
      const name = entity && entity.area_name ? entity.area_name : entityId
      return `${name}`
    }

  const deleteEntity = (entityId) => {
    if (typeof currentValue === 'string') return

    const filtered = currentValue.filter(id => id !== entityId)
    const newValue = filtered.length > 1 ? filtered.join('§') : (filtered[0] || '')
    processFieldChange(newValue)
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gap: 5,
        gridTemplateColumns: '6fr 1fr',
        marginBottom: 5
      }}>
        {currentValue && typeof currentValue !== 'string' &&
          currentValue.map((l) => (
            <React.Fragment key={l}>
              <span>{getAreaName(l)}</span>
              <Button bsSize='small' bsStyle='danger' style={{padding: '0 2px', margin: '0 1ch'}} onClick={() => deleteEntity(l)}>
                <Icon type='trash' />
              </Button>
            </React.Fragment>
          ))}
      </div>
      {!dropdownShowing && !(areas.length === 0) && <Button
        block
        bsSize='small'
        disabled={disabled}
        onClick={() => setDropdownShowing(true)}
      >
        <Icon type='plus' /> Add stop or area by name
      </Button>}
      {dropdownShowing && <VirtualizedEntitySelect
        component={'stop or area'}
        entityKey={'stop_or_area_id'}
        entities={[
          ...areas
          // $FlowFixMe Flow struggles with union types
        ].filter((stopOrArea: GtfsStop | GtfsArea) => {
          return !currentValue || !currentValue.includes(
            // $FlowFixMe making this flow compatible would introduce a lot of unneeded code
            stopOrArea.stop_id || stopOrArea.area_id
          )
        })}
        onChange={(change) => {
          const selectedId = change.entity.stop_id || change.entity.area_id || change.entity.network_id
          const valuesArray = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])
          const newValue = [...valuesArray, selectedId].filter(Boolean).join('§')
          processFieldChange(newValue)
          setDropdownShowing(false)
        }}
      />}
    </>
  )
}

export default StopAreasSelector
