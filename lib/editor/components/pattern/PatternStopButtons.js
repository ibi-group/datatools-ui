import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes, Component} from 'react'
import { Button, Dropdown, OverlayTrigger, Tooltip, ButtonGroup, MenuItem } from 'react-bootstrap'

export default class PatternStopButtons extends Component {
  static propTypes = {
    addStopToPattern: PropTypes.func.isRequired,
    activePattern: PropTypes.object.isRequired,
    controlPoints: PropTypes.array,
    patternEdited: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    removeStopFromPattern: PropTypes.func.isRequired,
    saveActiveEntity: PropTypes.func.isRequired,
    setActiveEntity: PropTypes.func.isRequired,
    size: PropTypes.string,
    stop: PropTypes.object.isRequired,
    style: PropTypes.object
  }
  static defaultProps = {
    size: 'small'
  }
  _onAddToEnd = (e) => this.props.addStopToPattern(this.props.activePattern, this.props.stop)

  _onClickEdit = () => this.props.setActiveEntity(this.props.feedSource.id, 'stop', this.props.stop)

  _onClickRemove = () => this.props.removeStopFromPattern(this.props.activePattern, this.props.stop, this.props.index, this.props.controlPoints)

  _onClickSave = () => this.props.saveActiveEntity('trippattern')

  _onSelectStop = (key) => this.props.addStopToPattern(this.props.activePattern, this.props.stop, key)

  render () {
    const {stop, index, activePattern, patternEdited, style, size} = this.props
    const {patternStops} = activePattern
    const lastIndex = patternStops.length - 1
    const addToEndDisabled = index >= lastIndex || patternStops[lastIndex].stopId === stop.id
    const addToBeginningDisabled = index === 0 || patternStops[0].stopId === stop.id
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
        <OverlayTrigger overlay={<Tooltip id='edit-stop-tooltip'>Edit stop</Tooltip>}>
          <Button
            bsSize={size}
            onClick={this._onClickEdit}>
            <Icon type='pencil' />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger overlay={<Tooltip id='remove-stop-tooltip'>Remove from pattern</Tooltip>}>
          <Button
            bsSize={size}
            bsStyle='danger'
            onClick={this._onClickRemove}>
            <Icon type='trash' />
          </Button>
        </OverlayTrigger>
        <Dropdown
          id={`add-stop-dropdown`}
          pullRight
          onSelect={this._onSelectStop}>
          <Button
            bsSize={size}
            bsStyle='success'
            disabled={addToEndDisabled}
            onClick={this._onAddToEnd}>
            <Icon type='plus' />
          </Button>
          <Dropdown.Toggle
            bsSize={size}
            bsStyle='success' />
          <Dropdown.Menu style={{maxHeight: '200px', overflowY: 'scroll'}}>
            <MenuItem
              disabled={addToEndDisabled}
              value={activePattern.patternStops.length}
              eventKey={activePattern.patternStops.length}>
              Add to end (default)
            </MenuItem>
            {activePattern.patternStops && activePattern.patternStops.map((s, i) => {
              // addIndex is in "reverse" order
              const addIndex = activePattern.patternStops.length - i
              const addAtIndexDisabled = (index >= addIndex - 2 && index < addIndex) ||
                (patternStops[addIndex - 2] && patternStops[addIndex - 2].stopId === stop.id) ||
                (patternStops[addIndex - 1] && patternStops[addIndex - 1].stopId === stop.id)
                // (patternStops[addIndex + 1] && patternStops[addIndex + 1].stopId === stop.id)
              // skip MenuItem index is the same as the pattern stop index
              if (index === addIndex - 1 || addIndex === 1) {
                return null
              }
              // disable adding stop to current position or directly before/after current position
              return (
                <MenuItem
                  disabled={addAtIndexDisabled}
                  value={addIndex - 1}
                  title={addAtIndexDisabled ? `Cannot have the same stop appear consecutively in list` : ''}
                  key={i}
                  eventKey={addIndex - 1}>
                  {`Insert as stop #${addIndex}`}
                </MenuItem>
              )
            })}
            <MenuItem
              disabled={addToBeginningDisabled}
              value={0}
              eventKey={0}>
              Add to beginning
            </MenuItem>
          </Dropdown.Menu>
        </Dropdown>
      </ButtonGroup>
    )
  }
}
