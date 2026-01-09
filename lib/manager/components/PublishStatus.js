// @flow
import Icon from '@conveyal/woonerf/components/icon'
import humanizeDuration from 'humanize-duration'
import moment from 'moment'
import React, { PureComponent } from 'react'

import { getComponentMessages } from '../../common/util/config'

type Props = {
  latestSentToExternalPublisher?: number,
  publishState: string;
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
    if (this.props.publishState === 'PUBLISHING') {
      this.updateElapsed()
      this._interval = setInterval(this.updateElapsed, 10000)
    }
  }

  componentDidUpdate (prevProps: Props) {
    const wasProcessing = prevProps.publishState === 'PUBLISHING'
    const isProcessingNow = this.props.publishState === 'PUBLISHING'
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
    const ts = this.props.latestSentToExternalPublisher
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

  render () {
    const { publishState } = this.props
    const { elapsed } = this.state

    if (publishState === 'PUBLISHED') {
      return (
        <span className='feed-status status-active'>
          <Icon type='check-circle' />
          {this.messages('published')}
        </span>
      )
    } else if (publishState === 'PUBLISHING') {
      return (
        <>
          <span className='feed-status status-publishing'>
            <Icon type='spinner' />
            {this.messages('publishingInProgress')}
          </span>
          <p>
            {elapsed ? `Processing for ${elapsed}` : null}
          </p>
        </>
      )
    } else if (!publishState) {
      return (
        <span className='feed-status status-no-version'>
          <Icon type='minus-circle' />
          {this.messages('no-version')}
        </span>
      )
    } else if (publishState === 'PUBLISH_BLOCKED') {
      return (
        <span className='feed-status status-publish-disabled'>
          <Icon type='ban' />
          {this.messages('publishDisabled')}
        </span>
      )
    } else if (publishState === 'READY_TO_PUBLISH') {
      return (
        <span className='feed-status status-unpublished'>
          <Icon type='circle' />
          {this.messages('canPublish')}
        </span>
      )
    }
    return null
  }
}
