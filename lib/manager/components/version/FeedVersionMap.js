// @flow

import React, {Component} from 'react'
import {ButtonGroup, ListGroupItem} from 'react-bootstrap'

import OptionButton from '../../../common/components/OptionButton'
import ActiveGtfsMap from '../../../gtfs/containers/ActiveGtfsMap'
import ShowAllRoutesOnMapFilter from '../../../gtfs/containers/ShowAllRoutesOnMapFilter'

type Props = {
  tab: any,
  version: any
}

type State = {
  mapHeight: number
}

const MAP_HEIGHTS = [200, 400]

export default class FeedVersionMap extends Component<Props, State> {
  state = {
    mapHeight: MAP_HEIGHTS[0]
  }

  _toggleMapHeight = (mapHeight: number) => this.setState({mapHeight})

  render () {
    const {tab, version} = this.props
    const {mapHeight} = this.state
    const itemStyle = {
      maxHeight: `${mapHeight}px`,
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
            Petite
          </OptionButton>
          <OptionButton
            active={this.state.mapHeight === MAP_HEIGHTS[1]}
            value={MAP_HEIGHTS[1]}
            onClick={this._toggleMapHeight}>
            Grande
          </OptionButton>
        </ButtonGroup>
        {/* All routes checkbox */}
        <div
          className='panel panel-default'
          style={{
            bottom: 5,
            left: 5,
            margin: 0,
            padding: '0 10px',
            position: 'absolute',
            zIndex: 20000
          }}>
          <ShowAllRoutesOnMapFilter version={version} />
        </div>
        {/* Primary map component */}
        <ActiveGtfsMap
          ref='map'
          version={version}
          disableRefresh
          disableScroll
          disablePopup
          renderTransferPerformance
          showBounds={tab === 'feed'}
          showPatterns={tab === 'stops' || tab === 'patterns' || tab === 'timetables'}
          showStops={tab === 'stops' || tab === 'timetables'}
          height={mapHeight}
          width='100%' />
      </ListGroupItem>
    )
  }
}
