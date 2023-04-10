// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Button, FormGroup, ControlLabel, ButtonGroup, DropdownButton, MenuItem, Tooltip} from 'react-bootstrap'

import * as activeActions from '../../actions/active'
import * as tripPatternActions from '../../actions/tripPattern'
import OptionButton from '../../../common/components/OptionButton'
import {ENTITY} from '../../constants'

import type {Feed, GtfsRoute, Pattern} from '../../../types'

type Props = {
  activeEntity: GtfsRoute,
  activePattern: Pattern,
  activePatternId: number,
  activePatternTripCount: number,
  deleteAllTripsForPattern: typeof tripPatternActions.deleteAllTripsForPattern,
  feedSource: Feed,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  showConfirmModal: any,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity
}

// Outbound is zero, inbound is one.
const DIRECTIONS = [0, 1]

export default class EditSchedulePanel extends Component<Props> {
  _editTimetables = () => {
    const {setActiveEntity, feedSource, activeEntity, activePattern} = this.props
    setActiveEntity(
      feedSource.id,
      'route',
      activeEntity,
      'trippattern',
      activePattern,
      'timetable'
    )
  }

  _isDirectionOutbound = (dir: number) => dir === DIRECTIONS[0]

  _onChangeDirection = (newDirectionId: number) => {
    const {activePattern, saveActiveGtfsEntity, updateActiveGtfsEntity} = this.props
    // If direction clicked matches current direction, set directionId to null
    // (indicates that user has deselected the option).
    const directionId = activePattern.directionId === newDirectionId
      ? null
      : newDirectionId
    updateActiveGtfsEntity({
      component: 'trippattern',
      entity: activePattern,
      props: {directionId}
    })
    saveActiveGtfsEntity('trippattern')
  }

  _onChangeUseFrequency = (key: string) => {
    const {
      activePattern,
      deleteAllTripsForPattern,
      feedSource,
      saveActiveGtfsEntity,
      showConfirmModal,
      updateActiveGtfsEntity
    } = this.props
    const {name, patternId} = activePattern
    const useFrequency = key !== 'timetables' ? 1 : 0
    const unselectedOption = key === 'timetables' ? 'frequencies' : 'timetables'
    showConfirmModal({
      title: `Usar ${key} para ${name}?`,
      body: `¿Estás seguro de que quieres usar ${key} para este patrón de viaje?
      Cualquier viaje creado usando ${unselectedOption} se perderá.`,
      onConfirm: () => {
        // Update and save useFrequency field
        updateActiveGtfsEntity({
          component: 'trippattern',
          entity: activePattern,
          props: {useFrequency}
        })
        saveActiveGtfsEntity('trippattern')
          // Then, delete all trips for the pattern.
          // $FlowFixMe action is wrapped in promise when connected
          .then(() => deleteAllTripsForPattern(feedSource.id, patternId))
      }
    })
  }

  render () {
    const {activePattern, activePatternId, activePatternTripCount} = this.props
    if (!activePattern) return null
    const {
      directionId,
      name,
      patternStops,
      useFrequency
    } = activePattern
    const timetableOptions = [
      <span><Icon type='table' /> Usar horarios</span>,
      <span><Icon type='clock-o' /> Usar frecuencias</span>
    ]
    const editSchedulesDisabled = activePatternId === ENTITY.NEW_ID ||
      patternStops.length === 0
    return (
      <div>
        <h4 className='line'>
        Horarios {`(${activePatternTripCount} viaje${activePatternTripCount !== 1 ? 's' : ''})`}
        </h4>
        {!activePatternTripCount
          ? <small className='text-warning'>
            <Icon type='exclamation-triangle' />{' '}
            No hay viajes en servicio para este patrón.
          </small>
          : null
        }
        <FormGroup style={{marginTop: '5px'}}>
          <ButtonGroup className='pull-right'>
            <DropdownButton
              onSelect={this._onChangeUseFrequency}
              pullRight
              style={{width: '170px'}}
              bsSize='small'
              title={useFrequency ? timetableOptions[1] : timetableOptions[0]}
              id='frequency-dropdown'>
              <MenuItem
                eventKey={useFrequency ? 'timetables' : 'frequencies'}>
                {useFrequency ? timetableOptions[0] : timetableOptions[1]}
              </MenuItem>
            </DropdownButton>
          </ButtonGroup>
          <ControlLabel
            style={{marginTop: '3px'}}>
            <small>Type</small>
          </ControlLabel>
        </FormGroup>
        <FormGroup style={{marginTop: '5px'}}>
          <ButtonGroup className='pull-right'>
            {DIRECTIONS.map(dir => {
              const isOutbound = this._isDirectionOutbound(dir)
              return (
                <OptionButton
                  key={dir}
                  active={directionId === dir}
                  value={dir}
                  bsSize='small'
                  style={{width: '85px'}}
                  name={dir}
                  tooltip={
                    <Tooltip
                      id={`tooltip-dir-${dir}`}>
                      {isOutbound ? 'Outbound (0)' : 'Inbound (1)'}
                    </Tooltip>
                  }
                  onDeselect={this._onChangeDirection}
                  onClick={this._onChangeDirection}>
                  <Icon type={isOutbound ? 'sign-out' : 'sign-in'} />
                </OptionButton>
              )
            })}
          </ButtonGroup>
          <ControlLabel><small>Dirección</small></ControlLabel>
        </FormGroup>
        <Button
          block
          bsSize='small'
          data-test-id='edit-schedules-button'
          disabled={editSchedulesDisabled}
          onClick={this._editTimetables}
          // FIXME: Should this be a tooltip for a better user experience?
          title={editSchedulesDisabled
            ? `Debe agregar paradas al patrón antes de editar los horarios para ${name}`
            : `Agregar o modificar viajes para ${name}`}
        >
          <Icon type='calendar' /> Editar horarios
        </Button>
      </div>
    )
  }
}
