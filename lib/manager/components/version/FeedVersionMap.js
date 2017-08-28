import React, {PropTypes, Component} from 'react'
import {ButtonGroup, ListGroupItem} from 'react-bootstrap'

import OptionButton from '../../../common/components/OptionButton'
import ActiveGtfsMap from '../../../gtfs/containers/ActiveGtfsMap'

const MAP_HEIGHTS = [200, 400]

export default class FeedVersionMap extends Component {
  static propTypes = {
    version: PropTypes.object
  }

  state = {
    mapHeight: MAP_HEIGHTS[0]
  }

  _toggleMapHeight = (mapHeight) => this.setState({mapHeight})

  render () {
    const {version} = this.props
    const itemStyle = {
      maxHeight: `${this.state.mapHeight}px`,
      overflowY: 'hidden',
      padding: '0px'
    }
    const buttonGroupStyle = {
      position: 'absolute',
      zIndex: 20000,
      right: 5,
      top: 5
    }
    return (
      <ListGroupItem style={itemStyle}>
        {/* Map size buttons */}
        <ButtonGroup bsSize='small' style={buttonGroupStyle}>
          <OptionButton
            active={this.state.mapHeight === MAP_HEIGHTS[0]}
            value={MAP_HEIGHTS[0]}
            onClick={this._toggleMapHeight}>
            Slim
          </OptionButton>
          <OptionButton
            active={this.state.mapHeight === MAP_HEIGHTS[1]}
            value={MAP_HEIGHTS[1]}
            onClick={this._toggleMapHeight}>
            Large
          </OptionButton>
        </ButtonGroup>
        {/* Primary map component */}
        <ActiveGtfsMap
          ref='map'
          version={version}
          disableRefresh
          disableScroll
          disablePopup
          renderTransferPerformance
          showBounds={this.props.tab === 'feed' || this.props.tab === 'accessibility'}
          showIsochrones={this.props.tab === 'accessibility'}
          isochroneBand={this.props.isochroneBand}
          height={this.state.mapHeight}
          width='100%' />
      </ListGroupItem>
    )
  }
}
