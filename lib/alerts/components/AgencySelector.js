import React, {Component, PropTypes} from 'react'
import {FormControl} from 'react-bootstrap'

import {getFeed, getFeedId} from '../../common/util/modules'

export default class AgencySelector extends Component {
  static propTypes = {
    feeds: PropTypes.array,
    entity: PropTypes.object,
    entityUpdated: PropTypes.func
  }

  _onSelect = (evt) => {
    this.props.entityUpdated(this.props.entity, 'AGENCY', getFeed(this.props.feeds, evt.target.value))
  }
  render () {
    const {feeds, entity} = this.props
    return (
      <div>
        <FormControl
          componentClass='select'
          value={entity.agency && getFeedId(entity.agency)}
          onChange={this._onSelect}>
          {feeds.map((feed) => (
            <option key={getFeedId(feed) || feed.id} value={getFeedId(feed) || feed.id}>{feed.name}</option>
          ))}
        </FormControl>
      </div>
    )
  }
}
