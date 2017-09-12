import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Row, Col, Button, ButtonToolbar } from 'react-bootstrap'
import { Link } from 'react-router'
import moment from 'moment'
import numeral from 'numeral'

import WatchButton from '../../common/containers/WatchButton'
import StarButton from '../../common/containers/StarButton'
import { getConfigProperty } from '../../common/util/config'

export default class ManagerHeader extends Component {
  static propTypes = {
    feedSource: PropTypes.object,
    user: PropTypes.object
  }
  getAverageFileSize (feedVersions) {
    let sum = 0
    let avg
    if (feedVersions) {
      for (var i = 0; i < feedVersions.length; i++) {
        sum += feedVersions[i].fileSize
      }
      avg = sum / feedVersions.length
    }
    return numeral(avg || 0).format('0 b')
  }
  render () {
    const { feedSource, project, user } = this.props
    const isWatchingFeed = user.subscriptions.hasFeedSubscription(project.id, feedSource.id, 'feed-updated')
    const dateFormat = getConfigProperty('application.date_format')
    return (
      <Row
        style={{
          backgroundColor: '#F5F5F5',
          margin: '-40px',
          paddingTop: '40px',
          marginBottom: '-64px',
          paddingBottom: '60px',
          paddingRight: '20px',
          paddingLeft: '20px',
          borderBottom: '1px #e3e3e3 solid'
        }}>
        {/*  Title + Shortcut Buttons Row */}
        <Col xs={12}>
          <h3>
            <Icon className='icon-link' type='folder-open-o' />
            <Link to={`/project/${this.props.project.id}`}>{project.name}</Link>
            {' '}/{' '}
            <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link>{' '}
            {feedSource.isPublic ? null : <Icon className='text-warning' title='This feed source and all its versions are private.' type='lock' />}
            {' '}
            {feedSource.editedSinceSnapshot
              ? <Icon style={{display: 'inline-block', paddingBottom: '3px', verticalAlign: 'middle', fontSize: '50%'}} className='text-warning' title='There are unpublished edits for this feed source.' type='circle' />
              : <Icon style={{display: 'inline-block', paddingBottom: '3px', verticalAlign: 'middle', fontSize: '50%'}} className='text-success' title='No edits since last publish.' type='circle' />
            }
            <ButtonToolbar
              className={`pull-right`}>
              {getConfigProperty('application.dev') &&
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
          <ul className='list-unstyled list-inline small' style={{marginBottom: '0px'}}>
            <li><Icon type='clock-o' /> {feedSource.lastUpdated ? moment(feedSource.lastUpdated).format(dateFormat) : 'n/a'}</li>
            <li><Icon type='link' /> {feedSource.url ? feedSource.url : '(none)'}
            </li>
            {<li><Icon type='file-archive-o' /> {this.getAverageFileSize(feedSource.feedVersions)}</li>}
          </ul>
          {/* <li><Icon type='list-ol' /> {feedSource.feedVersionCount}</li><small style={{marginLeft: '30px'}}><Icon type='link' /> <a href={feedSource.url}>{feedSource.url}</a></small> */}
        </Col>
      </Row>
    )
  }
}
