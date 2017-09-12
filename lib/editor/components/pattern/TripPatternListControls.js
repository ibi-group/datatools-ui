import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'

import { OverlayTrigger, Tooltip, ButtonGroup, Button } from 'react-bootstrap'

export default class TripPatternListControls extends Component {
  _onClickClone = () => {
    const {activePattern, cloneEntity, feedSource} = this.props
    cloneEntity(feedSource.id, 'trippattern', activePattern.id, true)
  }

  _onClickDelete = () => {
    const {activeEntity, activePattern, deleteEntity, feedSource, setActiveEntity, showConfirmModal} = this.props
    showConfirmModal({
      title: `Delete trip pattern?`,
      body: `Are you sure you want to delete this trip pattern? This will delete all trips associated with this pattern.`,
      onConfirm: () => {
        deleteEntity(feedSource.id, 'trippattern', activePattern.id, activePattern.routeId)
        setActiveEntity(feedSource.id, 'route', activeEntity, 'trippattern')
      },
      confirmButtonStyle: 'danger',
      confirmButtonText: 'Delete pattern'
    })
  }

  _onClickNew = () => {
    const {activeEntity, feedSource, newGtfsEntity} = this.props
    newGtfsEntity(feedSource.id, 'trippattern', {routeId: activeEntity.id, patternStops: [], name: 'New Pattern', feedId: this.props.feedSource.id, id: 'new'}, true)
  }

  _onClickReverse = () => {
    const {activePattern, saveActiveEntity, showConfirmModal, updateActiveEntity} = this.props
    showConfirmModal({
      title: `Reverse trip pattern?`,
      body: `Are you sure you want to reverse this trip pattern?`,
      onConfirm: () => {
        const coordinates = [...activePattern.shape.coordinates].reverse()
        const patternStops = [...activePattern.patternStops].reverse()
        updateActiveEntity(activePattern, 'trippattern', {patternStops, shape: {type: 'LineString', coordinates}})
        saveActiveEntity('trippattern')
      }
    })
  }

  render () {
    const {activePatternId, activeEntity} = this.props
    return (
      <div
        style={{paddingRight: '5px', marginBottom: '5px'}}>
        <h3>
          <ButtonGroup
            className='pull-right'>
            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>Reverse trip pattern</Tooltip>}>
              <Button
                bsSize='small'
                disabled={!activePatternId}
                onClick={this._onClickReverse}>
                <Icon type='exchange' />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>Duplicate trip pattern</Tooltip>}>
              <Button
                bsSize='small'
                disabled={!activePatternId}
                onClick={this._onClickClone}>
                <Icon type='clone' />
              </Button>
            </OverlayTrigger>
            <OverlayTrigger placement='bottom' overlay={<Tooltip id='tooltip'>Delete trip pattern</Tooltip>}>
              <Button
                bsSize='small'
                disabled={!activePatternId}
                onClick={this._onClickDelete}>
                <Icon type='trash' />
              </Button>
            </OverlayTrigger>
          </ButtonGroup>
          <Button
            bsSize='small'
            disabled={activeEntity.tripPatterns && activeEntity.tripPatterns.findIndex(e => e.id === 'new') !== -1}
            onClick={this._onClickNew}>
            <Icon type='plus' /> New pattern
          </Button>
        </h3>
      </div>
    )
  }
}
