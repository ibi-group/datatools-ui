// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { ListGroupItem } from 'react-bootstrap'
import area from 'turf-area'
import bboxPoly from 'turf-bbox-polygon'

import { getConfigProperty, isExtensionEnabled } from '../../../common/util/config'
import type { Bounds, FeedVersion } from '../../../types'

import FeedVersionActionsMTC, { type Props as ActionsMTCProps } from './FeedVersionActionsMTC'
import FeedVersionSpanChart from './FeedVersionSpanChart'

type Props = ActionsMTCProps & {
  comparedVersion: ?FeedVersion,
}

export default class FeedVersionDetails extends Component<Props> {
  getBoundsArea (bounds: Bounds): number {
    if (!bounds) return 0
    const poly = bboxPoly([bounds.west, bounds.south, bounds.east, bounds.east])
    return poly ? area(poly) : 0
  }

  render (): React$Element<any> {
    const { comparedVersion, version } = this.props
    const { validationSummary: summary } = version
    const hasMtcExtension = isExtensionEnabled('mtc')

    return (
      <ListGroupItem>
        <h4 className='pull-left' style={{ marginBottom: '2px' }}>
          <span data-test-id='feed-version-validity'>
            <Icon type='calendar' />{' '}
            Feed validity dates
          </span>
        </h4>
        {hasMtcExtension && <FeedVersionActionsMTC {...this.props} />}

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
