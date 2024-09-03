// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Button,
  ButtonToolbar,
  ListGroupItem,
  MenuItem
} from 'react-bootstrap'
import {Link} from 'react-router'
import area from 'turf-area'
import bboxPoly from 'turf-bbox-polygon'

import * as versionsActions from '../../actions/versions'
import {getConfigProperty, isExtensionEnabled} from '../../../common/util/config'
import {BLOCKING_ERROR_TYPES} from '../../util/version'
import type {FeedVersion, FeedVersionSummary, GtfsPlusValidation, Bounds, Feed} from '../../../types'
import type {ManagerUserState} from '../../../types/reducers'

import FeedVersionSpanChart from './FeedVersionSpanChart'
import VersionRetrievalBadge from './VersionRetrievalBadge'
import VersionSelectorDropdown from './VersionSelectorDropdown'

type Props = {
  comparedVersion: ?FeedVersion,
  feedSource: Feed,
  gtfsPlusValidation: GtfsPlusValidation,
  mergeVersions: typeof versionsActions.mergeVersions,
  publishFeedVersion: typeof versionsActions.publishFeedVersion,
  user: ManagerUserState,
  version: FeedVersion
}

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
    if (!version.validationResult) return false
    if (version.validationResult.fatalException) return true
    const errorCounts = version.validationResult.error_counts
    return errorCounts &&
      !!(errorCounts.find(ec => BLOCKING_ERROR_TYPES.indexOf(ec.type) !== -1))
  }

  _mergeItemFormatter = (v: FeedVersionSummary, activeVersion: ?FeedVersionSummary) => {
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
        key={v.id}
        disabled={disabled}
        eventKey={disabled ? null : v.id}
      >
        {v.version}. {name}{' '}
        <VersionRetrievalBadge version={v} />
      </MenuItem>
    )
  }

  _handleMergeVersion = (versionId: string) => {
    // Note: service period feed merge has only been extensively tested with
    // MTC-specific logic.
    this.props.mergeVersions(this.props.version.id, versionId, 'SERVICE_PERIOD')
  }

  _onClickPublish = () => this.props.publishFeedVersion(this.props.version)

  render () {
    const {
      comparedVersion,
      feedSource,
      gtfsPlusValidation,
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
    const userCanManageFeed = user.permissions &&
      user.permissions.hasFeedPermission(
        version.feedSource.organizationId,
        version.feedSource.projectId,
        version.feedSource.id,
        'manage-feed'
      )
    const hasBlockingIssue = this._checkBlockingIssue(version)
    const hasGtfsPlusBlockingIssue = gtfsPlusValidation && gtfsPlusValidation.issues.length > 0
    const isMergedServicePeriods = version.retrievalMethod === 'SERVICE_PERIOD_MERGE'
    const mergeButtonLabel = isMergedServicePeriods
      ? 'Cannot re-merge feed'
      : 'Merge with version'

    const hasMtcExtension = isExtensionEnabled('mtc')
    let publishWarningMessage
    if (hasMtcExtension) {
      if (hasBlockingIssue || hasGtfsPlusBlockingIssue) {
        publishWarningMessage = (
          <span>
            Cannot publish version because it has a{' '}
            {hasGtfsPlusBlockingIssue ? 'GTFS+ ' : ''}
            blocking issue.
            (See{' '}
            <Link
              to={`/feed/${feedSource.id}/version/${version.version}/${hasGtfsPlusBlockingIssue ? 'gtfsplus' : 'issues'}`}>
              {hasGtfsPlusBlockingIssue ? 'GTFS+' : 'validation'} erreurs
            </Link>.)
          </span>
        )
      } else if (feedSource.autoPublish) {
        publishWarningMessage = 'Rappel: ce flux est déjà paramétré pour l’auto-publication après auto-récupération des données!'
      }
    }

    return (
      <ListGroupItem>
        <h4 className='pull-left' style={{ marginBottom: '2px' }}>
          <span data-test-id='feed-version-validity'>
            <Icon type='calendar' />{' '}
            Dates de validité du flux
          </span>
        </h4>
        {hasMtcExtension &&
          <ButtonToolbar className='pull-right' style={{ marginTop: '2px' }}>
            <VersionSelectorDropdown
              dropdownProps={{
                id: 'merge-versions-dropdown',
                disabled: isMergedServicePeriods,
                onSelect: this._handleMergeVersion
              }}
              title={<span><Icon type='code-fork' /> {mergeButtonLabel}</span>}
              itemFormatter={this._mergeItemFormatter}
              version={version}
              versions={feedSource.feedVersionSummaries}
            />
            <Button
              disabled={
                !gtfsPlusValidation ||
                hasGtfsPlusBlockingIssue ||
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
                ? <span><Icon type='check-circle' /> Publié</span>
                : processing
                  ? <span>Traitement...</span>
                  : <span>Publier sur MTC</span>
              }
            </Button>
          </ButtonToolbar>
        }
        {hasMtcExtension && (
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
        )}

        <FeedVersionSpanChart
          activeVersion={version}
          comparedVersion={comparedVersion}
          style={{float: 'left', clear: 'left'}}
        />

        <p style={{clear: 'both'}}>
          {summary && summary.avgDailyRevenueTime
            ? <span>
              <Icon type='clock-o' />
              {' '}
              {Math.floor(summary.avgDailyRevenueTime / 60 / 60 * 100) / 100}{' '}
              heures de service quotidiennes 
            </span>
            : null
          }
          {summary && summary.bounds && getConfigProperty('application.dev')
            ? <span>
              <Icon type='globe' />
              {' '}
              {this.getBoundsArea(summary.bounds)} mètres carré
            </span>
            : null
          }
        </p>
      </ListGroupItem>
    )
  }
}
