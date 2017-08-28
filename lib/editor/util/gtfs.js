// @flow

import along from 'turf-along'
import lineDistance from 'turf-line-distance'
import {latLngBounds} from 'leaflet'

import {newControlPoint} from './map'
import type {
  ControlPoint,
  Entity,
  GtfsRoute,
  GtfsStop,
  Pattern,
  ServiceCalendar,
  StopTime
} from '../../types'

export const componentList: Array<string> = [
  'route',
  'stop',
  'fare',
  'feedinfo',
  'calendar',
  'scheduleexception',
  'agency'
]
export const subComponentList: Array<string> = ['trippattern']
export const subSubComponentList: Array<string> = ['timetable']

export function getEntityBounds (entity: ?Entity, offset: number = 0.005): ?latLngBounds {
  if (!entity) return null

  // [lng, lat]
  if (entity.constructor === Array) {
    return latLngBounds([
      [entity[1] + offset, entity[0] - offset],
      [entity[1] - offset, entity[0] + offset]
    ])
  } else if (typeof entity.stop_lat === 'number' && typeof entity.stop_lon === 'number') {
    // stop
    return latLngBounds([
      [entity.stop_lat + offset, entity.stop_lon - offset],
      [entity.stop_lat - offset, entity.stop_lon + offset]
    ])
  } else if (typeof entity.route_id === 'string') {
    // route
    const route: GtfsRoute = ((entity: any): GtfsRoute)
    let coordinates = []
    if (route.tripPatterns) {
      route.tripPatterns.map(pattern => {
        if (pattern.shape && pattern.shape.coordinates) {
          coordinates = [
            ...coordinates,
            ...pattern.shape.coordinates.map(c => [c[1], c[0]])
          ]
        }
      })
    }
    return latLngBounds(coordinates)
  } else if (entity.shape) {
    // trip pattern
    const pattern: Pattern = ((entity: any): Pattern)
    return latLngBounds(pattern.shape.coordinates.map(c => [c[1], c[0]]))
  } else if (entity.patternStops) {
    // TODO: add pattern stops bounds extraction
    return null
  }
}

export function findEntityByGtfsId (
  component: string,
  gtfsId: string,
  entities: Array<Entity>
): string {
  let entity
  switch (component) {
    // we need these if statements in there to make flow happy
    // see: https://flow.org/en/docs/types/unions/#toc-union-types-requires-one-in-but-all-out
    case 'stop':
      entity = entities.find((e) => {
        if (e.gtfsStopId) {
          return e.gtfsStopId === gtfsId
        }
      })
      break
    case 'route':
      entity = entities.find(e => {
        if (e.gtfsRouteId) {
          return e.gtfsRouteId === gtfsId
        }
      })
      break
    case 'calendar':
      entity = entities.find(e => {
        if (e.gtfsServiceId) {
          return e.gtfsServiceId === gtfsId
        }
      })
      break
    default:
      return '-1'
  }

  return entity ? (entity.id ? entity.id : '-1') : '-1'
}

export function getEntityName (entity: ?Entity): string {
  if (!entity) {
    return '[Unnamed]'
  }

  let nameKey: string = '[Unnamed]'

  if (entity.route_id) {
    nameKey = 'route_short_name'
  } else if (entity.patternStops) {
    nameKey = 'name'
  } else if (entity.agency_name) {
    nameKey = 'agency_name'
  } else if (entity.stop_id) {
    nameKey = 'stop_name'
  } else if (entity.service_id) {
    nameKey = 'description'
  } else if (entity.fare_id) {
    nameKey = 'fare_id'
  } else if (entity.exemplar) {
    nameKey = 'name'
  }

  // if (nameKey !== 'stop_name') console.log(nameKey)
  switch (nameKey) {
    case 'stop_name':
      const stop: GtfsStop = ((entity: any): GtfsStop)
      return stop.stop_name && stop.stop_code
        ? `${stop.stop_name} (${stop.stop_code})`
        : stop.stop_name && stop.stop_id
          ? `${stop.stop_name} (${stop.stop_id})`
          : stop.stop_name || '[no name]'
    case 'route_short_name':
      const route: GtfsRoute = ((entity: any): GtfsRoute)
      if (route.route_short_name &&
        route.route_long_name &&
        route.route_short_name !== '""' &&
        route.route_long_name !== '""') {
        return `${route.route_short_name} - ${route.route_long_name}`
      } else if (route.route_short_name && route.route_short_name !== '""') {
        return route.route_short_name
      } else if (route.route_long_name && route.route_long_name !== '""') {
        return route.route_long_name
      } else {
        return '[no name]'
      }
    case 'description': // service calendar
      const serviceCalendar: ServiceCalendar = ((entity: any): ServiceCalendar)
      return `${serviceCalendar.service_id} ${serviceCalendar.description
        ? `(${serviceCalendar.description})`
        : ''}`
    default:
      const otherEntityType: any = entity
      return otherEntityType[nameKey] || '[no name]'
  }
}

