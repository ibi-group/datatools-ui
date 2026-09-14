// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button, OverlayTrigger, Tooltip, ButtonGroup } from 'react-bootstrap'

import * as activeActions from '../../actions/active'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import type {Feed, GtfsLocation, GtfsStop, Pattern, PatternStop, Style} from '../../../types'

import AddPatternStopDropdown from './AddPatternStopDropdown'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  feedSource: Feed,
  index: number,
  patternEdited: boolean,
  patternStop: PatternStop,
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  size: string,
  stop: GtfsStop | GtfsLocation,
  style?: Style,
  updatePatternStops: typeof tripPatternActions.updatePatternStops
}

export default class PatternStopButtons extends Component<Props> {
  static defaultProps = {
    size: 'small'
  }

  _onAddToEnd = () => {
    const {activePattern, addStopToPattern, stop} = this.props
    addStopToPattern(activePattern, stop)
  }

  _onClickEdit = () => {
    const {feedSource, setActiveEntity, stop} = this.props
    if (stop.hasOwnProperty('stop_id')) {
      setActiveEntity(feedSource.id, 'stop', stop)
    } else if (stop.hasOwnProperty('location_group_id')) {
      setActiveEntity(feedSource.id, 'locationgroup', stop)
    } else if (stop.hasOwnProperty('location_id')) {
      setActiveEntity(feedSource.id, 'location', stop)
    }
  }

  _onClickRemove = () => {
    const {activePattern, index, removeStopFromPattern, stop} = this.props
    if (
      window.confirm(
        `Are you sure you would like to remove ${stop.stop_name || ''} (${stop.stop_id || stop.location_id || ''}) as pattern ${stop.stop_id ? 'stop' : 'location'} #${index + 1}?`
      )
    ) {
      removeStopFromPattern(activePattern, stop, index)
    }
  }

  _onClickSave = () => this.props.saveActiveGtfsEntity('trippattern')

  _onSelectStop = (key: number) => {
    const {activePattern, addStopToPattern, stop} = this.props
    addStopToPattern(activePattern, stop, key)
  }

  render () {
    const {
      activePattern,
      addStopToPattern,
      index,
      patternEdited,
      patternStop,
      size,
      stop,
      style
    } = this.props

    const haltType = stop && stop.hasOwnProperty('location_group_id') ? 'location group' : stop.hasOwnProperty('location_id') ? 'location' : 'stop'
    return (
      <ButtonGroup
        className='pull-right'
        style={{
          display: 'inline-block',
          ...style
        }}>
        <Button
          bsSize={size}
          bsStyle='primary'
          disabled={!patternEdited}
          onClick={this._onClickSave}>
          <Icon type='floppy-o' />
        </Button>
        <OverlayTrigger
          overlay={<Tooltip id='edit-stop-tooltip'>Edit {haltType}</Tooltip>}
        >
          <Button
            bsSize={size}
            onClick={this._onClickEdit}>
            <Icon type='pencil' />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger
          overlay={
            <Tooltip id='remove-stop-tooltip'>Remove {haltType} from pattern</Tooltip>
          }
        >
          <Button
            bsSize={size}
            bsStyle='danger'
            onClick={this._onClickRemove}>
            <Icon type='trash' />
          </Button>
        </OverlayTrigger>
        <AddPatternStopDropdown
          activePattern={activePattern}
          addStopToPattern={addStopToPattern}
          index={index}
          patternStop={patternStop}
          size={size}
          stop={stop}
        />
      </ButtonGroup>
    )
  }
}
