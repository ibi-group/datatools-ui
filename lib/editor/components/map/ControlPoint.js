import throttle from 'lodash.throttle'
import React, {Component, PropTypes} from 'react'
import {Marker, Tooltip} from 'react-leaflet'
import {shallowEqual} from 'react-pure-render'

export default class ControlPoint extends Component {
  static propTypes = {
    activePattern: PropTypes.object,
    controlPoint: PropTypes.object,
    editSettings: PropTypes.object,
    icon: PropTypes.object,
    index: PropTypes.number,
    handleControlPointDrag: PropTypes.func,
    handleControlPointDragEnd: PropTypes.func,
    next: PropTypes.object,
    permanent: PropTypes.bool,
    position: PropTypes.array,
    previous: PropTypes.object,
    removeControlPoint: PropTypes.func,
    updateActiveEntity: PropTypes.func,
    updateControlPoint: PropTypes.func,
    updatePatternCoordinates: PropTypes.func
  }

  state = {
    latlng: null
  }

  shouldComponentUpdate (nextProps) {
    // TODO: fix this hack that keeps unknown position change (perhaps react-leaflet is updating it) from triggering
    // a component update, which funks with the position of the marker
    return !shallowEqual(nextProps.controlPoint.snap, this.props.controlPoint.snap) ||
      !shallowEqual(nextProps.editSettings.showTooltips, this.props.editSettings.showTooltips)
  }

  _onClick = (e) => {
    const {permanent, removeControlPoint, activePattern, index, previous, next} = this.props
    // only remove controlPoint if it's not based on pattern stop (i.e., has permanent prop)
    if (!permanent) {
      removeControlPoint(activePattern, index, previous, next)
    }
  }

  handleDrag = (e) => {
    const {activePattern, handleControlPointDrag, index, next, previous} = this.props
    const latlng = e.latlng
    this.setState({latlng})
    handleControlPointDrag(index, latlng, previous, next, activePattern)
  }

  _onDragEnd = (e) => {
    const {activePattern, controlPoint, handleControlPointDragEnd, index} = this.props
    this.setState({latlng: null, drag: null})
    handleControlPointDragEnd(index, controlPoint, e, activePattern)
  }

  render () {
    // console.log(this.state)
    const {editSettings, icon, permanent, position} = this.props
    // keep track of position in state because we need this to be cleared once the user has
    // stopped dragging the marker, at which point this.state.latlng will be null and the marker
    // will "snap" back to the polyline
    const {latlng} = this.state
    const markerPosition = latlng
      ? [latlng.lat, latlng.lng]
      : position
    return (
      <Marker
        position={markerPosition}
        icon={icon}
        ref='marker'
        zIndexOffset={1000}
        draggable
        onDrag={throttle(this.handleDrag, 500)}
        // onDragStart={this.handleDrag}
        onDragEnd={this._onDragEnd}
        onClick={this._onClick}
        color='black'>
        {/* TODO: need to fix onDrag so that components updates and hides tooltip while dragging */}
        {!latlng &&
          <Tooltip key={Math.random()} opacity={editSettings.showTooltips ? 0.9 : 0}>
            <span>Drag handle to change shape {permanent ? null : '(click to remove)'}</span>
          </Tooltip>
        }
      </Marker>
    )
  }
}
