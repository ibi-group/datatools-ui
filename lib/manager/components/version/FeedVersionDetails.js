import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, {PropTypes, Component} from 'react'
import {Button, ListGroupItem} from 'react-bootstrap'
import area from 'turf-area'
import bboxPoly from 'turf-bbox-polygon'

import {getConfigProperty, isExtensionEnabled} from '../../../common/util/config'
import VersionDateLabel from './VersionDateLabel'

const dateFormat = 'MMM. DD, YYYY'

export default class FeedVersionDetails extends Component {
  static propTypes = {
    version: PropTypes.object
  }

  getBoundsArea (bounds) {
    const poly = bounds && bboxPoly([bounds.west, bounds.south, bounds.east, bounds.east])
    return poly && area(poly)
  }

  getVersionDates (version, validationJob) {
    const text = validationJob
      ? <span className='loading-ellipsis'>Processing feed ({validationJob.status.percentComplete}%)</span>
      : `Valid from ${moment(version.validationSummary.startDate).format(dateFormat)} to ${moment(version.validationSummary.endDate).format(dateFormat)}`
    return <span><Icon type='calendar' /> {text}</span>
  }

  _onClickPublish = () => this.props.publishFeedVersion(this.props.version)

  render () {
    const {user, validationJob, version} = this.props
    const isPublished = version.id === version.feedSource.publishedVersionId
    const userCanManageFeed = user.permissions.hasFeedPermission(version.feedSource.organizationId, version.feedSource.projectId, version.feedSource.id, 'manage-feed')
    return (
      <ListGroupItem>
        <h4>
          {isExtensionEnabled('mtc')
            ? <Button
              disabled={isPublished || !userCanManageFeed}
              className='pull-right'
              bsStyle={isPublished ? 'success' : 'warning'}
              onClick={this._onClickPublish}>
              {isPublished
                ? <span><Icon type='check-circle' /> Published</span>
                : <span>Publish to MTC</span>
              }
            </Button>
            : null
          }
          {this.getVersionDates(version, validationJob)}
          {' '}
          <VersionDateLabel
            version={version}
            validationJob={validationJob} />
        </h4>
        <p>
          {version.validationSummary && version.validationSummary.avgDailyRevenueTime
            ? <span>
              <Icon type='clock-o' />
              {' '}
              {Math.floor(version.validationSummary.avgDailyRevenueTime / 60 / 60 * 100) / 100} hours daily service (Tuesday)
            </span>
            : null
          }
          {version.validationSummary && version.validationSummary.bounds && getConfigProperty('application.dev')
            ? <span>
              <Icon type='globe' />
              {' '}
              {this.getBoundsArea(version.validationSummary.bounds)} square meters
            </span>
            : null
          }
        </p>
      </ListGroupItem>
    )
  }
}
