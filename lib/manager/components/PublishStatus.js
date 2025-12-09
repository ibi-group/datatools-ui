// @flow
import Icon from '@conveyal/woonerf/components/icon'
import humanizeDuration from 'humanize-duration'
import moment from 'moment'
import React, { PureComponent } from 'react'

import { getComponentMessages } from '../../common/util/config'
import type { Feed, ServerJob } from '../../types'
import { BLOCKING_ERROR_TYPES } from '../util/version'

type Props = {
  feedSource: Feed;
  jobs: Array<ServerJob>;
};

type PublishStatusState = {
  elapsed: string
}

// duplicated function from FeedVersionActionsMTC.js with a different type
function checkBlockingIssues (feedSource: Feed): boolean {
  if (!feedSource.latestValidation) return false
  const errorCounts = feedSource.latestErrorCounts
  return !!errorCounts &&
    !!(errorCounts.find(ec => BLOCKING_ERROR_TYPES.indexOf(ec.type) !== -1))
}

// TODO: a lot of duplication with FeedVersionActionsMTC.js
export class PublishStatus extends PureComponent<Props, PublishStatusState> {
  messages = getComponentMessages('FeedSourceTableRow');
  _interval: ?IntervalID;

  constructor (props: Props) {
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

  componentDidUpdate (prevProps: Props) {
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
  };

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
  };

  // eslint-disable-next-line complexity
  render () {
    const { feedSource, jobs } = this.props
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
