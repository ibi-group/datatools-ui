import React, { Component, PropTypes } from 'react'

import { getFeed } from '../../common/util/modules'
import GtfsSearch from '../../gtfs/components/gtfssearch'

export default class StopSelector extends Component {
  static propTypes = {
    entity: PropTypes.object,
    stop: PropTypes.object,
    feeds: PropTypes.array,
    entityUpdated: PropTypes.func,
    filterByRoute: PropTypes.bool,
    minimumInput: PropTypes.number,
    clearable: PropTypes.bool
  }

  _onChange = (evt) => {
    const {entityUpdated, entity} = this.props
    if (evt) {
      entityUpdated(entity, 'STOP', evt.stop, evt.agency)
    } else if (evt === null) {
      entityUpdated(entity, 'STOP', null, null)
    }
  }

  render () {
    const {stop, feeds, minimumInput, filterByRoute, clearable} = this.props
    const feed = stop ? getFeed(feeds, stop.feed_id) : null
    const agencyName = feed ? feed.name : 'Unknown agency'
    return (
      <GtfsSearch
        feeds={feeds}
        limit={100}
        minimumInput={minimumInput}
        filterByRoute={filterByRoute}
        entities={['stops']}
        clearable={clearable}
        onChange={this._onChange}
        value={
          stop
          ? {
            stop: stop,
            value: stop.stop_id,
            label: `${stop.stop_name} (${agencyName})`
          }
          : ''
        } />
    )
  }
}
