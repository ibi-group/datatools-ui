// @flow

import lineString from 'turf-linestring'
import fetch from 'isomorphic-fetch'
import ll from '@conveyal/lonlat'
import lineDistance from 'turf-line-distance'
import pointOnLine from 'turf-point-on-line'
import lineSlice from 'turf-line-slice'
import point from 'turf-point'

import {getSegment} from '../../scenario-editor/utils/valhalla'
import {generateUID} from '../../common/util/util'
import {getConfigProperty} from '../../common/util/config'
import {reverseEsri as reverse} from '../../scenario-editor/utils/reverse'

import type {
  ControlPoint,
  Feed,
  GeoJsonPoint,
  GtfsStop,
  LatLng,
  Pattern,
  Point,
  StopTime
} from '../../types'

type MapLayer = {
  id: string,
  name: string
}

export const MAP_LAYERS: Array<MapLayer> = [
  {
    name: 'Streets',
    id: 'mapbox.streets'
  },
  {
    name: 'Light',
    id: 'mapbox.light'
  },
  {
    name: 'Dark',
    id: 'mapbox.dark'
  },
  {
    name: 'Satellite',
    id: 'mapbox.streets-satellite'
  }
]

export function stopToStopTime (stop: GtfsStop): StopTime {
  if (!stop.id) throw new Error('This Stop does not have the required `id` key.')
  return {stopId: stop.id, defaultDwellTime: 0, defaultTravelTime: 0}
}

export function clickToLatLng (
  latlng: LatLng
): {stop_lat: number, stop_lon: number} {
  const precision = 100000000 // eight decimal places is accurate up to 1.1 meters
  return {
    stop_lat: Math.round(latlng.lat * precision) / precision,
    stop_lon: Math.round(latlng.lng % 180 * precision) / precision
  }
}

export function newControlPoint (
  distance: number,
  point: Point,
  permanent: boolean = false,
  props: any = {}
): ControlPoint {
  return {
    distance,
    id: generateUID(),
    permanent,
    point,
    ...props
  }
}

export async function constructStop (latlng: LatLng, feedId: string): Promise<GtfsStop> {
  const stopLatLng = clickToLatLng(latlng)
  const result = await reverse(latlng)
  const stopId = generateUID()
  let stopName = `New Stop (${stopId})`
  if (result && result.address) {
    stopName = result.address.Address
  }
  return {
    stop_id: stopId,
    stop_name: stopName,
    feedId,
    ...stopLatLng
  }
}

export function constructPoint (latlng: LatLng): GeoJsonPoint {
  const coords = ll.toCoordinates(latlng)
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coords
    }
  }
}

export async function route (from: LatLng, to: LatLng): Promise<any> {
  const url = `${getConfigProperty(
    'application.r5'
  )}/plan?fromLat=${from.lat}&fromLon=${from.lng}&toLat=${to.lat}&toLon=${to.lng}&mode=CAR&full=false`
  const response = await fetch(url)
  return await response.json()
}

export async function street (from: LatLng, to: LatLng): Promise<any | null> {
  let json
  try {
    json = await route(from, to)
  } catch (e) {
    return null
  }
  if (json.errors) {
    console.log('error getting r5 data', json)
    return null
  } else {
    return json
  }
}

export function getPatternEndPoint (pattern: Pattern): LatLng {
  const coordinates = pattern.shape && pattern.shape.coordinates
  const patternStops = [...pattern.patternStops]
  let endPoint
  if (coordinates) {
    endPoint = ll.toLeaflet(coordinates[coordinates.length - 1])
  } else {
    if (!patternStops[0].stop_lon || !patternStops[0].stop_lat) {
      throw new Error('Pattern stop is missing coordinates')
    }
    endPoint = {lng: patternStops[0].stop_lon, lat: patternStops[0].stop_lat}
  }
  return endPoint
}

