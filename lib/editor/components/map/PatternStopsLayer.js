// @flow

import clone from 'lodash/cloneDeep'
import React, {Component} from 'react'

import * as activeActions from '../../actions/active'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import {POINT_TYPE} from '../../constants'
import PatternStopMarker from './PatternStopMarker'

import type {ControlPoint, Feed, GtfsStop, Pattern, PatternStop} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

type Props = {
  activePattern: Pattern,
  activePatternStops: Array<GtfsStop>,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsState,
  feedSource: Feed,
  patternEdited: boolean,
  patternSegment: number,
  patternStop: {id: any, index: number},
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  updatePatternStops: typeof tripPatternActions.updatePatternStops
}

export default class PatternStopsLayer extends Component<Props> {
  render () {
    const {
      activePattern,
      activePatternStops,
      addStopToPattern,
      controlPoints,
      editSettings,
      patternSegment,
      removeStopFromPattern,
      setActiveStop
    } = this.props
    // FIXME: There is an issue here where the patternStop prop refers to the active
    // pattern stop, but in PatternStopMarker begins to refer to the PatternStop
    // type. The below destructuring is to satisfy Flow.
    const {patternStop: activePatternStop, ...otherProps} = this.props
    if (!activePatternStops || !activePattern || !editSettings.showStops) {
      return null
    }
    const {patternStops} = activePattern
    const activeStopNotFound = activePatternStop &&
      patternStops.findIndex(ps => ps.id === activePatternStop.id) === -1
    let cpIndex = 0
    let psIndex = 0
    const patternStopsWithControlPointIndexes = []
    // Associate pattern stops with control point indices.
    while (controlPoints[cpIndex]) {
      if (controlPoints[cpIndex].pointType === POINT_TYPE.STOP) {
        const clonedPatternStop: PatternStop = clone(patternStops[psIndex])
        if (!clonedPatternStop) {
          console.warn(`Pas d\'arrêt pour le point de contrôle ${cpIndex}.`)
          break
        }
        patternStopsWithControlPointIndexes.push({...clonedPatternStop, cpIndex})
        psIndex++
      }
      cpIndex++
    }
    if (cpIndex < patternStops.length) {
      console.warn(`Moins de points de contrôlé (${controlPoints.length}) que d\'arrêts (${patternStops.length})!`, controlPoints, patternStops)
    }
    return (
      <div id='PatternStops'>
        {patternStopsWithControlPointIndexes.map((patternStop, index) => {
          const {cpIndex, stopId} = patternStop
          const stop = activePatternStops.find(s => s.stop_id === stopId)
          if (!stop) {
            console.log(stop)
            console.warn(`Impossible de trouver l\'arrêt: ${stopId}`, activePatternStops)
            return
          }
          if (
            editSettings.hideInactiveSegments &&
            (cpIndex > patternSegment + 1 || cpIndex < patternSegment - 1)
          ) {
            // Do not render pattern stop if hiding inactive segments and
            // pattern stop does not reference one of the adjacent control points.
            return null
          }
          return (
            <PatternStopMarker
              {...otherProps}
              index={index}
              ref={`${patternStop.id}`}
              key={patternStop.id}
              addStopToPattern={addStopToPattern}
              setActiveStop={setActiveStop}
              // fallback to index if/when id changes
              active={activePatternStop.id === patternStop.id ||
                (activeStopNotFound && activePatternStop.index === index)
              }
              removeStopFromPattern={removeStopFromPattern}
              stop={stop}
              patternStop={patternStop} />
          )
        })}
      </div>
    )
  }
}
