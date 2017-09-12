import Icon from '@conveyal/woonerf/components/icon'
import React, { Component, PropTypes } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { Button } from 'react-bootstrap'
import { getFeed } from '../../common/util/modules'
import { divIcon } from 'leaflet'

import TransferPerformance from './TransferPerformance'

export default class StopMarker extends Component {
  static propTypes = {
    stop: PropTypes.object,
    feeds: PropTypes.array,
    renderTransferPerformance: PropTypes.bool,
    onStopClick: PropTypes.func,
    newEntityId: PropTypes.number,
    popupAction: PropTypes.string,
    routes: PropTypes.array
  }

  _onClick = () => {
    const {feeds, newEntityId, onStopClick, stop} = this.props
    const feedId = stop.feed_id || (stop.feed && stop.feed.feed_id)
    const feed = getFeed(feeds, feedId)
    onStopClick(stop, feed, newEntityId)
  }

  render () {
    const {stop, renderTransferPerformance, onStopClick, popupAction, routes} = this.props
    if (!stop) return null
    const busIcon = divIcon({
      html: `<span title="${stop.stop_name}" class="fa-stack bus-stop-icon" style="opacity: 0.6">
              <i class="fa fa-circle fa-stack-2x" style="color: #ffffff"></i>
              <i class="fa fa-bus fa-stack-1x" style="color: #000000"></i>
            </span>`,
      className: '',
      iconSize: [24, 24]
    })
    return (
      <Marker
        ref={`marker-${stop.stop_id}`}
        icon={busIcon}
        position={[stop.stop_lat, stop.stop_lon]}>
        <Popup>
          <div>
            <p><Icon type='map-marker' /> <strong>{stop.stop_name} ({stop.stop_id})</strong></p>
            {renderTransferPerformance && <TransferPerformance stop={stop} routes={routes} />}
            {onStopClick && (
              <Button
                bsStyle='primary'
                block
                onClick={this._onClick}>
                <Icon type='map-marker' /> {popupAction} stop
              </Button>
            )}
          </div>
        </Popup>
      </Marker>
    )
  }
}
