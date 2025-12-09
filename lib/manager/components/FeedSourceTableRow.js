// @flow

import Icon from '@conveyal/woonerf/components/icon'
import humanizeDuration from 'humanize-duration'
import moment from 'moment'
import React, { PureComponent } from 'react'
import { Col, DropdownButton, Glyphicon, MenuItem, Row } from 'react-bootstrap'
import { browserHistory, Link } from 'react-router'

import * as deploymentActions from '../actions/deployments'
import * as feedsActions from '../actions/feeds'
import * as versionsActions from '../actions/versions'
import { deStringifyLabels } from '../util'
import {
  getComponentMessages,
  isExtensionEnabled,
  isModuleEnabled,
  getConfigProperty
} from '../../common/util/config'
import { abbreviate, isValidZipFile } from '../../common/util/util'
import ConfirmModal from '../../common/components/ConfirmModal'
import SelectFileModal from '../../common/components/SelectFileModal'
import WatchButton from '../../common/containers/WatchButton'
import FeedLabel from '../../common/components/FeedLabel'
import LabelAssignerModal from '../components/LabelAssignerModal'
import type { Props as ContainerProps } from '../containers/FeedSourceTableRow'
import type { Feed, ServerJob, ValidationSummary, Project } from '../../types'
import type {
  FeedSourceTableComparisonColumns,
  ManagerUserState
} from '../../types/reducers'
import { BLOCKING_ERROR_TYPES } from '../util/version'

type Props = ContainerProps & {
  comparisonColumn: FeedSourceTableComparisonColumns,
  comparisonValidationSummary: ?ValidationSummary,
  createDeploymentFromFeedSource: typeof deploymentActions.createDeploymentFromFeedSource,
  createFeedSource: typeof feedsActions.createFeedSource,
  deleteFeedSource: typeof feedsActions.deleteFeedSource,
  feedSource: Feed,
  jobs: Array<ServerJob>,
  runFetchFeed: typeof feedsActions.runFetchFeed,
  updateFeedSource: typeof feedsActions.updateFeedSource,
  uploadFeed: typeof versionsActions.uploadFeed,
  user: ManagerUserState
}

const statusAttributeLookup = {
  'active': {
    className: 'status-active',
    icon: 'check-circle'
  },
  'expiring-within-20-days': {
    className: 'status-expiring-20',
    icon: 'exclamation-triangle'
  },
  'expiring-within-5-days': {
    className: 'status-expiring-5',
    icon: 'exclamation-triangle'
  },
  'expired': {
    className: 'status-expired',
    icon: 'times-circle'
  },
  'future': {
    className: 'status-future',
    icon: 'clock-o'
  },
  'no-version': {
    className: 'status-no-version',
    icon: 'minus-circle'
  }
}

/**
 * Helper to lookup status data and return inline in new object
 */
function wrapLookupStatus (status, data = {}) {
  return {
    ...statusAttributeLookup[status],
    ...data,
    status
  }
}

function relativeDuration (time: any) {
  return humanizeDuration(
    (moment().unix() - moment(time).unix()) * 1000,
    { largest: 1 }
  )
}

export default class FeedSourceTableRow extends PureComponent<Props> {
  messages = getComponentMessages('FeedSourceTableRow')
  dateFormat = this.messages('dateFormat')

  /**
   * Get some UI data from a ValidationSummary
   */
  getVersionDisplayData (
    validationSummary: ?ValidationSummary
  ) {
    if (validationSummary) {
      const errorCount = validationSummary.errorCount || this.messages('none')
      const endMoment = moment(validationSummary.endDate)
      const startMoment = moment(validationSummary.startDate)
      return wrapLookupStatus(
        endMoment.isBefore(moment())
          ? 'expired'
          : endMoment.isBefore(moment().add(5, 'days'))
            ? 'expiring-within-5-days'
            : endMoment.isBefore(moment().add(20, 'days'))
              ? 'expiring-within-20-days'
              : startMoment.isBefore(moment())
                ? 'active'
                : 'future',
        {
          endDate: endMoment.format(this.dateFormat),
          errorCount,
          startDate: startMoment.format(this.dateFormat)
        }
      )
    } else {
      return wrapLookupStatus('no-version')
    }
  }