export function getFeedBounds (
  feedSource: Feed,
  pad: number = 0
): [[number, number], [number, number]] {
  return feedSource &&
  feedSource.latestValidation &&
  feedSource.latestValidation.bounds
    ? [
      [
        feedSource.latestValidation.bounds.north + pad,
        feedSource.latestValidation.bounds.west - pad
      ],
      [
        feedSource.latestValidation.bounds.south - pad,
        feedSource.latestValidation.bounds.east + pad
      ]
    ]
    : [[60, 60], [-60, -20]]
}

// skipping flow typing because this was refactored in another PR
export async function handlePatternEdit (
  // $FlowFixMe
  position,
  // $FlowFixMe
  begin,
  // $FlowFixMe
  end,
  // $FlowFixMe
  pattern,
  // $FlowFixMe
  followStreets,
  // $FlowFixMe
  patternCoordinates,
  // $FlowFixMe
  defaultToStraightLine = true
) {
  let originalLatLngs
  let originalEndPoint
  let from, to
  const coords = position && ll.toCoordinates(position)

  // set from, to for endPoint if we have position
  if (begin && position) {
    from = begin
    to = coords
  } else if (begin) {
    // set just from (when controlPoint is removed)
    from = begin
  } else if (end) {
    // set from for beginPoint
    from = coords
  } else {
    // otherwise use the original endpoint
    originalLatLngs = pattern.shape.coordinates.map(c => [c[1], c[0]])
    originalEndPoint = originalLatLngs[originalLatLngs.length - 1]
    from = [originalEndPoint[1], originalEndPoint[0]]
    to = coords
  }

  if (from) {
    // $FlowFixMe
    const points = [from.geometry ? from.geometry.coordinates : from]
    if (to) {
      points.push(to)
    }
    if (end) {
      points.push(end.geometry.coordinates)
    }
    let newCoordinates
    const newSegment = await getSegment(
      points,
      followStreets,
      defaultToStraightLine
    )
    const originalSegment = lineString(patternCoordinates)

    // slice line if middle control point
    if (end && begin) {
      const beginPoint = point(patternCoordinates[0])
      const beginSlice = lineSlice(beginPoint, from, originalSegment)
      const endPoint = point(patternCoordinates[patternCoordinates.length - 1])
      const endSlice = lineSlice(end, endPoint, originalSegment)
      newCoordinates = [
        ...beginSlice.geometry.coordinates,
        // $FlowFixMe
        ...newSegment.coordinates,
        ...endSlice.geometry.coordinates
      ]
    } else if (end) {
      // handle begin control point
      const endPoint = point(patternCoordinates[patternCoordinates.length - 1])
      const endSlice = lineSlice(end, endPoint, originalSegment)
      newCoordinates = [
        // $FlowFixMe
        ...newSegment.coordinates,
        ...endSlice.geometry.coordinates
      ]
    } else {
      // append latlngs if end control point
      const beginPoint = point(patternCoordinates[0])
      const beginSlice = lineSlice(beginPoint, from, originalSegment)
      newCoordinates = [
        ...beginSlice.geometry.coordinates,
        // $FlowFixMe
        ...newSegment.coordinates
      ]
    }
    return newCoordinates
  }
}

function geojsonFromCoordinates (coordinates) {
  return (
    coordinates && {
      type: 'Feature',
      geometry: {
        coordinates: coordinates,
        type: 'LineString'
      }
    }
  )
}

// skipping flow typing because this was refactored in another PR
// $FlowFixMe
export function getControlPointSnap (controlPointGeoJson, coordinates) {
  const geojson = geojsonFromCoordinates(coordinates)

  // snap control point to line
  const snap = pointOnLine(geojson, controlPointGeoJson)
  const lineSegment = lineSlice(
    point(geojson.geometry.coordinates[0]),
    snap,
    geojson
  )

  // measure line segment
  const distTraveled = lineDistance(lineSegment, 'meters')
  return {snap, distTraveled}
}
