import Icon from '@conveyal/woonerf/components/icon'
import { divIcon } from 'leaflet'
import React, {PropTypes, Component} from 'react'
import { MenuItem, SplitButton } from 'react-bootstrap'
import {Marker, Popup} from 'react-leaflet'

export default class AddableStop extends Component {
  static propTypes = {
    activePattern: PropTypes.object,
    addStopToPattern: PropTypes.func,
    stop: PropTypes.object
  }

  _onClickAddStopToEnd = () => this.props.addStopToPattern(this.props.activePattern, this.props.stop)

  _onSelectStop = (key) => this.props.addStopToPattern(this.props.activePattern, this.props.stop, key)

  render () {
    const {
      activePattern,
      stop
    } = this.props
    const color = 'blue'
    const stopName = `${stop.stop_name} (${stop.stop_code ? stop.stop_code : stop.stop_id})`
    const transparentBusIcon = divIcon({
      html: `<span title="${stopName}" class="fa-stack" style="opacity: 0.3">
              <i class="fa fa-circle fa-stack-2x" style="color: #ffffff"></i>
              <i class="fa fa-bus fa-stack-1x" style="color: ${color}"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    return (
      <Marker
        position={[stop.stop_lat, stop.stop_lon]}
        icon={transparentBusIcon}>
        <Popup>
          <div style={{minWidth: '180px'}}>
            <h5>{stopName}</h5>
            <SplitButton
              title={<span><Icon type='plus' /> Add stop</span>}
              id={`add-stop-dropdown`}
              bsStyle='success'
              onSelect={this._onSelectStop}
              onClick={this._onClickAddStopToEnd}>
              <MenuItem
                value={activePattern.patternStops.length}
                eventKey={activePattern.patternStops.length}>
                Add to end (default)
              </MenuItem>
              {activePattern.patternStops && activePattern.patternStops.map((stop, i) => {
                const index = activePattern.patternStops.length - i
                return (
                  <MenuItem
                    value={index - 1}
                    eventKey={index - 1}
                    key={i}>
                    {index === 1 ? 'Add to beginning' : `Insert as stop #${index}`}
                  </MenuItem>
                )
              })}
            </SplitButton>
          </div>
        </Popup>
      </Marker>
    )
  }
}
