// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {PureComponent} from 'react'
import {Button, ListGroupItem, ListGroup, Panel} from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import FeedSourceTableRow from '../containers/FeedSourceTableRow'
import ProjectFeedListToolbar from '../containers/ProjectFeedListToolbar'
import type {Props as ContainerProps} from '../containers/FeedSourceTable'
import type {Feed} from '../../types'
import type {
  FeedSourceTableComparisonColumns,
  FeedSourceTableSortStrategiesWithOrders,
  ManagerUserState
} from '../../types/reducers'

type Props = ContainerProps & {
  comparisonColumn: FeedSourceTableComparisonColumns,
  feedSources: Array<Feed>,
  filteredFeedSources: Array<Feed>,
  isFetching: boolean,
  isNotAdmin: boolean,
  sort: FeedSourceTableSortStrategiesWithOrders,
  user: ManagerUserState
}

export default class FeedSourceTable extends PureComponent<Props> {
  messages = getComponentMessages('FeedSourceTable')

  _renderTable = () => {
    const {comparisonColumn, filteredFeedSources, project} = this.props
    return (
      <table className='feed-source-table'>
        <thead>
          <tr>
            <th />
            {comparisonColumn &&
              <th className='comparison-column top-row'>
                <h4>{this.messages(`comparisonColumn.${comparisonColumn}`)}</h4>
              </th>
            }
            <th className='feed-version-column top-row' colSpan={3}>
              <h4>{this.messages('latestVersion')}</h4>
            </th>
            <th />
          </tr>
          <tr>
            <th>
              <h4>
                <Icon type='info-circle' />
                {this.messages('feedInfo')}
              </h4>
            </th>
            {comparisonColumn &&
              <th className='comparison-column'>
                <h4>
                  <Icon type='heartbeat' />
                  {this.messages('status')}
                </h4>
              </th>
            }
            <th className='feed-version-column'>
              <h4>
                <Icon type='heartbeat' />
                {this.messages('status')}
              </h4>
            </th>
            <th className='feed-version-column'>
              <h4>
                <Icon type='calendar-check-o' />
                {this.messages('datesValid')}
              </h4>
            </th>
            <th className='feed-version-column'>
              <h4>
                <Icon type='exclamation-triangle' />
                {this.messages('issues')}
              </h4>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filteredFeedSources.map((feedSource: Feed) =>
            <FeedSourceTableRow
              feedSource={feedSource}
              key={feedSource.id || Math.random()}
              project={project}
            />
          )}
        </tbody>
      </table>
    )
  }

  render () {
    const {
      feedSources,
      filteredFeedSources,
      isFetching,
      isNotAdmin,
      onNewFeedSourceClick,
      project
    } = this.props

    return (
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>
          <ProjectFeedListToolbar
            onNewFeedSourceClick={onNewFeedSourceClick}
            project={project}
          />
        </Panel.Title></Panel.Heading>
        <ListGroup>
          {isFetching
            ? <ListGroupItem className='text-center'>
              <Icon className='fa-2x fa-spin' type='refresh' />
            </ListGroupItem>
            : feedSources.length
              ? filteredFeedSources.length
                ? this._renderTable()
                : <ListGroupItem className='text-center'>
                  <h5>Aucune source de flux ne correspond à ces filtres.</h5>
                </ListGroupItem>
              : <ListGroupItem className='text-center'>
                <Button
                  bsStyle='success'
                  data-test-id='create-first-feed-source-button'
                  disabled={isNotAdmin}
                  onClick={onNewFeedSourceClick}>
                  <Icon type='plus' /> {this.messages('createFirst')}
                </Button>
              </ListGroupItem>
          }
        </ListGroup>
      </Panel>
    )
  }
}
