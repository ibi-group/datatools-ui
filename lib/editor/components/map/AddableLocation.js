// @flow

import React from 'react'
import { FeatureGroup, Polygon, Polyline, Popup } from 'react-leaflet'

import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import AddPatternStopDropdown from '../pattern/AddPatternStopDropdown'
import type { GtfsLocation, Pattern } from '../../../types'
import { groupLocationShapePoints } from '../../util/location'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  location: GtfsLocation,
};

/**
 * This component is the location equivalent of AddableStop.
 * It renders the location on the map and provides a popup with further options
 */
const AddableLocation = (props: Props) => {
  const { activePattern, addStopToPattern, location } = props
  const stopName = `${location.stop_name || ''} (${location.location_id})`

  const Shape = location.geometry_type === 'polygon' ? Polygon : Polyline
  const groupedLocationShapePts = groupLocationShapePoints(location.location_shapes)

  return (
    <FeatureGroup>
      {groupedLocationShapePts &&
          Object.keys(groupedLocationShapePts).map((key) => (
            <Shape
              fillOpacity={0.15}
              key={key}
              opacity={0.25}
              positions={groupedLocationShapePts[key]}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <h5>{stopName}</h5>
                  <AddPatternStopDropdown
                    activePattern={activePattern}
                    addStopToPattern={addStopToPattern}
                    label='Add location'
                    stop={location}
                  />
                </div>
              </Popup>
            </Shape>
          ))}
    </FeatureGroup>
  )
}

export default AddableLocation
