// @flow

import React from 'react'

import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import type {EditSettingsState, MapState} from '../../../types/reducers'
import type { GtfsLocation, Pattern } from '../../../types'
import {stopIsOutOfBounds} from '../../util/map'
import { groupLocationShapePoints } from '../../util/location'

import AddableLocation from './AddableLocation'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  editSettings: EditSettingsState,
  locations: Array<GtfsLocation>,
  mapState: MapState
}

/**
 * Renders AddableLocations that should be shown in the current map view.
 * Analagous to AddableStopsLayer
 */
const AddableLocationsLayer = ({activePattern, addStopToPattern, editSettings, locations, mapState}: Props) => {
  const { bounds, zoom } = mapState
  const patternLocationIds = activePattern && activePattern.patternStops
    ? activePattern.patternStops.filter(ps => ps.locationId !== null).map(pl => pl.locationId)
    : []

  const showAddableLocations = locations && activePattern &&
      editSettings.addStops && zoom && zoom > 2 && bounds

  return (
    <div id='addable-locations-layer'>
      {showAddableLocations && locations
        .filter(location => {
          if (!location) return false

          // Filter out locations that don't appear in the bounding box.
          if (stopIsOutOfBounds(location, bounds)) return false
          if (patternLocationIds.indexOf(location.location_id) !== -1) {
            // Filter out locations that exist in activePattern. These stops
            // already have their own markers on the map with popups that
            // have options to add the stops to the pattern again.
            return false
          }
          if (location.id < 0) {
            console.warn(`Location has a negative id, which indicates an unsaved entity that should not be selectable. Filtering out of map view.`, location)
            return false
          }
          return true
        })
        .map(location => {
          const groupedLocationShapePts = groupLocationShapePoints(location.location_shapes)

          return (
            groupedLocationShapePts && Object.keys(groupedLocationShapePts).map(key => {
              return (
                <AddableLocation
                  activePattern={activePattern}
                  addStopToPattern={addStopToPattern}
                  key={key}
                  location={location}
                />
              )
            })
          )
        })
      }
    </div>
  )
}

export default AddableLocationsLayer
