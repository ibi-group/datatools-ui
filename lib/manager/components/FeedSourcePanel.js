// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {ListGroupItem, Panel, Badge, ListGroup, FormControl, ButtonGroup} from 'react-bootstrap'
import {Link} from 'react-router'

import * as visibilityFilterActions from '../actions/visibilityFilter'
import OptionButton from '../../common/components/OptionButton'
import {getComponentMessages} from '../../common/util/config'
import {getAbbreviatedProjectName} from '../../common/util/util'
import type {Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  activeProject: Project,
  setVisibilityFilter: typeof visibilityFilterActions.setVisibilityFilter,
  setVisibilitySearchText: typeof visibilityFilterActions.setVisibilitySearchText,
  user: ManagerUserState,
  visibilityFilter: any
}

export default class FeedSourcePanel extends Component<Props> {
  messages = getComponentMessages('FeedSourcePanel')

  _feedVisibilityFilter = (feed: Feed) => {
    const {visibilityFilter} = this.props
    const name = feed.name || this.messages('unnamed')
    const searchText = (visibilityFilter.searchText || '').toLowerCase()
    const visible = name.toLowerCase().indexOf(searchText) !== -1
    switch (visibilityFilter.filter) {
      case 'ALL':
        return visible
      case 'STARRED':
        return [].indexOf(feed.id) !== -1 // FIXME check userMetaData
      case 'PUBLIC':
        return feed.isPublic
      case 'PRIVATE':
        return !feed.isPublic
      default:
        return visible
    }
    // if (feed.isCreating) return true // feeds actively being created are always visible
  }

  renderFeedItems = (p: Project, fs: Feed) => {
    const feedName = `${getAbbreviatedProjectName(p)} / ${fs.name}`
    return (
      <ListGroupItem bsStyle={fs.isPublic ? null : 'warning'} key={fs.id}>
        <Link title={feedName} to={`/feed/${fs.id}`}>
          <Icon className='icon-link' type={fs.isPublic ? 'database' : 'lock'} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {feedName.length > 33 ? `${feedName.substr(0, 33)}...` : feedName}
          </span>
        </Link>
      </ListGroupItem>
    )
  }

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.setVisibilitySearchText(evt.target.value)

  render () {
    const {
      activeProject,
      setVisibilityFilter,
      user,
      visibilityFilter
    } = this.props
    const BUTTON_FILTERS = ['ALL', 'STARRED', 'PUBLIC', 'PRIVATE']
    const isProjectAdmin = user.permissions && activeProject &&
      user.permissions.isProjectAdmin(
        activeProject.id,
        activeProject.organizationId
      )
    return (
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>{this.messages('forFeed')}{' '}
          {activeProject
            ? getAbbreviatedProjectName(activeProject)
            : this.messages('chooseProject')
          }{' '}
          {activeProject && activeProject.feedSources &&
            <Badge>{activeProject.feedSources.length}</Badge>
          }</Panel.Title></Panel.Heading>
        <ListGroup>
          <ListGroupItem>
            <FormControl
              onChange={this._onChangeSearch}
              placeholder={this.messages('search')} />
            <ButtonGroup justified style={{marginTop: 10}}>
              {BUTTON_FILTERS.map(b => (
                <OptionButton
                  active={visibilityFilter.filter === b ||
                    (b === 'ALL' && !visibilityFilter.filter)
                  }
                  bsSize='xsmall'
                  href='#'
                  key={b}
                  onClick={setVisibilityFilter}
                  value={b}>{this.messages('filters' + '.' + b)}</OptionButton>
              ))}
            </ButtonGroup>
          </ListGroupItem>
          {activeProject && activeProject.feedSources
            ? activeProject.feedSources
              .filter(this._feedVisibilityFilter)
              .map(fs => this.renderFeedItems(activeProject, fs))
            : activeProject
              ? <ListGroupItem>
                <p className='lead text-center'>
                  {this.messages('noFeedsYet')}{' '}
                  {isProjectAdmin &&
                    <Link to={`/project/${activeProject.id}`}>{this.messages('createOne')}</Link>
                  }
                </p>
              </ListGroupItem>
              : <ListGroupItem>
                <p className='lead text-center'>
                  {this.messages('chooseProjectToView')}
                </p>
              </ListGroupItem>
          }
        </ListGroup>
      </Panel>
    )
  }
}
