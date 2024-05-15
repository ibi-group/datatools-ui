// @flow

import React, {Component} from 'react'

import EditableTextField from '../../../common/components/EditableTextField'

import EditShapePanel from './EditShapePanel'
import EditSchedulePanel from './EditSchedulePanel'
import CalculateDefaultTimesForm from './CalculateDefaultTimesForm'
import PatternStopsPanel from './PatternStopsPanel'
import type {Props} from './TripPatternList'

export default class TripPatternViewer extends Component<Props> {
  savePatternName = (name: string) => {
    const {activePattern, saveActiveGtfsEntity, updateActiveGtfsEntity} = this.props
    updateActiveGtfsEntity({
      component: 'trippattern',
      entity: activePattern,
      props: {name}
    })
    saveActiveGtfsEntity('trippattern')
  }

  render () {
    const {
      activeEntity,
      activePattern,
      activePatternId,
      activePatternTripCount,
      deleteAllTripsForPattern,
      feedSource,
      saveActiveGtfsEntity,
      setActiveEntity,
      showConfirmModal,
      updateActiveGtfsEntity
    } = this.props
    if (!activePattern) return null

    activePattern.patternLocations = activePattern.patternLocations.map(pl => { return {...pl, id: `${pl.locationId}${pl.stopSequence}`} })
    activePattern.patternLocationGroupStops = activePattern.patternLocationGroupStops.map(plg => { return {...plg, id: `${plg.locationGroupId}${plg.stopSequence}`} })
    activePattern.patternStops = activePattern.patternStops.map(ps => { return {...ps, id: `${ps.stopId}${ps.stopSequence}`} })
    return (
      <div>
        <EditableTextField
          value={activePattern.name}
          maxLength={28}
          onChange={this.savePatternName} />
        <EditShapePanel {...this.props} />
        <EditSchedulePanel
          activeEntity={activeEntity}
          activePattern={activePattern}
          activePatternId={activePatternId}
          activePatternTripCount={activePatternTripCount}
          deleteAllTripsForPattern={deleteAllTripsForPattern}
          feedSource={feedSource}
          saveActiveGtfsEntity={saveActiveGtfsEntity}
          setActiveEntity={setActiveEntity}
          showConfirmModal={showConfirmModal}
          updateActiveGtfsEntity={updateActiveGtfsEntity} />
        <PatternStopsPanel {...this.props} />
        <CalculateDefaultTimesForm {...this.props} />
      </div>
    )
  }
}
