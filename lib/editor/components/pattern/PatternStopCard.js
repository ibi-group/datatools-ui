import Icon from '@conveyal/woonerf/components/icon'
import React, { Component, PropTypes } from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import { Row, Col, Collapse, FormGroup, ControlLabel, Checkbox } from 'react-bootstrap'

import { getEntityName, getAbbreviatedStopName } from '../../util/gtfs'
import MinuteSecondInput from '../MinuteSecondInput'
import PatternStopButtons from './PatternStopButtons'

const cardSource = {
  beginDrag (props) {
    return {
      id: props.id,
      originalIndex: props.findCard(props.id).index
    }
  },

  endDrag (props, monitor) {
    const { id: droppedId, originalIndex } = monitor.getItem()
    const didDrop = monitor.didDrop()
    if (!didDrop) {
      console.log('endDrag')
      props.moveCard(droppedId, originalIndex)
    }
  },

  // disable dragging if request is pending (i.e., save trip pattern is in progress)
  canDrag (props, monitor) {
    if (props.status.savePending) {
      return false
    }
    return true
  }
}

const cardTarget = {
  drop (props, monitor) {
    const { id: droppedId, originalIndex } = monitor.getItem()
    const { index: droppedIndex } = props.findCard(droppedId)
    if (droppedIndex !== originalIndex) {
      props.dropCard()
    }
  },
  hover (props, monitor) {
    const { id: draggedId } = monitor.getItem()
    const { id: overId } = props
    if (draggedId !== overId) {
      const { index: overIndex } = props.findCard(overId)
      props.moveCard(draggedId, overIndex)
    }
  }
}

class PatternStopCard extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    id: PropTypes.any.isRequired,
    moveCard: PropTypes.func.isRequired,
    style: PropTypes.object,
    status: PropTypes.object.isRequired,

    cumulativeTravelTime: PropTypes.number,
    stopIsActive: PropTypes.bool,

    stop: PropTypes.object,
    activePattern: PropTypes.object,

    patternStop: PropTypes.object,
    rowStyle: PropTypes.object,

    active: PropTypes.bool,

    setActiveStop: PropTypes.func,
    updateActiveEntity: PropTypes.func,
    addStopToPattern: PropTypes.func.isRequired,
    removeStopFromPattern: PropTypes.func.isRequired,
    saveActiveEntity: PropTypes.func.isRequired,
    setActiveEntity: PropTypes.func.isRequired
  }

  _formatTravelTime (cumulativeTravelTime, patternStop) {
    return `${Math.round(cumulativeTravelTime / 60)} (+${Math.round(patternStop.defaultTravelTime / 60)}${patternStop.defaultDwellTime > 0 ? ` +${Math.round(patternStop.defaultDwellTime / 60)}` : ''})`
  }

  handleClick = () => {
    const {active, id, index, setActiveStop} = this.props
    if (!active) setActiveStop({id, index})
    else setActiveStop({id: null, index: null})
  }

  _onKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.handleClick()
    }
  }

  render () {
    const { active, isDragging, connectDragSource, connectDropTarget, stop, index, patternStop, style, cumulativeTravelTime } = this.props
    const opacity = isDragging ? 0 : 1
    const stopName = getEntityName(stop)
    const abbreviatedStopName = getAbbreviatedStopName(stop)
    const titleStopName = stop ? `${index + 1}. ${stopName}` : `${index + 1}. ${stop.stop_id}`
    const fullStopName = stop ? `${index + 1}. ${abbreviatedStopName}` : `${index + 1}. ${stop.stop_id}`

    return connectDragSource(connectDropTarget(
      <div style={{ ...style, opacity }}>
        {/* Main card title */}
        <div
          className='small'
          role='button'
          style={{cursor: 'pointer'}}
          tabIndex={0}
          onClick={this.handleClick}
          onKeyDown={this._onKeyDown}>
          <div className='pull-left'>
            <p
              style={{margin: '0px'}}
              title={titleStopName}>
              <Icon type={active ? 'caret-down' : 'caret-right'} />{fullStopName.length > 25 ? fullStopName.substr(0, 25) + '...' : fullStopName}
            </p>
          </div>
          <div className='pull-right'>
            <p style={{margin: '0px'}} className='text-right'>
              <span>{this._formatTravelTime(cumulativeTravelTime, patternStop)}</span>
              {'    '}
              <span style={{cursor: '-webkit-grab', color: 'black'}} ><Icon type='bars' /></span>
            </p>
          </div>
          <div className='clearfix' />
        </div>
        <PatternStopContents {...this.props} />
      </div>
    ))
  }
}

