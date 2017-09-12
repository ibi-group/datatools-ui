import React, {Component, PropTypes} from 'react'
import { Button, Dropdown, MenuItem, Label, ButtonToolbar } from 'react-bootstrap'

export default class GtfsFilter extends Component {
  static propTypes ={
    activeFeeds: PropTypes.array,
    activeAndLoadedFeeds: PropTypes.array,
    allFeeds: PropTypes.array,
    loadedFeeds: PropTypes.array,
    onAddAllFeeds: PropTypes.func,
    onAddFeed: PropTypes.func,
    onRemoveAllFeed: PropTypes.func,
    onRemoveFeed: PropTypes.func
  }

  getFeedSummary (feeds) {
    return feeds.length === 0
      ? 'No feeds selected'
      : feeds.length < 3
      ? `Searching ${
        feeds.map(feed => feed.name.length > 11
        ? feed.name.substr(0, 11) + '...'
        : feed.name).join(' and ')
      }`
      : `Searching ${feeds.length} feeds`
  }

  _onSelect = eventKey => {
    const feed = this.props.allFeeds.find(f => f.id === eventKey)
    if (this.props.activeFeeds.indexOf(feed) === -1) {
      this.props.onAddFeed(feed)
    } else {
      this.props.onRemoveFeed(feed)
    }
  }

  _onToggleAll = () => this.props.activeFeeds.length > 0
    ? this.props.onRemoveAllFeeds()
    : this.props.onAddAllFeeds()

  render () {
    const {
      activeFeeds,
      activeAndLoadedFeeds,
      allFeeds,
      loadedFeeds
    } = this.props
    const buttonMinimalStyle = {
      marginTop: '10px',
      marginBottom: '5px'
    }
    return (
      <ButtonToolbar
        className='pull-right'
        style={buttonMinimalStyle}>
        <Dropdown
          bsSize='small'
          disabled={allFeeds.length === 0}
          title={activeAndLoadedFeeds.map(f => f.name).join(', ')}
          onSelect={this._onSelect}
          id='gtfs-feed-filter'>
          <Dropdown.Toggle>
            {this.getFeedSummary(activeAndLoadedFeeds)}
          </Dropdown.Toggle>
          <Dropdown.Menu className='scrollable-dropdown'>
            {allFeeds.length > 0
             ? allFeeds.map((feed) => {
               const isPublished = feed.publishedVersionId !== null
               const disabled = loadedFeeds.findIndex(f => f.id === feed.id) === -1
               return (
                 <MenuItem
                   key={feed.id}
                   style={{width: '200px'}}
                   eventKey={feed.id}
                   alt={feed.shortName || feed.name}
                   disabled={disabled}
                   title={feed.shortName || feed.name}>
                   <span>
                     <Label
                       bsStyle={disabled && isPublished
                         ? 'warning'
                         : disabled
                         ? 'danger'
                         : activeFeeds.indexOf(feed) === -1
                         ? 'danger'
                         : 'success'
                       }
                       className='pull-right'>
                       {disabled && isPublished
                         ? 'pending'
                         : disabled
                         ? 'unpublished'
                         : activeFeeds.indexOf(feed) === -1
                         ? 'off'
                         : 'on'
                       }
                     </Label>
                     <span>
                       {feed.shortName || feed.name.length > 11
                         ? feed.name.substr(0, 11) + '...'
                         : feed.name
                       }
                     </span>
                   </span>
                 </MenuItem>
               )
             })
            : <MenuItem disabled>
             No feeds available
            </MenuItem>
            }
          </Dropdown.Menu>
        </Dropdown>
        <Button
          bsSize='small'
          disabled={allFeeds.length === 0}
          onClick={this._onToggleAll}>
          {activeFeeds.length > 0 ? 'Remove All' : 'Add All'}
        </Button>
      </ButtonToolbar>
    )
  }
}
