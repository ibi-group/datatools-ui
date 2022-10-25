// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Row, Col, Button, ButtonToolbar } from 'react-bootstrap'
import { Link } from 'react-router'
import moment from 'moment'
import numeral from 'numeral'

import WatchButton from '../../common/containers/WatchButton'
import StarButton from '../../common/containers/StarButton'
import { getComponentMessages, getConfigProperty } from '../../common/util/config'
import type {Feed, FeedVersionSummary, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  feedSource: Feed,
  project: Project,
  user: ManagerUserState
}

export default class ManagerHeader extends Component<Props> {
  messages = getComponentMessages('ManagerHeader')

  getAverageFileSize (feedVersionSummaries: ?Array<FeedVersionSummary>) {
    let sum = 0
    let avg
    if (feedVersionSummaries) {
      for (let i = 0; i < feedVersionSummaries.length; i++) {
        sum += feedVersionSummaries[i].fileSize
      }
      avg = sum / feedVersionSummaries.length
    }
    return numeral(avg || 0).format('0 b')
  }

  render () {
    const { feedSource, project, user } = this.props
    const isWatchingFeed = user.subscriptions &&
      user.subscriptions.hasFeedSubscription(
        project.id,
        feedSource.id,
        'feed-updated'
      )
    const dateFormat = getConfigProperty('application.date_format') || ''
    return (
      <Row className='manager-header'>
        {/*  Title + Shortcut Buttons Row */}
        <Col xs={12}>
          <h3>
            <Icon className='icon-link' type='folder-open-o' />
            <Link
              data-test-id='feed-project-link'
              to={`/project/${this.props.project.id}`}
            >
              {project.name}
            </Link>
            {' '}/{' '}
            <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link>{' '}
            {feedSource.isPublic
              ? null
              : <Icon
                className='text-warning'
                title={this.messages('private')}
                type='lock' />
            }
            {' '}
            <ButtonToolbar
              className={`pull-right`}>
              {getConfigProperty('application.dev') &&
                // $FlowFixMe StarButton has issues with the updateStar action
                <StarButton
                  isStarred
                  user={user}
                  target={feedSource.id} />
              }
              <WatchButton
                isWatching={isWatchingFeed}
                user={user}
                target={feedSource.id}
                subscriptionType='feed-updated' />
              {getConfigProperty('application.dev') &&
                <Button><Icon type='thumbs-o-up' /></Button>
              }
            </ButtonToolbar>
          </h3>
          <ul
            className='list-unstyled list-inline small'
            style={{marginBottom: '0px'}}>
            <li>
              <Icon type='clock-o' />{' '}
              {feedSource.lastUpdated
                ? moment(feedSource.lastUpdated).format(dateFormat)
                : this.messages('noUpdateYet')
              }
            </li>
            <li><Icon type='link' /> {feedSource.url || this.messages('noUrl')}
            </li>
            <li>
              <Icon type='file-archive-o' />{' '}
              {this.getAverageFileSize(feedSource.feedVersionSummaries)}
            </li>
          </ul>
        </Col>
      </Row>
    )
  }
}
