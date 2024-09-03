// @flow

import React, {Component} from 'react'

import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import AddableStop from './AddableStop'
import {stopIsOutOfBounds} from '../../util/map'

import type {GtfsStop, Pattern} from '../../../types'
import type {EditSettingsState, MapState} from '../../../types/reducers'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  editSettings: EditSettingsState,
  mapState: MapState,
  stops: Array<GtfsStop>
}

export default class AddableStopsLayer extends Component<Props> {
  render () {
    const {
      activePattern,
      addStopToPattern,
      editSettings,
      mapState,
      stops
    } = this.props
    const { bounds, zoom } = mapState
    const patternStopIds = activePattern && activePattern.patternStops
      ? activePattern.patternStops.map(ps => ps.stopId)
      : []
    const showAddableStops = stops && activePattern &&
      editSettings.addStops && zoom && zoom > 14 && bounds
    return (
      <div id='addable-stops-layer'>
        {showAddableStops
          ? stops
            .filter(stop => {
              // Filter out stops by that don't appear in the bounding box.
              if (stopIsOutOfBounds(stop, bounds)) return false
              if (patternStopIds.indexOf(stop.stop_id) !== -1) {
                // Filter out stops that exist in activePattern. These stops
                // already have their own markers on the map with popups that
                // have options to add the stops to the pattern again.
                return false
              }
              if (stop.id < 0) {
                console.warn(`L'arrêt à un id négatif, indiquant qu'il n'est pas enregistré et ne devrait pas être sélectionné. Filtrage de l'affichage de la carte.`, stop)
                return false
              }
              return true
            })
            .map(stop => {
              if (!stop) return null
              return (
                <AddableStop
                  activePattern={activePattern}
                  addStopToPattern={addStopToPattern}
                  stop={stop}
                  key={stop.id} />
              )
            })
          : null
        }
      </div>
    )
  }
}
