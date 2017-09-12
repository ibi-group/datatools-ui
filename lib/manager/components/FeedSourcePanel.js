import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {ListGroupItem, Panel, Badge, ListGroup, FormControl, ButtonGroup} from 'react-bootstrap'
import {Link} from 'react-router'

import OptionButton from '../../common/components/OptionButton'
import {getComponentMessages, getMessage} from '../../common/util/config'
import toSentenceCase from '../../common/util/to-sentence-case'

export default class FeedSourcePanel extends Component {
  static propTypes = {
    activeProject: PropTypes.object,
    visibilityFilter: PropTypes.object,
    searchTextChanged: PropTypes.func,
    user: PropTypes.object,
    visibilityFilterChanged: PropTypes.func
  }

  _feedVisibilityFilter = (feed) => {
    const {visibilityFilter} = this.props
    const name = feed.name || 'unnamed'
    const visible = name.toLowerCase().indexOf((visibilityFilter.searchText || '').toLowerCase()) !== -1
    switch (visibilityFilter.filter) {
      case 'ALL':
        return visible
      case 'STARRED':
        return [].indexOf(feed.id) !== -1 // check userMetaData
      case 'PUBLIC':
        return feed.isPublic
      case 'PRIVATE':
        return !feed.isPublic
      default:
        return visible
    }
    // if (feed.isCreating) return true // feeds actively being created are always visible
  }

  renderFeedItems = (p, fs) => {
    const feedName = `${p.name} / ${fs.name}`
    return (
      <ListGroupItem key={fs.id} bsStyle={fs.isPublic ? null : 'warning'}>
        <Link title={feedName} to={`/feed/${fs.id}`}>
          <Icon className='icon-link' type={fs.isPublic ? 'database' : 'lock'} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {feedName.length > 33 ? `${feedName.substr(0, 33)}...` : feedName}
          </span>
        </Link>
      </ListGroupItem>
    )
  }

  _onChangeSearch = evt => this.props.searchTextChanged(evt.target.value)

  render () {
    const messages = getComponentMessages('FeedSourcePanel')
    const {
      activeProject,
      visibilityFilter,
      user,
      visibilityFilterChanged
    } = this.props
    const BUTTON_FILTERS = ['ALL', 'STARRED', 'PUBLIC', 'PRIVATE']
    return (
      <Panel header={
        <h3>Feeds for {activeProject ? activeProject.name : '[choose project]'} {activeProject && activeProject.feedSources &&
          <Badge>{activeProject.feedSources.length}</Badge>
        }</h3>
      }>
        <ListGroup fill>
          <ListGroupItem>
            <FormControl
              placeholder={getMessage(messages, 'search')}
              onChange={this._onChangeSearch} />
            <ButtonGroup style={{marginTop: 10}} justified>
              {BUTTON_FILTERS.map(b => (
                <OptionButton
                  active={visibilityFilter.filter === b || (b === 'ALL' && !visibilityFilter.filter)}
                  bsSize='xsmall'
                  key={b}
                  onClick={visibilityFilterChanged}
                  value={b}
                  href='#'>{toSentenceCase(b)}</OptionButton>
              ))}
            </ButtonGroup>
          </ListGroupItem>
          {activeProject && activeProject.feedSources
            ? activeProject.feedSources.filter(this._feedVisibilityFilter).map(fs => this.renderFeedItems(activeProject, fs))
            : activeProject
            ? <ListGroupItem>
              <p className='lead text-center'>
                No feeds yet.{' '}
                {user.permissions.isProjectAdmin(activeProject.id, activeProject.organizationId) && <Link to={`/project/${activeProject.id}`}>Create one.</Link>}
              </p>
            </ListGroupItem>
            : <ListGroupItem><p className='lead text-center'>Choose a project to view feeds</p></ListGroupItem>
              // projects && projects.map(p => {
              //   return p.feedSources && p.feedSources.filter(this._feedVisibilityFilter).map(fs => this.renderFeedItems(p, fs))
              // })
          }
        </ListGroup>
      </Panel>
    )
  }
}
