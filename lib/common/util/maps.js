// @flow

import { Browser } from 'leaflet'

import type {TileLayerProps, MapLayer} from '../../types'

const DEFAULT_MAP_ID = 'mapbox/outdoors-v11'

/**
 * Default map layers for the GTFS editor. (Note: this is defined in the common
 * util file in order to keep all refs to mapbox IDs in a single file.)
 */
export const EDITOR_MAP_LAYERS: Array<MapLayer> = [
  {
    name: 'Vue par défault',
    id: DEFAULT_MAP_ID
  },
  {
    name: 'Clair',
    id: 'mapbox/light-v10'
  },
  {
    name: 'Sombre',
    id: 'mapbox/dark-v10'
  },
  {
    name: 'Satellite',
    id: 'mapbox/satellite-streets-v11'
  }
]

/**
 * Get the default Mapbox tile URL used for use in a leaflet map. Optionally
 * takes a map ID (e.g., mapbox/outdoors-v11).
 */
// eslint-disable-next-line complexity
export function defaultTileLayerProps (mapId: ?string): TileLayerProps {
  // If no mapId is provided, default to id defined in env.yml or, ultimately,
  // fall back on default value.
  const id = mapId || process.env.MAPBOX_MAP_ID || DEFAULT_MAP_ID
  const attribution = process.env.MAPBOX_ATTRIBUTION || `<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a> <a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>`
  const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN
  const MAP_BASE_URL = process.env.MAP_BASE_URL
  if (!MAPBOX_ACCESS_TOKEN && !MAP_BASE_URL) {
    throw new Error('One of Mapbox token or base url must be defined')
  }

  const retina = window.retina || window.devicePixelRatio > 1 || Browser.retina
  const url = process.env.MAP_BASE_URL || `https://api.mapbox.com/styles/v1/${id}/tiles/{z}/{x}/{y}${retina ? '@2x' : ''}?access_token=${MAPBOX_ACCESS_TOKEN || ''}`
  const retinaProps = retina
    ? {tileSize: 512, zoomOffset: -1}
    : {}
  return {
    attribution,
    ...retinaProps,
    url
  }
}
