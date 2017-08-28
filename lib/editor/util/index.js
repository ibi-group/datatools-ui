// @flow

import {getAbbreviatedStopName} from './gtfs'
import {getConfigProperty} from '../../common/util/config'

import type {
  Feed,
  GtfsStop,
  Pattern,
  Project,
  TimetableColumn,
  Trip,
  User,
  ZoneInfo
} from '../../types'

export const CLICK_OPTIONS: Array<string> = [
  'DRAG_HANDLES',
  'ADD_STOP_AT_CLICK',
  'ADD_STOPS_AT_INTERVAL',
  'ADD_STOPS_AT_INTERSECTIONS'
]
export const YEAR_FORMAT: string = 'YYYY-MM-DD'
export const EXEMPLARS: Array<string> = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'NO_SERVICE',
  'CUSTOM',
  'SWAP'
]

export function getTimetableColumns (
  pattern: Pattern,
  stops: Array<GtfsStop>
): Array<TimetableColumn> {
  const columns = [
    {
      name: 'Block ID',
      width: 60,
      key: 'blockId',
      type: 'TEXT',
      placeholder: '300'
    },
    {
      name: 'Trip ID',
      width: 200,
      key: 'gtfsTripId',
      type: 'TEXT',
      placeholder: '12345678'
    },
    {
      name: 'Trip Headsign',
      width: 200,
      key: 'tripHeadsign',
      type: 'TEXT',
      placeholder: 'Destination via Transfer Center'
    }
  ]
  if (pattern && pattern.patternStops) {
    if (!pattern.useFrequency) {
      pattern.patternStops.map((ps, index) => {
        const stop = stops ? stops.find(st => st.id === ps.stopId) : null
        const stopName = stop ? stop.stop_name : ps.stopId
        const abbreviatedStopName = stop
          ? getAbbreviatedStopName(stop)
          : ps.stopId
        const TIME_WIDTH = 80
        columns.push({
          name: abbreviatedStopName,
          title: stopName,
          width: TIME_WIDTH,
          key: `stopTimes.${index}.arrivalTime`,
          colSpan: '2',
          // hidden: false,
          type: 'ARRIVAL_TIME',
          placeholder: 'HH:MM:SS'
        })
        columns.push({
          key: `stopTimes.${index}.departureTime`,
          width: TIME_WIDTH,
          // hidden: hideDepartureTimes,
          type: 'DEPARTURE_TIME',
          placeholder: 'HH:MM:SS'
        })
      })
    } else {
      // columns added if using freqency schedule type
      columns.push({
        name: 'Start time',
        width: 100,
        key: 'startTime',
        type: 'TIME',
        placeholder: 'HH:MM:SS'
      })
      columns.push({
        name: 'End time',
        width: 100,
        key: 'endTime',
        type: 'TIME',
        placeholder: 'HH:MM:SS'
      })
      columns.push({
        name: 'Headway',
        width: 60,
        key: 'headway',
        type: 'MINUTES',
        placeholder: '15 (min)'
      })
    }
  }
  return columns
}

export function getStopsForPattern (pattern: Pattern, stops: Array<GtfsStop>): Array<GtfsStop> {
  return pattern && pattern.patternStops && stops
    ? pattern.patternStops.map(ps => {
      const foundStop = stops.find(s => s.id === ps.stopId)
      if (!foundStop) throw new Error(`Stop not found`)
      return foundStop
    })
    : []
}

export function sortAndFilterTrips (
  trips: ?Array<Trip>,
  useFrequency: boolean
): Array<Trip> {
  return trips
    ? trips
        .filter(t => t.useFrequency === useFrequency) // filter out based on useFrequency
        .sort((a, b) => {
          if (!a.stopTimes[0].departureTime || !b.stopTimes[0].departureTime) {
            return 0
          } else if (a.stopTimes[0].departureTime < b.stopTimes[0].departureTime) {
            return -1
          } else if (
            a.stopTimes[0].departureTime > b.stopTimes[0].departureTime
          ) {
            return 1
          }
          return 0
        })
    : []
}

export function getZones (
  stops: ?Array<GtfsStop>,
  activeStop: ?GtfsStop
): ZoneInfo {
  const zones = {}
  if (stops) {
    for (var i = 0; i < stops.length; i++) {
      const stop = stops[i]
      const {zone_id} = stop
      // eslint-disable-next-line camelcase
      if (zone_id) {
        let zone = zones[zone_id]
        if (!zone) {
          zone = []
        }
        zone.push(stop)
        zones[zone_id] = zone
      }
    }
    // add any new zone
    if (activeStop && activeStop.zone_id && !zones[activeStop.zone_id]) {
      const {zone_id} = activeStop
      let zone = zones[zone_id]
      if (!zone) {
        zone = []
      }
      zone.push(activeStop)
      zones[zone_id] = zone
    }
  }
  const zoneOptions = Object.keys(zones).map(key => {
    return {
      value: key,
      label: `${key} zone (${zones[key] ? zones[key].length : 0} stops)`
    }
  })
  return {zones, zoneOptions}
}

// used to select the table from gtfs.yml to be used for
// validating and populating fields in editor (EntityDetails)
export function getEditorTable (component: string) {
  return getConfigProperty('modules.editor.spec').find(
    t =>
      component === 'fare' ? t.id === 'fare_attributes' : t.id === component
  )
}

export function canApproveGtfs (project: Project, feedSource: Feed, user: User) {
  return (
    project &&
    feedSource &&
    user &&
    !user.permissions.hasFeedPermission(
      project.organizationId,
      project.id,
      feedSource.id,
      'approve-gtfs'
    )
  )
}
