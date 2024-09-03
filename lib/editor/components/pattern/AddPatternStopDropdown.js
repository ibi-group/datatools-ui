// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button, Dropdown, MenuItem } from 'react-bootstrap'

import * as stopStrategiesActions from '../../actions/map/stopStrategies'

import type {GtfsStop, Pattern, PatternStop, Style} from '../../../types'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  index?: number, // current pattern stop index (if dropdown shown for current pattern stop)
  label?: string,
  patternStop?: PatternStop, // optional current pattern stop
  size?: string,
  stop: GtfsStop,
  style?: Style
}

const DISABLED_MESSAGE = 'Impossible d\'avoir consécutivement le même arrêt'

/**
 * Dropdown button that adds a stop as a new pattern stop to the actively
 * selected pattern.
 */
export default class AddPatternStopDropdown extends Component<Props> {
  _addStop = (index?: number) => {
    const {activePattern, addStopToPattern, stop} = this.props
    addStopToPattern(activePattern, stop, index)
  }

  _matchesStopAtIndex = (index: number) => {
    const {activePattern, stop} = this.props
    const patternStopAtIndex = activePattern.patternStops[index]
    return patternStopAtIndex && patternStopAtIndex.stopId === stop.stop_id
  }

  _onAddToEnd = () => this._addStop()

  _onSelectStop = (key: number) => this._addStop(key)

  render () {
    const {activePattern, index, label, size, style} = this.props
    const {patternStops} = activePattern
    const lastIndex = patternStops.length - 1
    // Check that first/last stop is not already set to this stop.
    let addToEndDisabled = this._matchesStopAtIndex(lastIndex)
    let addToBeginningDisabled = this._matchesStopAtIndex(0)
    // Also, disable end/beginning if the current pattern stop being viewed
    // occupies one of these positions.
    if (typeof index === 'number') {
      addToEndDisabled = addToEndDisabled || index >= lastIndex
      addToBeginningDisabled = addToBeginningDisabled || index === 0
    }
    return (
      <Dropdown
        id={`add-stop-dropdown`}
        pullRight
        onSelect={this._onSelectStop}
        style={style}
      >
        <Button
          bsSize={size}
          bsStyle='success'
          data-test-id='add-pattern-stop-button'
          disabled={addToEndDisabled}
          title={addToEndDisabled ? DISABLED_MESSAGE : ''}
          onClick={this._onAddToEnd}>
          <Icon type='plus' /> {label}
        </Button>
        <Dropdown.Toggle
          bsSize={size}
          bsStyle='success' />
        <Dropdown.Menu style={{maxHeight: '200px', overflowY: 'scroll'}}>
          <MenuItem
            disabled={addToEndDisabled}
            title={addToEndDisabled ? DISABLED_MESSAGE : ''}
            value={activePattern.patternStops.length}
            eventKey={activePattern.patternStops.length}>
            Add to end (default)
          </MenuItem>
          {activePattern.patternStops && activePattern.patternStops.map((s, i) => {
            // addIndex is in "reverse" order. For example:
            // - 5 pattern stops
            // - rendering MenuItem 'Insert at stop #4'
            // - addIndex = 3 = 5 (stops) - 1 (i) - 1
            // - nextIndex = 4
            // - previousIndex = 2
            const addIndex = activePattern.patternStops.length - i - 1
            const nextIndex = addIndex + 1
            const previousIndex = addIndex - 1
            let disableAdjacent = false
            // If showing the dropdown for the currently selected pattern stop,
            // do not allow adding as an adjacent stop (a pattern should not
            // visit the same stop consecutively).
            if (typeof index === 'number') {
              disableAdjacent = index > previousIndex && index < nextIndex
            }
            // Disable adding stop to current position or directly before
            // current position. nextIndex is OK because inserting the stop at
            // addIndex would move the current stop at addIndex into the
            // nextIndex position, which would serve as a buffer (and avoid
            // having the same stop in consecutive positions).
            const addAtIndexDisabled = disableAdjacent ||
              this._matchesStopAtIndex(previousIndex) ||
              this._matchesStopAtIndex(addIndex)
            // Skip MenuItem if index is the same as the currently selected
            // pattern stop index or it's the zeroth addIndex (Add to
            // beginning handles this case).
            if (index === addIndex || addIndex === 0) {
              return null
            }
            return (
              <MenuItem
                disabled={addAtIndexDisabled}
                value={addIndex}
                title={addAtIndexDisabled ? DISABLED_MESSAGE : ''}
                key={i}
                eventKey={addIndex}>
                Insérer en tant qu'arrêt #{addIndex + 1}
              </MenuItem>
            )
          })}
          <MenuItem
            disabled={addToBeginningDisabled}
            title={addToBeginningDisabled ? DISABLED_MESSAGE : ''}
            value={0}
            eventKey={0}>
            Ajouter au début
          </MenuItem>
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}
