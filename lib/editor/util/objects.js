// @flow
import {ENTITY} from '../constants'
import {camelCaseKeys, snakeCaseKeys} from '../../common/util/map-keys'
import type {Entity} from '../../types'

export function componentToText (component: string): string {
  switch (component) {
    case 'scheduleexception':
      return 'exception'
    case 'fareproduct':
      return 'product'
    case 'faremedia':
      return 'media'
    case 'faretransferrule':
      return 'transfer rule'
    case 'farelegrule':
      return 'leg rule'
    default:
      return component
  }
}

export function entityIsNew (entity: Entity): boolean {
  return entity.id === ENTITY.NEW_ID || typeof entity.id === 'undefined'
}

export const getMapToGtfsStrategy = (component: string) => {
  switch (component) {
    case 'route':
      return routeToGtfs
    default:
      return (entity: any) => entity
  }
}

export const getMapFromGtfsStrategy = (component: string) => {
  switch (component) {
    default:
      return (entity: any) => snakeCaseKeys(entity)
  }
}

/**
 * Converts keys to camelCase and adds shape geometry to trip pattern object.
 */
export function tripPatternToGtfs (tripPattern: any, stops: any): any {
  const pattern = camelCaseKeys(tripPattern)
  const coordinates = coordinatesFromShapePoints(pattern.shapePoints)
  if (coordinates && coordinates.length > 1) {
    // Add GeoJSON LineString for coordinates (convenience object used in some
    // UI components). FIXME: Remove usages of pattern.shape
    pattern.shape = {type: 'LineString', coordinates}
  }
  return pattern
}

export function coordinatesFromShapePoints (shapePoints: any) {
  const hasShapePoints = shapePoints.length > 0
  if (!hasShapePoints) return []
  const coordinates = shapePoints
    .map(shapePointToCoordinate)
    .filter(sp => sp)
  if (coordinates.length === 0) {
    console.warn('Warning! Pattern coordinates is empty array')
  }
  return coordinates
}

export function shapePointToCoordinate (shapePoint: any, index: number) {
  const {shapePtLon, shapePtLat} = shapePoint
  if (shapePtLon !== null && shapePtLon !== undefined && shapePtLat !== null && shapePtLat !== undefined) {
    return [shapePtLon, shapePtLat]
  } else {
    console.warn(`Shape point index=${index} has undefined or null shaptPtLat or shapePtLon`)
    return null
  }
}

export function routeToGtfs (route: any): any {
  if (route.tripPatterns) {
    route.tripPatterns = route.tripPatterns.map(tripPatternToGtfs)
  }
  return route
}