  /**
   * This method generates the variables and used to live in the render method,
   * but was extracted to appease the eslint complexity rule
   */
  generateFeedSourceLabelRenderVars (feedSource: Feed, comparisonValidationSummary: ?ValidationSummary) {
    // data for feed source info column
    let lastVersionUpdate = !!feedSource.lastUpdated &&
        relativeDuration(feedSource.lastUpdated)
    lastVersionUpdate = lastVersionUpdate
      ? this.messages('lastUpdated').replace('%lastVersionUpdate%', lastVersionUpdate)
      : ''

    // data for comparison column
    const comparisonData = comparisonValidationSummary &&
        this.getVersionDisplayData(comparisonValidationSummary)

    let comparisonSubtext, comparisonSubtextDate
    if (comparisonData && comparisonValidationSummary) {
      if (comparisonData.status === 'future') {
        comparisonSubtext = this.messages('startingIn').replace('%duration%',
          relativeDuration(comparisonValidationSummary.startDate))
        comparisonSubtextDate = comparisonValidationSummary.startDate
      } else if (comparisonData.status === 'expired') {
        comparisonSubtext = this.messages('expired').replace('%duration%',
          relativeDuration(comparisonValidationSummary.endDate))
        comparisonSubtextDate = comparisonValidationSummary.endDate
      } else {
        comparisonSubtext = this.messages('validFor').replace('%duration%',
          relativeDuration(comparisonValidationSummary.endDate))
        comparisonSubtextDate = comparisonValidationSummary.endDate
      }
    }

    return {
      lastVersionUpdate,
      comparisonSubtext,
      comparisonSubtextDate,
      comparisonData
    }
  }

  // eslint-disable-next-line complexity
  render () {
    const {
      comparisonColumn,
      comparisonValidationSummary,
      feedSource,
      jobs,
      project,
      user
    } = this.props

    const {
      lastVersionUpdate,
      comparisonSubtext,
      comparisonData,
      comparisonSubtextDate
    } = this.generateFeedSourceLabelRenderVars(
      feedSource,
      comparisonValidationSummary
    )

    // data for latest validation columns
    const currentVersionData = this.getVersionDisplayData(feedSource.latestValidation)
    const latestVersionId = feedSource.latestValidation && feedSource.latestValidation.feedVersionId
    const comparisonVersionId = comparisonValidationSummary && comparisonValidationSummary.feedVersionId

    if (latestVersionId && latestVersionId === comparisonVersionId) {
      currentVersionData.status = comparisonColumn === 'DEPLOYED'
        ? 'same-as-deployed'
        : 'same-as-published'
    }

    return (
      <tr key={feedSource.id} className='feed-source-table-row'>
        <td className='feed-source-info'>
          <FeedInfo feedSource={feedSource} project={project} user={user} />
        </td>
        {comparisonColumn &&
          <td className='comparison-column'>
            {comparisonData
              ? (
                <Status
                  icon={comparisonData.icon}
                  dateFormat={this.dateFormat}
                  statusSpanClass={comparisonData.className}
                  statusText={this.messages(`status.${comparisonData.status}`)}
                  subtext={comparisonSubtext}
                  subtextDate={comparisonSubtextDate}
                />
              )
              : <span className='feed-status-subtext'>
                {comparisonColumn === 'PUBLISHED'
                  ? this.messages('status.feedNotPublished')
                  : this.messages('status.feedNotInDeployment')}
              </span>
            }
          </td>
        }
        <td className='feed-version-column'>
          <Status
            icon={currentVersionData.icon}
            dateFormat={this.dateFormat}
            statusSpanClass={currentVersionData.className}
            statusText={this.messages(`status.${currentVersionData.status}`)}
            subtext={lastVersionUpdate}
          />
        </td>
        <td className='feed-version-column'>
          {currentVersionData.startDate}
          {currentVersionData.startDate && ' -'}
          {currentVersionData.endDate && <br />}
          {currentVersionData.endDate}
        </td>
        <td className='feed-version-column'>{currentVersionData.errorCount}</td>
        {isExtensionEnabled('mtc') &&
          <td className='feed-version-column'>
            <PublishStatus feedSource={feedSource} jobs={jobs} />
          </td>
        }
        <td>
          <FeedActionsDropdown {...this.props} />
        </td>
      </tr>
    )
  }
}

class FeedInfo extends PureComponent<{ feedSource: Feed, project: Project, user: ManagerUserState }> {
  messages = getComponentMessages('FeedInfo')

