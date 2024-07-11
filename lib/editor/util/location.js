// @flow
import type { LatLng } from 'leaflet'

import type { LocationShape, Pattern, PatternStop } from '../../types'

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

export const getLayerCoords = (isPolygon: boolean, coordSet: any) => isPolygon ? coordSet[0].map(convertLatLngToArray) : coordSet.map(convertLatLngToArray)

export const layerHasContent = (layer: any) =>
  layer !== null &&
  typeof layer === 'object' &&
  layer.hasOwnProperty('_leaflet_id') &&
  layer.hasOwnProperty('_latlngs')
