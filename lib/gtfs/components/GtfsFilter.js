// @flow

import React, {Component} from 'react'
import { Button, Dropdown, MenuItem, Label as BsLabel, ButtonToolbar } from 'react-bootstrap'

import * as actionFilters from '../actions/filter'

import type {Props as ContainerProps} from '../containers/GlobalGtfsFilter'
import type {Feed} from '../../types'

type Props = ContainerProps & {
  activeAndLoadedFeeds: Array<Feed>,
  activeFeeds: Array<Feed>,
  addActiveFeed: typeof actionFilters.addActiveFeed,
  addAllActiveFeeds: typeof actionFilters.addAllActiveFeeds,
  allFeeds: Array<Feed>,
  loadedFeeds: Array<Feed>,
  removeActiveFeed: typeof actionFilters.removeActiveFeed,
  removeAllActiveFeeds: typeof actionFilters.removeAllActiveFeeds,
}

export default class GtfsFilter extends Component<Props> {
  getFeedSummary (feeds: Array<Feed>) {
    const feedNames = feeds
      .map(feed => feed.name.length > 11
        ? feed.name.substr(0, 11) + '...'
        : feed.name
      )
      .join(' and ')
    return feeds.length === 0
      ? 'Aucun flux sélectionné'
      : feeds.length < 3
        ? `Recherche des flux ${feedNames}`
        : `Recherche de ${feeds.length} fluxs`
  }

  _onSelect = (feedId: string) => {
    const {activeFeeds, addActiveFeed, removeActiveFeed} = this.props
    if (!activeFeeds.find(f => f.id === feedId)) addActiveFeed(feedId)
    else removeActiveFeed(feedId)
  }

  _onToggleAll = () => this.props.activeFeeds.length > 0
    ? this.props.removeAllActiveFeeds()
    : this.props.addAllActiveFeeds()

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
              ? allFeeds.map(feed => {
                const isPublished = feed.publishedVersionId !== null
                // Disable item if loaded feeds does not have feed ID.
                const disabled = !loadedFeeds.some(f => f.id === feed.id)
                const feedIsInactive = !activeFeeds.some(f => f.id === feed.id)
                return (
                  <MenuItem
                    key={feed.id}
                    style={{width: '200px'}}
                    eventKey={feed.id}
                    alt={feed.name}
                    disabled={disabled}
                    title={feed.name}>
                    <span>
                      <BsLabel
                        bsStyle={disabled && isPublished
                          ? 'warning'
                          : disabled
                            ? 'danger'
                            : feedIsInactive
                              ? 'danger'
                              : 'success'
                        }
                        className='pull-right'>
                        {disabled && isPublished
                          ? 'pending'
                          : disabled
                            ? 'unpublished'
                            : feedIsInactive
                              ? 'off'
                              : 'on'
                        }
                      </BsLabel>
                      <span>
                        {feed.name.length > 11
                          ? feed.name.substr(0, 11) + '...'
                          : feed.name
                        }
                      </span>
                    </span>
                  </MenuItem>
                )
              })
              : <MenuItem disabled>Pas de flux disponibles</MenuItem>
            }
          </Dropdown.Menu>
        </Dropdown>
        <Button
          bsSize='small'
          disabled={allFeeds.length === 0}
          onClick={this._onToggleAll}>
          {activeFeeds.length > 0 ? 'Tout supprimer' : 'Tout ajouter'}
        </Button>
      </ButtonToolbar>
    )
  }
}