  /* eslint-disable complexity */
  render () {
    const { feedSource, project, user } = this.props

    const userCanManageFeed = user && user.permissions && user.permissions.hasFeedPermission(
      project.organizationId,
      project.id,
      feedSource.id,
      'manage-feed'
    )

    const lastUpdateText = feedSource.lastUpdated
      ? this.messages('lastUpdatedDate').replace('%date%', moment(feedSource.lastUpdated).format(this.messages('dateFormat')))
      : this.messages('noUpdates')

    return (
      <div>
        <h4>
          <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link>
        </h4>
        <h5>{lastUpdateText}</h5>
        <Row>
          {feedSource.url && (
            <Col xs={12}>
              <Icon type='link' />
              <a href={feedSource.url} target='_blank'>
                {abbreviate(feedSource.url)}
                <Icon type='external-link' />
              </a>
            </Col>
          )}
          {feedSource.retrievalMethod === 'FETCHED_AUTOMATICALLY' && (
            <Col xs={6}>
              <Icon type='feed' />
              {this.messages('autoFetch')}
            </Col>
          )}
          {isModuleEnabled('deployment') && feedSource.deployable && (
            <Col xs={6}>
              <Icon type='rocket' />
              {this.messages('deployable')}
            </Col>
          )}
          <Col xs={6}>
            <Icon type={feedSource.isPublic ? 'globe' : 'lock'} />
            {this.messages(feedSource.isPublic ? 'public' : 'private')}
          </Col>
          {isExtensionEnabled('mtc') && feedSource.autoPublish && (
            <Col xs={6}>
              <Icon type='cloud-upload' />
              {this.messages('autoPublish')}
            </Col>
          )}
          {feedSource.filename && (
            <Col xs={12}>
              <Row>
                <Col xs={12}>
                  <Icon type='file-text-o' />{this.messages('bundleFilename')}: {feedSource.filename}.zip
                </Col>
              </Row>
            </Col>
          )}
          <Col xs={12}>
            <div className='feedSourceLabelRow'>
              {project.labels.length > 0 && (
                <Icon type={'tag'} />
              )}
              <LabelAssignerModal
                ref='labelAssignerModal'
                feedSource={feedSource}
                project={project}
              />
              {userCanManageFeed && project.labels.length > 0 && (
                <button
                  className='labelActionButton small'
                  style={{ marginRight: '5px' }}
                  onClick={() => this.refs.labelAssignerModal.open()}
                >
                  {this.messages('edit')}
                </button>)}
              <div className='feedLabelContainer'>
                {deStringifyLabels(feedSource.labelIds, project).map((label) => (
                  <FeedLabel small key={label.id} label={label} />
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </div>
    )
  }
}

class Status extends PureComponent<{
  dateFormat: string,
  icon: string,
  statusSpanClass: string,
  statusText: string,
  subtext: ?string,
  subtextDate?: string
}> {
  render () {
    const {icon, dateFormat, subtext, statusSpanClass, statusText, subtextDate} = this.props
    return (
      <div>
        <span className={`feed-status ${statusSpanClass}`}>
          <Icon type={icon} />
          {statusText}
        </span>
        <div className='feed-status-subtext'>
          {subtext}
          {subtextDate && <br />}
          {subtextDate && `(${moment(subtextDate).format(dateFormat)})`}
        </div>
      </div>
    )
  }
}

// TODO: a lot of duplication with FeedVersionActionsMTC.js

// duplicated function from FeedVersionActionsMTC.js with a different type
function checkBlockingIssues (feedSource: Feed): boolean {
  if (!feedSource.latestValidation) return false
  const errorCounts = feedSource.latestErrorCounts
  return !!errorCounts &&
    !!(errorCounts.find(ec => BLOCKING_ERROR_TYPES.indexOf(ec.type) !== -1))
}

type PublishStatusState = {
  elapsed: string
}

class PublishStatus extends PureComponent<{
  feedSource: Feed,
  jobs: Array<ServerJob>
}, PublishStatusState> {
  messages = getComponentMessages('FeedSourceTableRow')
  _interval: ?IntervalID

  constructor (props) {
    super(props)
    this.state = { elapsed: '' }
    this._interval = null
  }

  componentDidMount () {
    if (this.isProcessing()) {
      this.updateElapsed()
      this._interval = setInterval(this.updateElapsed, 10000)
    }
  }

  componentDidUpdate (prevProps) {
    const wasProcessing = prevProps.feedSource &&
      prevProps.feedSource.latestSentToExternalPublisher &&
      !prevProps.feedSource.latestProcessedByExternalPublisher
    const isProcessingNow = this.isProcessing()
    if (!wasProcessing && isProcessingNow) {
      this.updateElapsed()
      this._interval = setInterval(this.updateElapsed, 10000)
    } else if (wasProcessing && !isProcessingNow && this._interval) {
      clearInterval(this._interval)
      this._interval = null
      this.setState({ elapsed: '' })
    }
  }

  componentWillUnmount () {
    if (this._interval) clearInterval(this._interval)
  }

  isProcessing = () => {
    const { feedSource } = this.props
    return feedSource && feedSource.latestSentToExternalPublisher && !feedSource.latestProcessedByExternalPublisher
  }

  updateElapsed = () => {
    const { feedSource } = this.props
    const ts = feedSource.latestSentToExternalPublisher
    if (!ts) {
      this.setState({ elapsed: '' })
      return
    }
    // Normalize to milliseconds
    let ms = Number(ts)
    if (isNaN(ms)) {
      ms = +moment(ts)
    }
    if (!ms || isNaN(ms)) {
      this.setState({ elapsed: '' })
      return
    }
    const human = humanizeDuration(Date.now() - ms, { largest: 2 })
    this.setState({ elapsed: human })
  }

  render () {
    const {feedSource, jobs} = this.props
    const { elapsed } = this.state

    const isPublished = feedSource.latestPublishedVersionId != null &&
      feedSource.latestNamespace != null &&
      feedSource.latestPublishedVersionId === feedSource.latestNamespace
    const hasGtfsPlusBlockingIssue = feedSource.latestGtfsPlusValidation &&
      feedSource.latestGtfsPlusValidation.issues &&
      feedSource.latestGtfsPlusValidation.issues.length > 0
    const now = +moment().startOf('day')
    const end = feedSource.latestValidation && feedSource.latestValidation.endDate
      ? +moment(feedSource.latestValidation.endDate)
      : null
    const expired = end != null ? end < now : false
    const jobsProcessingThisVersion = jobs && jobs.some(job => job.feedVersionId != null && job.feedVersionId === feedSource.id)

    const publishingDisabled = !feedSource.latestGtfsPlusValidation ||
      hasGtfsPlusBlockingIssue ||
      !feedSource.latestGtfsPlusValidation.published ||
      expired ||
      !feedSource.latestValidation ||
      checkBlockingIssues(feedSource) ||
      hasGtfsPlusBlockingIssue ||
      isPublished ||
      this.isProcessing() ||
      jobsProcessingThisVersion

    if (isPublished) {
      return (
        <span className='feed-status status-active'>
          <Icon type='check-circle' />
          {this.messages('status.published')}
        </span>
      )
    } else if (this.isProcessing()) {
      return (
        <>
          <span className='feed-status status-publishing'>
            <Icon type='spinner' spin />
            {this.messages('status.publishingInProgress')}
          </span>
          <p>
            {elapsed ? `processing for ${elapsed}` : null}
          </p>
        </>
      )
    } else if (!feedSource.latestValidation) {
      return (
        <span className='feed-status status-no-version'>
          <Icon type='minus-circle' />
          {this.messages('status.no-version')}
        </span>
      )
    } else if (publishingDisabled) {
      return (
        <span className='feed-status status-publish-disabled'>
          <Icon type='ban' />
          {this.messages('status.publishDisabled')}
        </span>
      )
    } else {
      return (
        <span className='feed-status status-unpublished'>
          <Icon type='circle' />
          {this.messages('status.canPublish')}
        </span>
      )
    }
  }
}

class FeedActionsDropdown extends PureComponent<Props> {
  messages = getComponentMessages('FeedActionsDropdown')

  _onClickDelete = () => {
    // Delete immediately if feed source is being created.
    if (this.props.feedSource.isCreating) return this._onConfirmDelete()
    // Otherwise, show delete modal.
    this.refs.deleteModal.open()
  }

  _onClickDeploy = () => {
    const {createDeploymentFromFeedSource, feedSource} = this.props
    createDeploymentFromFeedSource(feedSource)
  }

  _onClickEdit = () => browserHistory.push(`/feed/${this.props.feedSource.id}/edit/`)

  _onClickFetch = () => {
    const {feedSource, runFetchFeed} = this.props
    runFetchFeed(feedSource)
  }

  _onClickPublic = () => {
    browserHistory.push(`/public/feed/${this.props.feedSource.id}`)
  }

  _onClickUpload = () => { this.refs.uploadModal.open() }

  _onConfirmDelete = () => {
    this.props.deleteFeedSource(this.props.feedSource)
  }

  _onConfirmUpload = (files: Array<File>) => {
    const {feedSource, uploadFeed} = this.props
    const file = files[0]
    if (isValidZipFile(file)) {
      uploadFeed(feedSource, file)
      return true
    } else {
      return false
    }
  }

  /**
   * This method generates variables and used to live in the render method,
   * but was extracted to appease the eslint complexity rule
   * @param {*} user        User used in child components
   * @param {*} project     Project object used in child components
   * @param {*} feedSource  FeedSource object used in child components
   * @returns               React which makes up dropdowns
   */
  generateFeedActionDropdownRenderVars = function (user, project, feedSource) {
    const {permissions, subscriptions} = user
    const disabled = !permissions ||
      !permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'manage-feed')
    const isWatchingFeed = subscriptions &&
      subscriptions.hasFeedSubscription(project.id, feedSource.id, 'feed-updated')
    const editGtfsDisabled = !permissions ||
      !permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'edit-gtfs')

    return {disabled, isWatchingFeed, editGtfsDisabled}
  }

  render () {
    const {
      feedSource,
      project,
      user
    } = this.props

    const {
      disabled,
      isWatchingFeed,
      editGtfsDisabled
    } = this.generateFeedActionDropdownRenderVars(user, project, feedSource)

    return (
      <DropdownButton
        id={`feed-source-action-button-${feedSource.id}`}
        title={this.messages('menu')}
      >
        <ConfirmModal
          ref='deleteModal'
          title={this.messages('deleteFeedSource')}
          body={`Are you sure you want to delete the feed source ${feedSource.name}?`}
          onConfirm={this._onConfirmDelete}
        />
        <SelectFileModal
          ref='uploadModal'
          title={this.messages('uploadFeed')}
          body='Select a GTFS feed to upload:'
          onConfirm={this._onConfirmUpload}
          errorMessage='Uploaded file must be a valid zip file (.zip).'
        />
        <MenuItem
          disabled={editGtfsDisabled}
          onClick={this._onClickEdit}
        >
          <Glyphicon glyph='pencil' /> {this.messages('openInEditor')}
        </MenuItem>
        <MenuItem
          disabled={disabled || !feedSource.url}
          onClick={this._onClickFetch}
        >
          <Glyphicon glyph='refresh' /> {this.messages('fetch')}
        </MenuItem>
        <MenuItem
          disabled={disabled}
          onClick={this._onClickUpload}
        >
          <Glyphicon glyph='upload' /> {this.messages('upload')}
        </MenuItem>
        {/* show divider only if deployments and notifications are enabled (otherwise, we don't need it) */}
        {isModuleEnabled('deployment') || getConfigProperty('application.notifications_enabled')
          ? <MenuItem divider />
          : null
        }
        {isModuleEnabled('deployment')
          ? <MenuItem
            disabled={disabled || !feedSource.deployable || !feedSource.latestValidation}
            title={disabled
              ? this.messages('deployNoPermission')
              : !feedSource.deployable
                ? this.messages('notDeployable')
                : !feedSource.latestValidation
                  ? this.messages('noVersions')
                  : this.messages('deployFeed')
            }
            onClick={this._onClickDeploy}
          >
            <Glyphicon glyph='globe' /> {this.messages('deploy')}
          </MenuItem>
          : null
        }
        {getConfigProperty('application.notifications_enabled')
          ? <WatchButton
            isWatching={isWatchingFeed}
            user={user}
            target={feedSource.id}
            subscriptionType='feed-updated'
            componentClass='menuItem' />
          : null
        }
        <MenuItem
          disabled={!feedSource.isPublic}
          onClick={this._onClickPublic}
        >
          <Glyphicon glyph='link' /> {this.messages('view')}
        </MenuItem>
        <MenuItem divider />
        <MenuItem
          data-test-id='feed-source-dropdown-delete-feed-source-button'
          disabled={disabled}
          onClick={this._onClickDelete}
        >
          <Icon type='trash' /> {this.messages('delete')}
        </MenuItem>
      </DropdownButton>
    )
  }
}
