// @flow

import 'leaflet-textpath'
import React, {PureComponent} from 'react'
import lineString from 'turf-linestring'

import TextPath from './TextPath'
import {isSegmentActive} from '../../util/map'

import type {Coordinates, GeoJsonLinestring} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

type Props = {
  editSettings: EditSettingsState,
  patternCoordinates: Array<Coordinates>,
  patternSegment: number
}
// NOTE: the spaces in this text string are intentional and provide gaps between
// the repeated characters.
const ARROW_WITH_SPACES = '               ⤍               '

const getPatternLine = (
  patternCoordinates: Array<Coordinates>,
  patternSegment: number,
  hideInactiveSegments: boolean
) => {
  let patternLine: ?GeoJsonLinestring = patternCoordinates && patternCoordinates.length > 0
    ? lineString([].concat.apply([], patternCoordinates))
    : null
  if (!patternLine) return null
  if (hideInactiveSegments) {
    const coordinates = []
    for (let i = 0; i < patternCoordinates.length; i++) {
      if (isSegmentActive(patternSegment, i) && patternCoordinates[i]) {
        coordinates.push(...patternCoordinates[i])
      }
    }
    patternLine = lineString(coordinates)
  }
  return patternLine
}

/**
 * This component renders an SVG text path with arrows showing the directionality
 * of a trip pattern's geometry.
 */
export default class DirectionIconsLayer extends PureComponent<Props> {
  render () {
    const {editSettings, patternCoordinates, patternSegment} = this.props
    let patternLine
    try {
      patternLine = getPatternLine(
        patternCoordinates,
        patternSegment,
        editSettings.hideInactiveSegments
      )
      if (!patternLine) {
        return null
      }
      // Reverse coordinates from GeoJSON order.
      const positions = patternLine.geometry.coordinates
        .filter(c => c)
        .map(c => [c[1], c[0]])
      return (
        <TextPath
          attributes={{fill: 'black', 'font-weight': 'bold', 'font-size': '200%'}}
          offset={20}
          center
          positions={positions}
          text={ARROW_WITH_SPACES}
          repeat />
      )
    } catch (err) {
      console.warn(err, 'Impossible de générer les icônes de direction pour le motif.', patternLine)
      return null
    }
  }
}
