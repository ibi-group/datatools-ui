// @flow
import type { LatLng } from 'leaflet'

import type { LocationShape, Pattern, PatternHalt, PatternLocation, PatternLocationGroup, PatternStop } from '../../types'

export const groupLocationShapePoints = (locationShapes: LocationShape) => locationShapes
  .reduce(
    (acc, cur) => {
      const coordinates = [cur.geometry_pt_lat, cur.geometry_pt_lon]

      if (!acc[cur.geometry_id]) acc[cur.geometry_id] = [coordinates]
      else acc[cur.geometry_id].push(coordinates)
      return acc
    },
    {}
  )

export const convertLatLngToArray = (latlng: LatLng) => [latlng.lat, latlng.lng]

export const patternHaltIsLocation = (
  patternStopOrLocation: PatternHalt
): PatternLocation =>
  // $FlowFixMe Flow doesn't understand type check
  patternStopOrLocation.hasOwnProperty('locationId') && !patternStopOrLocation.hasOwnProperty('locationGroupId') ? patternStopOrLocation : undefined

export const getPatternHaltId = (
  patternHalt: PatternHalt | null
): string | null => {
  if (!patternHalt) return null
  // $FlowFixMe Flow doesn't understand type check
  if (patternHaltIsStop(patternHalt)) return patternHalt.stopId
  // $FlowFixMe Flow doesn't understand type check
  return patternHaltIsLocation(patternHalt) ? patternHalt.locationId : patternHalt.locationGroupId
}

export const patternHaltIsLocationGroup = (
  patternStopOrLocation: PatternHalt
): PatternLocationGroup =>
  // $FlowFixMe Flow doesn't understand type check
  patternStopOrLocation.hasOwnProperty('locationGroupId') ? patternStopOrLocation : undefined

export const patternHaltIsStop = (
  patternStopOrLocation: PatternHalt
): PatternStop =>
  // $FlowFixMe Flow doesn't understand type check
  patternStopOrLocation.hasOwnProperty('stopId') ? patternStopOrLocation : undefined

export const activePatternHasLocations = (pattern: Pattern) => pattern.patternLocations.length > 0 || pattern.patternLocationGroupStops.length > 0

export const getLayerCoords = (isPolygon: boolean, coordSet: any) => isPolygon ? coordSet[0].map(convertLatLngToArray) : coordSet.map(convertLatLngToArray)

export const layerHasContent = (layer: any) =>
  layer !== null &&
  typeof layer === 'object' &&
  layer.hasOwnProperty('_leaflet_id') &&
  layer.hasOwnProperty('_latlngs')
