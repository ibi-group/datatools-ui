// @flow
import humanizeDuration from 'humanize-duration'
import moment from 'moment'
import React, { PureComponent } from 'react'

import { getComponentMessages } from '../../common/util/config'
import type { FeedVersionSummary } from '../../types'

import TimedStatus from './TimedStatus'

type Props = {
  version?: FeedVersionSummary
};

type PublishStatusState = {
  elapsed: string
}

export class PublishStatus extends PureComponent<Props, PublishStatusState> {
  messages = getComponentMessages('PublishStatus');
  _interval: ?IntervalID;

  constructor (props: Props) {
    super(props)
    this.state = { elapsed: '' }
    this._interval = null
  }

  componentDidMount () {
    const { publishState } = this.props.version || {}
    if (publishState === 'PUBLISHING') {
      this.updateElapsed()
      this._interval = setInterval(this.updateElapsed, 10000)
    }
  }

  componentDidUpdate (prevProps: Props) {
    const wasProcessing = (prevProps.version || {}).publishState === 'PUBLISHING'
    const isProcessingNow = (this.props.version || {}).publishState === 'PUBLISHING'
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

  updateElapsed = () => {
    const { sentToExternalPublisher: ts } = this.props.version || {}
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
    const human = humanizeDuration(Date.now() - ms, { largest: 2, round: true })
    this.setState({ elapsed: human })
  };

  render () {
    const { publishState = '' } = this.props.version || {}
    const { elapsed } = this.state

    if (publishState === 'PUBLISHED') {
      return (
        <TimedStatus
          icon='check-circle'
          statusSpanClass='status-active'
          statusText={this.messages('published')}
        />
      )
    } else if (publishState === 'PUBLISHING') {
      return (
        <TimedStatus
          icon='spinner'
          statusSpanClass='status-publishing'
          statusText={this.messages('publishingInProgress')}
          subtext={elapsed ? `Processing for ${elapsed}` : undefined}
        />
      )
    } else if (publishState === 'PUBLISH_BLOCKED') {
      return (
        <TimedStatus
          icon='ban'
          statusSpanClass='status-publish-disabled'
          statusText={this.messages('publishDisabled')}
        />
      )
    } else if (publishState === 'READY_TO_PUBLISH') {
      return (
        <TimedStatus
          icon='circle'
          statusSpanClass='status-unpublished'
          statusText={this.messages('canPublish')}
        />
      )
    }
    return null
  }
}