export function getAbbreviatedStopName (stop: GtfsStop, maxCharactersPerWord: number = 10): string {
  const stopName = getEntityName(stop)
  const stopNameParts = stopName ? stopName.split(/(\band\b|&|@|:|\+)+/i) : null
  return stopNameParts &&
  stopNameParts.length === 3 &&
  stop.stop_name.length > maxCharactersPerWord * 2
    ? `${stopNameParts[0]
        .substr(0, maxCharactersPerWord)
        .trim()}... ${stopNameParts[2].substr(0, maxCharactersPerWord).trim()}`
    : stop.stop_name
}

export function getControlPoints (pattern: ?Pattern, snapToStops: boolean): Array<ControlPoint> {
  if (!pattern || !pattern.shape || !pattern.patternStops) {
    return []
  }
  const controlPoints = []
  const {patternStops, shape} = pattern
  patternStops.map((patternStop: StopTime, index: number) => {
    // set distance to average of patternStop and next patternStop, if last stop set to end of segment
    const distance = patternStops[index + 1]
      ? (patternStops[index + 1].shapeDistTraveled +
          patternStop.shapeDistTraveled) /
        2
      : lineDistance(shape, 'meters')
    const point = shape && along(shape, distance, 'meters')
    const PERMANENT = true
    const controlPoint = newControlPoint(distance, point, PERMANENT)
    if (!patternStop.shapeDistTraveled) {
      throw new Error('This pattern stop is missing the shapeDistTraveled key')
    }
    const stopPoint =
      shape && along(shape, patternStop.shapeDistTraveled, 'meters')
    const stopControl = newControlPoint(
      patternStop.shapeDistTraveled,
      stopPoint,
      PERMANENT,
      patternStop
    )
    if (snapToStops) {
      stopControl.hidden = true
    }
    controlPoints.push(stopControl)
    controlPoints.push(controlPoint)
  })
  return controlPoints
}

export function getRouteNameAlerts (route: GtfsRoute): string | null {
  const routeName =
    route.route_short_name && route.route_long_name
      ? `${route.route_short_name} - ${route.route_long_name}`
      : route.route_long_name
        ? route.route_long_name
        : route.route_short_name ? route.route_short_name : null
  return routeName
}

export function getRouteName (route: ?GtfsRoute): string {
  let name = ''
  if (route && route.route_short_name) {
    name += route.route_short_name
    if (route.route_long_name) {
      name += ' - '
    }
  }

  if (route && route.route_long_name) {
    name += route.route_long_name
  }
  if (
    route &&
    route.route_id &&
    !route.route_long_name &&
    !route.route_short_name
  ) {
    name += route.route_id
  }
  return name
}

export function gtfsSort (a: Entity, b: Entity): number {
  const radix = 10
  var aName = getEntityName(a)
  var bName = getEntityName(b)
  if (a.isCreating && !b.isCreating) return -1
  if (!a.isCreating && b.isCreating) return 1
  if (
    !isNaN(parseInt(aName, radix)) &&
    !isNaN(parseInt(bName, radix)) &&
    !isNaN(+aName) &&
    !isNaN(+bName)
  ) {
    if (parseInt(aName, radix) < parseInt(bName, radix)) return -1
    if (parseInt(aName, radix) > parseInt(bName, radix)) return 1
    return 0
  }
  if (aName.toLowerCase() < bName.toLowerCase()) return -1
  if (aName.toLowerCase() > bName.toLowerCase()) return 1
  return 0
}
