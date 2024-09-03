// @flow

import React, {PureComponent} from 'react'
import {Polyline} from 'react-leaflet'
import lineDistance from 'turf-line-distance'
import lineString from 'turf-linestring'

import {PATTERN_TO_STOP_DISTANCE_THRESHOLD_METERS} from '../../constants'
import {isValidStopControlPoint} from '../../util/map'
import type {ControlPoint, GtfsStop, Pattern} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

type Props = {
  activePattern: Pattern,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsState,
  patternSegment: number,
  patternStop: {id: string, index: number},
  stops: Array<GtfsStop>
}

export const getControlPointsForStops = (controlPoints: Array<ControlPoint>) => controlPoints
  // Add control point indexes to determine if active segment is adjacent
  // i.e., whether the line should be rendered.
  .map((cp, index) => ({...cp, cpIndex: index}))
  // Filter out the user-added anchors
  .filter(isValidStopControlPoint)

/**
 * This react-leaflet component draws connecting lines between a pattern
 * geometry's anchor points (that are associated with stops) and their
 * corresponding stops. This is mainly intended as a debugging feature, but may
 * be useful during the normal course of editing.
 *
 * Perhaps a useful way to think about what this line represents is to consider
 * the path someone waiting at a bus stop would need to walk to board a bus. If
 * the passenger doesn't actually need to walk that path, the pattern shape (or
 * at least the connection point that has been generated) is likely wrong.
 */
export default class PatternDebugLines extends PureComponent<Props> {
  render () {
    const {activePattern, controlPoints, editSettings, patternSegment, patternStop, stops} = this.props
    if (!activePattern || !controlPoints || !stops) return null
    return (
      <div id='pattern-debug-lines'>
        {getControlPointsForStops(controlPoints)
          // The remaining number should match the number of stops
          .map((cp, index) => {
            const {cpIndex, point, stopId} = cp
            // If hiding inactive segments (and this control point is not along
            // a visible segment), do not show debug line.
            if (editSettings.hideInactiveSegments && (cpIndex > patternSegment + 1 || cpIndex < patternSegment - 1)) {
              return null
            }
            const patternStopIsActive = patternStop.index === index
            // Do not render if some other pattern stop is active or if we do not have point info (to make flow happy).
            if ((typeof patternStop.index === 'number' && !patternStopIsActive) || (!point || !point.geometry || !point.geometry.coordinates)) {
              return null
            }
            const {coordinates: cpCoord} = point.geometry
            // Find stop entity for control point.
            const stop = stops.find(s => s.stop_id === stopId)
            if (!stop) {
              // If no stop entity found, do not attempt to draw a line to the
              // missing stop.
              return null
            }
            const coordinates = [[cpCoord[1], cpCoord[0]], [stop.stop_lat, stop.stop_lon]]
            const distance: number = lineDistance(lineString(coordinates), 'meters')
            const distanceGreaterThanThreshold = distance > PATTERN_TO_STOP_DISTANCE_THRESHOLD_METERS
            if (distanceGreaterThanThreshold) {
              console.warn(`La distance de l\'arrêt=${index} au point projeté est plus grande que ${PATTERN_TO_STOP_DISTANCE_THRESHOLD_METERS} (${distance}).`)
            }
            return (
              <Polyline
                key={index}
                // React leaflet coordinates are [lat, lon]
                positions={coordinates}
                dashArray='5, 5'
                lineCap='butt'
                color={distanceGreaterThanThreshold
                  ? 'red'
                  : patternStopIsActive ? 'blue' : 'black'
                }
                weight={2}
                opacity={0.6} />
            )
          })
        }
      </div>
    )
  }
}
