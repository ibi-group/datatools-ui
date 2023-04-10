// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {OverlayTrigger, Tooltip} from 'react-bootstrap'

import type { FeedVersion } from '../../../types'

type Props = {
  version: FeedVersion
}

type State = {
  expanded: boolean
}

/**
 * Renders a badge with tooltip showing a summary of the transformations applied
 * to the feed version during processing by the server backend.
 */
export default class TransformationsIndicatorBadge extends Component<Props, State> {
  state = {expanded: false}

  _renderTooltipContent = () => {
    const {version} = this.props
    const {feedTransformResult} = version
    if (!feedTransformResult) return null
    const transformationCount = feedTransformResult.tableTransformResults.length

    return (
      <div style={{paddingLeft: '2px'}}>
        Feed tiene {transformationCount} transformación(es):
        <ul>
          {feedTransformResult.tableTransformResults.map((item, i) => {
            return (
              <li key={i}>
                {item.tableName}{' '}
                {item.transformType.toLowerCase().replace('_', ' ')}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  render () {
    const { version } = this.props
    if (!version.feedTransformResult) return null
    return (
      <OverlayTrigger
        overlay={
          <Tooltip id='transformations-indicator'>
            {this._renderTooltipContent()}
          </Tooltip>
        }>
        <Icon
          type='wrench'
        />
      </OverlayTrigger>
    )
  }
}
