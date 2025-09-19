// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, { Component } from 'react'
import { Button, ButtonToolbar, MenuItem } from 'react-bootstrap'
import { Link } from 'react-router'
import { connect } from 'react-redux'

import * as versionsActions from '../../actions/versions'
import { BLOCKING_ERROR_TYPES } from '../../util/version'
import type { Feed, FeedVersion, FeedVersionSummary, GtfsPlusValidation, ServerJob } from '../../../types'
import type { ManagerUserState } from '../../../types/reducers'

import VersionRetrievalBadge from './VersionRetrievalBadge'
import VersionSelectorDropdown from './VersionSelectorDropdown'

export type Props = {
  feedSource: Feed,
  gtfsPlusValidation: GtfsPlusValidation,
  jobs?: Array<ServerJob>,
  mergeVersions: typeof versionsActions.mergeVersions,
  publishFeedVersion: typeof versionsActions.publishFeedVersion,
  user: ManagerUserState,
  version: FeedVersion
}

function mergeItemFormatter (
  v: FeedVersionSummary,
  activeVersion: ?FeedVersionSummary
): React$Element<any> {
  let name = v.name
  let disabled = false
  if (v.retrievalMethod === 'SERVICE_PERIOD_MERGE') {
    name = '(Cannot re-merge feed)'
    disabled = true
  }
  if (activeVersion && v.id === activeVersion.id) {
    name = '(Cannot merge with self)'
    disabled = true
  }
  return (
    <MenuItem
      disabled={disabled}
      eventKey={disabled ? null : v.id}
      key={v.id}
    >
      {v.version}. {name}{' '}
      <VersionRetrievalBadge version={v} />
    </MenuItem>
  )
}

// TODO: Refactor with many similar calls
function userCanManageFeed (user: ManagerUserState, version: FeedVersion): boolean {
  return !!user.permissions &&
    user.permissions.hasFeedPermission(
      version.feedSource.organizationId,
      version.feedSource.projectId,
      version.feedSource.id,
      'manage-feed'
    ) !== null
}

/**
  * Check that the validation did not encounter any fatal exception or blocking
  * errors.
  */
function checkBlockingIssue (version: FeedVersion): boolean {
  if (!version.validationResult) return false
  if (version.validationResult.fatalException) return true
  const errorCounts = version.validationResult.error_counts
  return !!errorCounts &&
    !!(errorCounts.find(ec => BLOCKING_ERROR_TYPES.indexOf(ec.type) !== -1))
}

class FeedVersionActionsMTC extends Component<Props> {
  _handleMergeVersion: ((versionId: string) => void) = (versionId: string) => {
    // Note: service period feed merge has only been extensively tested with
    // MTC-specific logic.
    this.props.mergeVersions(this.props.version.id, versionId, 'SERVICE_PERIOD')
  }

  _onClickPublish: (() => any) = () => this.props.publishFeedVersion(this.props.version)

  render (): React$Element<"div"> {
    const {
      feedSource,
      gtfsPlusValidation,
      jobs,
      user,
      version
    } = this.props
    const {validationSummary: summary} = version
    // We must check the version ID against the feed source in props (not the
    // feed source nested underneath version) because this is the only place the
    // published version is updated.
    const isPublished = version.namespace === feedSource.publishedVersionId
    // Version is in the "processing" state if it has been sent to external
    // source, but has not been processed yet.
    const processing = version.sentToExternalPublisher &&
      !version.processedByExternalPublisher
    const hasBlockingIssue = checkBlockingIssue(version)
    const hasGtfsPlusBlockingIssue = gtfsPlusValidation && gtfsPlusValidation.issues.length > 0
    const isMergedServicePeriods = version.retrievalMethod === 'SERVICE_PERIOD_MERGE'

    // Expiry is computed same as with VersionDateLabel (TODO: refactor and reconcile with versionHasExpired).
    const now = +moment().startOf('day')
    const end = +moment(summary.endDate)
    const expired = end < now

    const jobsProcessingThisVersion = jobs && jobs.some(job => job.feedVersionId === version.id)

    const publishButtonDisabled = !gtfsPlusValidation ||
      hasGtfsPlusBlockingIssue ||
      !gtfsPlusValidation.published ||
      expired ||
      !version.validationResult ||
      !version.validationResult.error_counts ||
      hasBlockingIssue ||
      isPublished ||
      processing ||
      !userCanManageFeed(user, version) ||
      jobsProcessingThisVersion

    let publishWarningMessage
    if (hasBlockingIssue || hasGtfsPlusBlockingIssue) {
      publishWarningMessage = (
        <span>
          Cannot publish version because it has a{' '}
          {hasGtfsPlusBlockingIssue ? 'GTFS+ ' : ''}
          blocking issue.
          (See{' '}
          <Link
            to={`/feed/${feedSource.id}/version/${version.version}/${hasGtfsPlusBlockingIssue ? 'gtfsplus' : 'issues'}`}
          >
            {hasGtfsPlusBlockingIssue ? 'GTFS+' : 'validation'} issues
          </Link>.)
        </span>
      )
    } else if (expired) {
      publishWarningMessage = 'Cannot publish version because it has expired.'
    } else if (feedSource.autoPublish) {
      publishWarningMessage = 'Reminder: this feed is already set to be auto-published after auto-fetch!'
    }

    return (
      <div>
        <ButtonToolbar className='pull-right' style={{ marginTop: '2px' }}>
          <VersionSelectorDropdown
            dropdownProps={{
              disabled: isMergedServicePeriods,
              id: 'merge-versions-dropdown',
              onSelect: this._handleMergeVersion
            }}
            itemFormatter={mergeItemFormatter}
            title={<span><Icon type='code-fork' />{' '}
              {isMergedServicePeriods
                ? 'Cannot re-merge feed'
                : 'Merge with version'
              }</span>}
            version={version}
            versions={feedSource.feedVersionSummaries}
          />
          <Button
            bsStyle={isPublished ? 'success' : 'warning'}
            disabled={publishButtonDisabled}
            onClick={this._onClickPublish}
          >
            {isPublished
              ? <span><Icon type='check-circle' /> Published</span>
              : processing
                ? <span>Processing...</span>
                : <span>Publish to MTC</span>
            }
          </Button>
        </ButtonToolbar>
        <div
          className='pull-right text-danger'
          style={{
            clear: 'right',
            fontSize: 'x-small',
            marginLeft: '5px',
            textAlign: 'right',
            width: '180px'
          }}
        >
          {publishWarningMessage}
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  jobs: state.status.jobMonitor.jobs
})

export default connect(mapStateToProps)(FeedVersionActionsMTC)
