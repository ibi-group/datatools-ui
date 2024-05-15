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
import { mergePatternHalts } from '../../../gtfs/util'
import { patternHaltIsLocation, patternHaltIsStop } from '../../util/location'

import PatternStopMarker from './PatternStopMarker'
import PatternLocationMarker from './PatternLocationMarker'

type Props = {
  activePattern: Pattern,
  activePatternLocations: Array<GtfsLocation>,
  activePatternStops: Array<GtfsStop>,
  activepatternLocationGroupStops: Array<GtfsLocation>,
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
  stops: Array<GtfsStop>,
  updatePatternStops: typeof tripPatternActions.updatePatternStops,
}

export default class PatternStopsLayer extends Component<Props> {
  render () {
    const {
      activePattern,
      activepatternLocationGroupStops,
      activePatternLocations,
      activePatternStops,
      addStopToPattern,
      controlPoints,
      editSettings,
      locations,
      patternSegment,
      removeStopFromPattern,
      setActiveStop,
      stops
    } = this.props
    // FIXME: There is an issue here where the patternStop prop refers to the active
    // pattern stop, but in PatternStopMarker begins to refer to the PatternStop
    // type. The below destructuring is to satisfy Flow.
    const {patternStop: activePatternStop, ...otherProps} = this.props
    if (!activePatternStops || !activePattern || !editSettings.showStops) {
      return null
    }
    const {patternLocations, patternLocationGroupStops, patternStops} = activePattern

    const activeStopNotFound = activePatternStop &&
      patternStops.findIndex(ps => ps.id === activePatternStop.id) === -1 &&
      patternLocations.findIndex(pl => pl.id === activePatternStop.id) === -1 &&
      patternLocationGroupStops.findIndex(plg => plg.id === activePatternStop.id) === -1
    let cpIndex = 0
    let psIndex = 0
    const patternStopsWithControlPointIndexes = []
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
    const patternHalts = mergePatternHalts(patternStopsWithControlPointIndexes, patternLocations, patternLocationGroupStops)
    return (
      <div id='PatternStops'>
        {activepatternLocationGroupStops.map((locationGroup, index) => {
          if (!locationGroup.location_id || locationGroup.location_id.length === 0) return null
          const halts = typeof locationGroup.location_id === 'string' ? locationGroup.location_id.split(',') : locationGroup.location_id
          const activeHalts = halts.reduce((acc, halt) => {
            const potentialStop = stops.find(s => s.stop_id === halt)
            if (potentialStop) {
              acc.stops.push(potentialStop)
            }

            const potentialLocation = locations.find(l => l.location_id === halt)
            if (potentialLocation) {
              acc.locations.push(potentialLocation)
            }

            return acc
          }, {stops: [], locations: [], id: patternLocationGroupStops[index].id})
          // Render stops and locations separately, but fix the index and patternStop
          // to be a location group so that when you click it it opens the location group
          // also, disable the buttons in the popup
          return <React.Fragment>
            {activeHalts.stops.map(stop => {
              return (
                <PatternStopMarker
                  {...otherProps}
                  active={activePatternStop.id === activeHalts.id || (activeStopNotFound && activePatternStop.index === index)}
                  addStopToPattern={addStopToPattern}
                  index={patternLocationGroupStops[index].stopSequence}
                  key={stop.id} // fallback to index if/when id changes
                  patternStop={patternLocationGroupStops[index]}
                  removeStopFromPattern={removeStopFromPattern}
                  setActiveStop={setActiveStop}
                  stop={stop}
                />
              )
            })}
            {activeHalts.locations.map(location => {
              return (
                <PatternLocationMarker
                  {...otherProps}
                  active={activePatternStop.id === activeHalts.id || (activeStopNotFound && activePatternStop.index === index)}
                  addStopToPattern={addStopToPattern}
                  index={patternLocationGroupStops[index].stopSequence}
                  key={location.id} // fallback to index if/when id changes
                  location={location}
                  patternLocation={patternLocationGroupStops[index]}
                  removeStopFromPattern={removeStopFromPattern}
                  setActiveStop={setActiveStop}
                />
              )
            })}
          </React.Fragment>
        })}
        {patternHalts.map((patternStop, index) => {
          const ps = patternHaltIsStop(patternStop)
          if (ps) {
            const { cpIndex, stopId } = ps
            const stop = activePatternStops.find((s) => s.stop_id === stopId)
            if (!stop) {
              console.warn(
                `Could not find stop for stopId: ${stopId}`,
                activePatternStops
              )
              return
            }
            if (
              editSettings.hideInactiveSegments &&
              cpIndex && (cpIndex > patternSegment + 1 || cpIndex < patternSegment - 1)
            ) {
              // Do not render pattern stop if hiding inactive segments and
              // pattern stop does not reference one of the adjacent control points.
              return null
            }
            return (
              <PatternStopMarker
                {...otherProps}
                active={
                  activePatternStop.id === patternStop.id ||
                  (activeStopNotFound && activePatternStop.index === index)
                }
                addStopToPattern={addStopToPattern}
                index={index}
                key={patternStop.id}
                // $FlowFixMe Flow doesn't understand our type check
                patternStop={patternStop}
                // fallback to index if/when id changes
                // $FlowFixMe Flow doesn't understand our type check
                ref={patternStop.id}
                removeStopFromPattern={removeStopFromPattern}
                setActiveStop={setActiveStop}
                stop={stop}
              />
            )
          }

          const patternLocation = patternHaltIsLocation(patternStop)
          if (patternLocation) {
            const location = activePatternLocations.find(
              (l) => l.location_id === patternLocation.locationId
            )
            return (
              <PatternLocationMarker
                {...otherProps}
                active={
                  activePatternStop.id === patternLocation.id ||
                  (activeStopNotFound && activePatternStop.index === index)
                }
                addStopToPattern={addStopToPattern}
                index={index}
                key={patternLocation.id}
                location={location}
                // fallback to index if/when id changes
                patternLocation={patternLocation}
                ref={`${patternLocation.id || patternLocation.locationId}`}
                removeStopFromPattern={removeStopFromPattern}
                setActiveStop={setActiveStop}
              />
            )
          }
        })}
      </div>
    )
  }
}
