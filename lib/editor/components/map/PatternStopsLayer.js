/* eslint-disable complexity */
// @flow

import clone from 'lodash/cloneDeep'
import React, {Component} from 'react'

import * as activeActions from '../../actions/active'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import {POINT_TYPE} from '../../constants'
import type {ControlPoint, Feed, GtfsLocation, GtfsStop, Pattern, PatternStop} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

import PatternStopMarker from './PatternStopMarker'
import PatternLocationMarker from './PatternLocationMarker'

type Props = {
  activePattern: Pattern,
  activePatternLocationGroups: Array<GtfsLocation>,
  activePatternLocations: Array<GtfsLocation>,
  activePatternStops: Array<GtfsStop>,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsState,
  feedSource: Feed,
  locations: Array<GtfsLocation>,
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
      activePatternLocationGroups,
      activePatternLocations,
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
    if ((!activePatternStops && !activePatternLocations && !activePatternLocationGroups) || !activePattern || !editSettings.showStops) {
      return null
    }
    const {patternStops} = activePattern
    const activeStopNotFound = activePatternStop &&
      patternStops.findIndex(ps => ps.id === activePatternStop.id) === -1
    let cpIndex = 0
    let psIndex = 0
    const patternStopsWithControlPointIndexes = patternStops.filter(ps => ps.locationId !== null || ps.locationGroupId !== null)
    // Associate pattern stops with control point indices.
    while (controlPoints[cpIndex]) {
      if (controlPoints[cpIndex].pointType === POINT_TYPE.STOP) {
        const clonedPatternStop: PatternStop = clone(patternStops[psIndex])
        if (!clonedPatternStop) {
          console.warn(`No pattern stop for control point index ${cpIndex}.`)
          break
        }
        patternStopsWithControlPointIndexes.push({...clonedPatternStop, cpIndex})
        psIndex++
      }
      cpIndex++
    }
    if (cpIndex < patternStops.length) {
      console.warn(`Fewer control points (${controlPoints.length}) than pattern stops (${patternStops.length})!`, controlPoints, patternStops)
    }
    return (
      <div id='PatternStops'>
        {patternStops.map((patternStop, index) => {
          const matchedPatternStop = patternStopsWithControlPointIndexes.find(ps => ps.stopId === patternStop.stopId || ps.locationId === patternStop.locationId || ps.locationGroupId === patternStop.locationGroupId)
          const {stopId, locationId, locationGroupId} = patternStop
          const cpIndex = matchedPatternStop ? matchedPatternStop.cpIndex : null
          const stop = activePatternStops.find(s => s && s.stop_id === stopId)
          const location = activePatternLocations.find(l => l && l.location_id === locationId)
          const locationGroup = activePatternLocationGroups.find(l => l && l.location_group_id === locationGroupId)
          if (!stop && !location && !locationGroup) {
            console.log(stop)
            // $FlowFixMe
            console.warn(`Could not find stop for stopId: ${stopId || locationId || locationGroupId}`, activePatternStops)
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
          if (stop) {
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
          }
          if (location) {
            return <PatternLocationMarker
              {...otherProps}
              active={
                activePatternStop.id === patternStop.id ||
              (activeStopNotFound && activePatternStop.index === index)
              }
              addStopToPattern={addStopToPattern}
              index={index}
              key={patternStop.id}
              location={location}
              setActiveStop={setActiveStop}
              // fallback to index if/when id changes
              ref={`${patternStop.id || patternStop.locationId || patternStop.locationGroupId}`}
              removeStopFromPattern={removeStopFromPattern}
              stop={stop}
              patternStop={patternStop} />
          }
          if (locationGroup) {
            // 2024 TODO: support rendering location groups. will be tricky. need to
            // grab location group stop data
            return <></>
          }
        })}
      </div>
    )
  }
}
