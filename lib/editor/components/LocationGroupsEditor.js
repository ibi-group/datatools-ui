// @flow

// $FlowFixMe React hook bindings not picked up
import React, { useState } from 'react'
import Icon from '@conveyal/woonerf/components/icon'
import { Button } from 'react-bootstrap'
import uuidv4 from 'uuid/v4'

import type { GtfsLocation, GtfsStop } from '../../types'

import VirtualizedEntitySelect from './VirtualizedEntitySelect'

type Props = {
  currentValue: Array<string> | string,
  locations: Array<GtfsLocation>,
  processFieldChange: (val: any) => void,
  stops: Array<GtfsStop>
}

// $FlowFixMe Flow wants the default value to be both an array and a string
const LocationGroupsEditor = ({ currentValue, locations, processFieldChange, stops }: Props) => {
  const [dropdownShowing, setDropdownShowing] = useState(false)
  const getStationOrLocationName =
    (haltId) => {
      const entity =
        stops.find((stop) => stop.stop_id === haltId) ||
        locations.find((location) => location.location_id === haltId)
      const name = entity && entity.stop_name ? entity.stop_name : ''
      const codeOrId = entity && entity.stop_code ? entity.stop_code : haltId
      return `${name} (${codeOrId})`
    }

  const deleteHalt = (haltId) => {
    if (typeof currentValue === 'string') return

    processFieldChange(
      currentValue.filter(id => id !== haltId)
    )
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
              <span>{getStationOrLocationName(l)}</span>
              <Button bsSize='small' bsStyle='danger' style={{padding: '0 2px', margin: '0 1ch'}} onClick={() => deleteHalt(l)}>
                <Icon type='trash' />
              </Button>
            </React.Fragment>
          ))}
      </div>
      {!dropdownShowing && !(stops.length === 0 && locations.length === 0) && <Button
        block
        bsSize='small'
        onClick={() => setDropdownShowing(true)}
      >
        <Icon type='plus' /> Add stop or location by name
      </Button>}
      {dropdownShowing && <VirtualizedEntitySelect
        component={'stop or location'}
        entityKey={'stop_or_location_id'}
        entities={[
          ...stops,
          ...locations.map((l) =>
            // id is needed here to avoid conflicts with stop ids
            ({ ...l, id: uuidv4() })
          )
          // $FlowFixMe Flow struggles with union types
        ].filter((stopOrLocation: GtfsStop | GtfsLocation) => {
          return !currentValue || !currentValue.includes(
            // $FlowFixMe making this flow compatible would introduce a lot of unneeded code
            stopOrLocation.stop_id || stopOrLocation.location_id
          )
        })}
        onChange={(change) => {
          processFieldChange([
            ...(currentValue || []),
            change.entity.stop_id || change.entity.location_id
          ])
          setDropdownShowing(false)
        }}
      />}
    </>
  )
}

export default LocationGroupsEditor
