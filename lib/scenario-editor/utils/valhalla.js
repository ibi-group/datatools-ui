// @flow

import fetch from 'isomorphic-fetch'
import {decode as decodePolyline} from 'polyline'
import {isEqual as coordinatesAreEqual} from '@conveyal/lonlat'
import lineString from 'turf-linestring'

import type {LatLng} from '../../types'

type SignText = {
  text: string
}

type Maneuver = {
  begin_shape_index: number,
  begin_street_names?: Array<string>,
  end_shape_index: number,
  instruction: string,
  length: number,
  sign?: {
    exit_branch_elements?: Array<SignText>,
    exit_number_elements?: Array<SignText>,
    exit_toward_elements?: Array<SignText>
  },
  street_names?: Array<string>,
  time: number,
  toll?: boolean,
  travel_mode: string,
  travel_type: string,
  type: number,
  verbal_multi_cue?: boolean,
  verbal_post_transition_instruction?: string,
  verbal_pre_transition_instruction: string,
  verbal_transition_alert_instruction?: string
}

type Leg = {
  shape: string,
  summary: {
    max_lon: number,
    max_lat: number,
    time: number,
    length: number,
    min_lat: number,
    min_lon: number
  },
  maneuvers: Array<Maneuver>
}

type Location = {
  street: string,
  lon: number,
  lat: number,
  type: string
}

type ValhallaResponse = {
  id: string,
  trip: {
    language: string,
    summary: {
      max_lon: number,
      max_lat: number,
      time: number,
      length: number,
      min_lat: number,
      min_lon: number
    },
    locations: Array<Location>,
    units: string,
    legs: Array<Leg>,
    status_message: string,
    status: number
  }
}

export function route (points: Array<LatLng>): ?Promise<ValhallaResponse> {
  if (points.length < 2) {
    console.warn('need at least two points to route with mapzen', points)
    return null
  }
  if (!process.env.MAPZEN_TURN_BY_TURN_KEY) {
    throw new Error('MAPZEN_TURN_BY_TURN_KEY not set')
  }
  const MAPZEN_TURN_BY_TURN_KEY: string = process.env.MAPZEN_TURN_BY_TURN_KEY
  const locations = points.map(p => ({lon: p.lng, lat: p.lat}))
  const json = {
    costing: 'bus',
    locations
  }
  return fetch(
    `https://valhalla.mapzen.com/route?json=${JSON.stringify(
      json
    )}&api_key=${MAPZEN_TURN_BY_TURN_KEY}`
  ).then(res => res.json())
}

export async function polyline (
  points: Array<LatLng>
): Promise<?Array<[number, number]>> {
  let json
  try {
    json = await route(points)
  } catch (e) {
    console.log(e)
    return null
  }
  if (json && json.trip) {
    const legArray = json.trip.legs.map((leg, index) => {
      const ignorePoints = {}
      for (var i = 0; i < leg.maneuvers.length; i++) {
        if (leg.maneuvers[i].type === 5 || leg.maneuvers[i].type === 6) {
          ignorePoints.from = leg.maneuvers[i].begin_shape_index
          ignorePoints.to = leg.maneuvers[i].end_shape_index
        }
      }
      return decodePolyline(leg.shape)
        .filter(
          (c, index) =>
            !(index === ignorePoints.from || index === ignorePoints.to)
        ) // filter out points used for destination on right/left
        .map((c: Coordinate, index) => [c[1] / 10, c[0] / 10]) // Mapzen or Mapbox is encoding/decoding wrong?
    })
    return [].concat.apply([], legArray)
  } else {
    return null
  }
}

export async function getSegment (
  points: Array<LatLng>,
  followRoad: boolean,
  defaultToStraightLine: boolean = true
): Promise<?{
  type: 'LineString',
  coordinates: Array<[number, number]>
}> {
  let geometry
  if (followRoad) {
    // if followRoad
    const coordinates = await polyline(
      points.map(p => ({lng: p[0], lat: p[1]}))
    ) // [{lng: from[0], lat: from[1]}, {lng: to[0], lat: to[1]}])
    if (!coordinates) {
      if (defaultToStraightLine) {
        geometry = lineString(points).geometry
      } else {
        return null
      }
    } else {
      const c0 = coordinates[0]
      const epsilon = 1e-6
      if (!coordinatesAreEqual(c0, points[0], epsilon)) {
        coordinates.unshift(coordinates[0])
      }
      geometry = {
        type: 'LineString',
        coordinates
      }
    }
  } else {
    geometry = lineString(points).geometry
  }
  return geometry
}
