// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, {Component} from 'react'
import {
  Button,
  ButtonToolbar,
  DropdownButton,
  ListGroupItem,
  MenuItem
} from 'react-bootstrap'
import {Link} from 'react-router'
import area from 'turf-area'
import bboxPoly from 'turf-bbox-polygon'

import * as versionsActions from '../../actions/versions'
import {getConfigProperty, isExtensionEnabled} from '../../../common/util/config'
import {BLOCKING_ERROR_TYPES} from '../../util/version'
import VersionDateLabel from './VersionDateLabel'

import type {FeedVersion, GtfsPlusValidation, Bounds, Feed} from '../../../types'
import type {ManagerUserState} from '../../../types/reducers'

type Props = {
  feedSource: Feed,
  gtfsPlusValidation: GtfsPlusValidation,
  mergeVersions: typeof versionsActions.mergeVersions,
  publishFeedVersion: typeof versionsActions.publishFeedVersion,
  user: ManagerUserState,
  version: FeedVersion
}

const dateFormat = 'MMM. DD, YYYY'

export default class FeedVersionDetails extends Component<Props> {
  getBoundsArea (bounds: Bounds): number {
    if (!bounds) return 0
    const poly = bboxPoly([bounds.west, bounds.south, bounds.east, bounds.east])
    return poly ? area(poly) : 0
  }

  /**
   * Check that the validation did not encounter any fatal exception or blocking
   * errors.
   */
  _checkBlockingIssue = (version: FeedVersion) => {
    if (version.validationResult.fatalException) return true
    const errorCounts = version.validationResult.error_counts
    return errorCounts &&
      !!(errorCounts.find(ec => BLOCKING_ERROR_TYPES.indexOf(ec.type) !== -1))
  }

  _handleMergeVersion = (versionId: string) => {
    // For now, merging feeds only works for the MTC extension. It will fail
    // when the 'none' merge type is used.
    // TODO: add support for other merge types.
    const mergeType = isExtensionEnabled('mtc') ? 'MTC' : 'none'
    this.props.mergeVersions(this.props.version.id, versionId, mergeType)
  }

  _onClickPublish = () => this.props.publishFeedVersion(this.props.version)

  render () {
    const {feedSource, gtfsPlusValidation, user, version} = this.props
    const {validationSummary: summary} = version
    // We must check the version ID against the feed source in props (not the
    // feed source nested underneath version) because this is the only place the
    // published version is updated.
    const isPublished = version.namespace === feedSource.publishedVersionId
    // Version is in the "processing" state if it has been sent to external
    // source, but has not been processed yet.
    const processing = version.sentToExternalPublisher &&
      !version.processedByExternalPublisher
    const userCanManageFeed = user.permissions &&
      user.permissions.hasFeedPermission(
        version.feedSource.organizationId,
        version.feedSource.projectId,
        version.feedSource.id,
        'manage-feed'
      )
    const hasBlockingIssue = this._checkBlockingIssue(version)
    return (
      <ListGroupItem>
        <h4>
          {isExtensionEnabled('mtc')
            ? <ButtonToolbar className='pull-right' style={{marginTop: '-7px'}}>
              {// Only show merge feeds button if the feed starts in the future.
                // FIXME: uncomment out the below to prevent merges with non-future feeds.
                // moment(summary.startDate).isAfter(moment().startOf('day')) &&
                <DropdownButton
                  id={'merge-versions-dropdown'}
                  title={<span><Icon type='code-fork' /> Merge with version</span>}
                  onSelect={this._handleMergeVersion}>
                  {feedSource.feedVersions && feedSource.feedVersions.map((v, i) => {
                    if (v.id === version.id) {
                      return (
                        <MenuItem key={v.id} disabled eventKey={null}>
                          {v.version}. (Cannot merge with self)
                        </MenuItem>
                      )
                    }
                    return <MenuItem key={v.id} eventKey={v.id}>{v.version}. {v.name}</MenuItem>
                  })}
                </DropdownButton>
              }
              <Button
                disabled={
                  !gtfsPlusValidation ||
                  gtfsPlusValidation.issues.length > 0 ||
                  !gtfsPlusValidation.published ||
                  !version.validationResult ||
                  !version.validationResult.error_counts ||
                  hasBlockingIssue ||
                  isPublished ||
                  processing ||
                  !userCanManageFeed
                }
                bsStyle={isPublished ? 'success' : 'warning'}
                onClick={this._onClickPublish}>
                {isPublished
                  ? <span><Icon type='check-circle' /> Published</span>
                  : processing
                    ? <span>Processing...</span>
                    : <span>Publish to MTC</span>
                }
              </Button>
            </ButtonToolbar>
            : null
          }
          <span data-test-id='feed-version-validity'>
            <Icon type='calendar' />{' '}
            Valid from {moment(summary.startDate).format(dateFormat)}{' '}
            to {moment(summary.endDate).format(dateFormat)}
          </span>
          {' '}
          <VersionDateLabel version={version} />
          {hasBlockingIssue &&
            <div
              className='text-danger'
              style={{
                position: 'absolute',
                bottom: '1px',
                right: '5px',
                fontSize: 'x-small'
              }}>
              Cannot publish version because it has a blocking issue.
              (See{' '}
              <Link
                to={`/feed/${feedSource.id}/version/${version.version}/issues`}>
                validation issues
              </Link>.)
            </div>
          }
        </h4>
        <p>
          {summary && summary.avgDailyRevenueTime
            ? <span>
              <Icon type='clock-o' />
              {' '}
              {Math.floor(summary.avgDailyRevenueTime / 60 / 60 * 100) / 100}{' '}
              hours daily service (Tuesday)
            </span>
            : null
          }
          {summary && summary.bounds && getConfigProperty('application.dev')
            ? <span>
              <Icon type='globe' />
              {' '}
              {this.getBoundsArea(summary.bounds)} square meters
            </span>
            : null
          }
        </p>
      </ListGroupItem>
    )
  }
}
