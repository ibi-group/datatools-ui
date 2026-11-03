// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, { Component } from 'react'
import { Button, ButtonToolbar, MenuItem } from 'react-bootstrap'
import { Link } from 'react-router'
import { connect } from 'react-redux'

import * as versionsActions from '../../actions/versions'
import ConfirmModal from '../../../common/components/ConfirmModal'
import type {
  Feed,
  FeedVersion,
  FeedVersionSummary,
  GtfsPlusValidation,
  ServerJob,
  ValidationSummary
} from '../../../types'
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

function getLifecycle (validationSummary: ValidationSummary) {
  const now = +moment().startOf('day')
  const end = +moment(validationSummary.endDate)
  const start = +moment(validationSummary.startDate)
  const isExpired = end < now
  const isFuture = start > now
  return {
    isExpired,
    isFuture
  }
}

class FeedVersionActionsMTC extends Component<Props> {
  _handleMergeVersion: ((versionId: string) => void) = (versionId: string) => {
    // Note: service period feed merge has only been extensively tested with
    // MTC-specific logic.
    this.props.mergeVersions(this.props.version.id, versionId, 'SERVICE_PERIOD')
  }

  _onClickPublish = () => {
    const {
      feedSource,
      publishFeedVersion,
      version
    } = this.props
    const { feedVersionSummaries: summaries } = feedSource

    // Use version summaries from FeedSource to get the publish status returned by backend.
    const versionSummary = summaries && summaries.find(v => v.id === version.id)

    if (versionSummary) {
      // Find out if:
      // - a newer, active version (not expired, not in the future) has been published
      // - publishing is in progress for another active version (newer or older, including stale publishing states)
      // Alert if that's the case, and mention the newest version found.
      // 'newer' means with a higher version number (uploaded/fetched later),
      // even if the start date is before one of the previous versions.
      const activeVersionSummariesNewestFirst = (summaries || [])
        .filter(
          s => {
            const { isExpired, isFuture } = getLifecycle(s.validationSummary)
            return !isExpired && !isFuture
          }
        )
        .sort((v1, v2) => v1.version - v2.version)

      const newerVersionPublished = activeVersionSummariesNewestFirst.find(
        s => s.publishState === 'PUBLISHED' && s.version > versionSummary.version
      )

      const otherVersionPublishing = activeVersionSummariesNewestFirst.find(
        s => s.publishState === 'PUBLISHING'
      )

      let prompt
      if (newerVersionPublished) {
        prompt = `A newer feed version (Version ${newerVersionPublished.version}) has already been published.`
      } else if (otherVersionPublishing) {
        const isNewer = otherVersionPublishing.version > versionSummary.version
        prompt = `${isNewer ? 'A newer' : 'Another'} feed version (Version ${otherVersionPublishing.version}) is already being published.`
      }

      if (prompt) {
        const prompt2 = `Would you like to publish Version ${versionSummary.version} anyway?`
        this.refs.confirmModal.open({
          body: <>{prompt}<br />{prompt2}</>,
          confirmButtonText: 'Publish',
          onConfirm: () => publishFeedVersion(version),
          title: 'Publish Feed Version?'
        })
      }
    }
  }

  _getWarning = () => {
    const {
      feedSource,
      gtfsPlusValidation,
      version
    } = this.props
    const { autoPublish, feedVersionSummaries: summaries, id } = feedSource

    // Use version summaries from FeedSource to get the publish status returned by backend.
    if (!summaries) return ''
    const versionSummary = summaries.find(v => v.id === version.id)

    const { publishState = '', validationSummary: summary } = versionSummary || {}

    const hasGtfsPlusBlockingIssue = gtfsPlusValidation && gtfsPlusValidation.issues.length > 0

    if (publishState === 'PUBLISH_BLOCKED') {
      // Expiry is computed same as in backend using FeedValidationSummary.startDate/endDate.
      const { isExpired, isFuture } = getLifecycle(summary)
      if (isExpired) {
        return 'Cannot publish version because it has expired.'
      } else if (isFuture) {
        return 'Cannot publish version because it is in the future.'
      }

      return (
        <span>
          Cannot publish version because it has a{' '}
          {hasGtfsPlusBlockingIssue ? 'GTFS+ ' : ''}
          blocking issue.
          (See{' '}
          <Link
            to={`/feed/${id}/version/${version.version}/${hasGtfsPlusBlockingIssue ? 'gtfsplus' : 'issues'}`}
          >
            {hasGtfsPlusBlockingIssue ? 'GTFS+' : 'validation'} issues
          </Link>.)
        </span>
      )
    } else if (autoPublish) {
      return 'Reminder: this feed is already set to be auto-published after auto-fetch!'
    }
  }

  render (): React$Element<"div"> {
    const {
      feedSource,
      jobs,
      user,
      version
    } = this.props
    const { feedVersionSummaries: summaries } = feedSource

    // Use version summaries from FeedSource to get the publish status returned by backend.
    const versionSummary = summaries && summaries.find(v => v.id === version.id)

    const { publishState = '' } = versionSummary || {}
    const isPublished = publishState === 'PUBLISHED'
    const processing = publishState === 'PUBLISHING'
    const isMergedServicePeriods = version.retrievalMethod === 'SERVICE_PERIOD_MERGE'

    const jobsProcessingThisVersion = jobs && jobs.some(job => job.feedVersionId === version.id)

    const publishButtonDisabled = publishState !== 'READY_TO_PUBLISH' ||
      !userCanManageFeed(user, version) ||
      jobsProcessingThisVersion

    return (
      <div>
        <ConfirmModal ref='confirmModal' />
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
            versions={summaries}
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
          {this._getWarning()}
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  jobs: state.status.jobMonitor.jobs
})

export default connect(mapStateToProps)(FeedVersionActionsMTC)