class PatternStopContents extends Component {
  state = {
    update: false
  }

  componentWillMount () {
    this.setState({
      initialDwellTime: this.props.patternStop.defaultDwellTime,
      initialTravelTime: this.props.patternStop.defaultTravelTime
    })
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (nextProps.active !== this.props.active || nextProps.id !== this.props.id || nextState !== this.state) {
      return true
    }
    return false
  }

  _onChangeTimepoint = () => {
    const {activePattern, index, patternStop, saveActiveEntity, updateActiveEntity} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].timepoint = !patternStop.timepoint
    updateActiveEntity(activePattern, 'trippattern', {patternStops})
    saveActiveEntity('trippattern')
  }

  _onClickRemovePatternStop = () => {
    const {activePattern, index, saveActiveEntity, updateActiveEntity} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops.splice(index, 1)
    updateActiveEntity(activePattern, 'trippattern', {patternStops})
    saveActiveEntity('trippattern')
  }

  _onDwellTimeChange = (defaultDwellTime) => {
    const {activePattern, index, updateActiveEntity} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].defaultDwellTime = defaultDwellTime
    this.setState({update: true})
    updateActiveEntity(activePattern, 'trippattern', {patternStops})
  }

  _onTravelTimeChange = (defaultTravelTime) => {
    const {activePattern, index, updateActiveEntity} = this.props
    const patternStops = [...activePattern.patternStops]
    patternStops[index].defaultTravelTime = defaultTravelTime
    this.setState({update: true})
    updateActiveEntity(activePattern, 'trippattern', {patternStops})
  }

  render () {
    const {active, patternStop} = this.props
    let innerDiv
    if (active) {
      innerDiv = <div>
        {/* Remove from pattern button */}
        <Row>
          <Col xs={4}>
            <Checkbox
              checked={patternStop.timepoint}
              onChange={this._onChangeTimepoint}>
              Timepoint?
            </Checkbox>
          </Col>
          <Col xs={8}>
            <PatternStopButtons
              {...this.props}
              patternEdited={this.props.patternEdited || this.state.update}
              size='xsmall'
              style={{marginTop: '10px'}} />
          </Col>
        </Row>
        {/* default travel time inputs */}
        <Row>
          <Col xs={6}>
            <FormGroup
              controlId='defaultTravelTime'
              bsSize='small'>
              <ControlLabel className='small'>Default travel time</ControlLabel>
              <MinuteSecondInput
                seconds={this.state.initialTravelTime}
                onChange={this._onTravelTimeChange} />
            </FormGroup>
          </Col>
          <Col xs={6}>
            <FormGroup
              controlId='defaultDwellTime'
              bsSize='small'>
              <ControlLabel className='small'>Default dwell time</ControlLabel>
              <MinuteSecondInput
                seconds={this.state.initialDwellTime}
                onChange={this._onDwellTimeChange} />
            </FormGroup>
          </Col>
        </Row>
      </div>
    }
    return (
      <Collapse // collapsible div
        in={active}>
        <div>{innerDiv}</div>
      </Collapse>
    )
  }
}

const dropTargetCollect = (connect) => ({connectDropTarget: connect.dropTarget()})
const dragSourceCollect = (connect, monitor) => ({connectDragSource: connect.dragSource(), isDragging: monitor.isDragging()})

export default DropTarget('card', cardTarget, dropTargetCollect)(DragSource('card', cardSource, dragSourceCollect)(PatternStopCard))
