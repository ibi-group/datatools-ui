// @flow

import moment from 'moment'
import {decode as decodePolyline} from 'polyline'

type GraphQLShape = {polyline: string, shape_id: string}

/**
 * @param  {number} seconds Seconds after midnight
 * @return {string}         A blank string if not a valid value,
 *    or a string in the format HH:mm:ss where HH can be greater than 23
 */
export function secondsAfterMidnightToHHMM (seconds: ?(number | string)): string {
  if (typeof seconds === 'number') {
    const formattedValue = moment()
      .startOf('day')
      .seconds(seconds)
      .format('HH:mm:ss')
    if (seconds >= 86400) {
      // Replace hours part if seconds are greater than 24 hours (by default
      // moment.js does not handle times greater than 24h).
      const parts = formattedValue.split(':')
      parts[0] = '' + (parseInt(parts[0], 10) + 24 * Math.floor(seconds / 86400))
      return parts.join(':')
    } else if (seconds < 0) {
      // probably an extreme edge case, but it's technically possible
      return `${formattedValue} (jour précédent)`
    } else {
      return formattedValue
    }
  }
  // If handling time format and value is not a number, return empty string.
  return ''
}

/**
 * Shorthand helper function to convert seconds value to human-readable text.
 */
export function humanizeSeconds (seconds: number): string {
  return moment.duration(seconds, 'seconds').humanize()
}

/**
 * Array map function to decode a GraphQL encoded shape polyline.
 */
export function decodeShapePolylines (shape: GraphQLShape) {
  return {
    id: shape.shape_id,
    // Decode polyline and coords divide by ten (gtfs-lib
    // simplification level requires this).
    latLngs: decodePolyline(shape.polyline)
      .map(coords => ([coords[0] / 10, coords[1] / 10]))
  }
}
