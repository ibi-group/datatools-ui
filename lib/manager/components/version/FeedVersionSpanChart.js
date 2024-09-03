// @flow

import moment from 'moment'
import React, { Component } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import type { FeedVersion, Style } from '../../../types'

import VersionDateLabel from './VersionDateLabel'

type Props = {
  activeVersion: FeedVersion,
  comparedVersion?: ?FeedVersion,
  style: Style
}

const DATE_FORMAT = 'MMM D, YYYY'
const TODAY_DATE_FORMAT = 'MMM D'

// Width of feed span bar.
const BAR_WIDTH_PX = 150
const DATE_WIDTH_PX = 100
const HEIGHT_EM = 1.25
const HEIGHT_PROP = `${HEIGHT_EM}em`
const SPAN_MARGIN_PX = 5
// Render the 'today' marker above the spans (they have default z-index),
// but underneath the date labels.
// This is also why we need to split up labels and spans during rendering.
const DATE_LABEL_ZINDEX = 9999
const TODAY_MARKER_ZINDEX = 9998

/**
 * This component renders bars representing the date ranges for which the given feed versions
 * are valid (e.g., Jan 1 - March 27) and lets the user visualize overlaps or gaps in the validity periods
 * of the active and compared feed versions.
 */
export default class FeedVersionSpanChart extends Component<Props> {
  render () {
    const { activeVersion, comparedVersion, style } = this.props
    // Get the validation summary to compare against for min/max dates
    const comparisonDates = comparedVersion
      ? comparedVersion.validationSummary
      : activeVersion.validationSummary

    // Construct moment objects for the active/compared version start/end dates.
    const activeStartDate = moment(activeVersion.validationSummary.startDate)
    const activeEndDate = moment(activeVersion.validationSummary.endDate)
    const comparedStartDate = moment(comparisonDates.startDate)
    const comparedEndDate = moment(comparisonDates.endDate)

    const firstDate = moment.min(activeStartDate, comparedStartDate)
    const lastDate = moment.max(activeEndDate, comparedEndDate)

    const earliestEnd = moment.min(activeEndDate, comparedEndDate)
    const latestStart = moment.max(activeStartDate, comparedStartDate)

    const hasGap = latestStart.diff(earliestEnd, 'days') > 0

    // Render the today marker if it is between first and last date.
    const today = moment()
    const totalDays = lastDate.diff(firstDate, 'days')
    const todayOffset = today.diff(firstDate, 'days')
    const showToday = todayOffset >= 0 && todayOffset < totalDays
    const labelStyle = {
      height: HEIGHT_PROP,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }

    return (
      <div style={{ ...style, display: 'flex' }}>
        {/* Chart Labels */}
        {comparedVersion && (
          <div>
            <div style={labelStyle}>Version {activeVersion.version} (sélectionnée)</div>
            {hasGap &&
              <div className='text-danger' style={{ height: HEIGHT_PROP }}>
                Gap in service
              </div>
            }
            <div style={labelStyle}>Version {comparedVersion.version}</div>
          </div>
        )}
        {/* Chart Spans */}
        <div style={{ minHeight: HEIGHT_PROP, position: 'relative', width: '400px' }}>
          <FeedSpanWithDates
            firstDate={firstDate}
            lastDate={lastDate}
            name='active'
            top={0}
            versionEndDate={activeEndDate}
            versionLabel={<VersionDateLabel version={activeVersion} />}
            versionStartDate={activeStartDate}
          />
          {comparedVersion && hasGap &&
            <FeedSpan
              firstDate={firstDate}
              isServiceGap
              lastDate={lastDate}
              top={`${HEIGHT_EM}em`}
              versionEndDate={latestStart}
              versionStartDate={earliestEnd}
            />}
          {comparedVersion &&
            <FeedSpanWithDates
              firstDate={firstDate}
              lastDate={lastDate}
              name='compared'
              top={`${(hasGap ? 2 : 1) * HEIGHT_EM}em`}
              versionEndDate={comparedEndDate}
              versionLabel={<VersionDateLabel version={comparedVersion} />}
              versionStartDate={comparedStartDate}
            />
          }
          {showToday && <TodayMarker firstDate={firstDate} lastDate={lastDate} />}
        </div>
      </div>
    )
  }
}

/**
 * Render a span of the chart with date labels.
 * FIXME[React 16.2+]: Extract into <>...</> markup.
 */
const FeedSpanWithDates = props => {
  const { name } = props
  return (
    <div>
      <FeedStartLabel key={`${name}-start`} {...props} />
      <FeedEndLabel key={`${name}-end`} {...props} />
      <FeedSpan key={`${name}-span`} {...props} isServiceGap={false} />
    </div>
  )
}

/**
 * Compute label position and sizing info.
 */
function getRenderVars ({
  firstDate,
  lastDate,
  versionEndDate,
  versionLabel,
  versionStartDate
}) {
  const totalDays = lastDate.diff(firstDate, 'days')
  const daysActive = versionEndDate.diff(versionStartDate, 'days')
  const versionOffset = versionStartDate.diff(firstDate, 'days')

  return {
    daysActive,
    endLabel: versionEndDate.format(DATE_FORMAT),
    relativeLength: daysActive / totalDays,
    relativeOffset: versionOffset / totalDays,
    startLabel: versionStartDate.format(DATE_FORMAT),
    totalDays,
    versionOffset
  }
}

/** Renders the validity span of one feed using the given props. */
const FeedSpan = props => {
  const { isServiceGap = false, top } = props
  const { daysActive, relativeLength, relativeOffset } = getRenderVars(props)
  return (
    <OverlayTrigger
      overlay={(
        <Tooltip id='feed-span'>
          {isServiceGap && 'Pas de service pour'}{' '}
          {daysActive} days
        </Tooltip>
      )}
      placement='bottom'
    >
      <span
        style={{
          height: HEIGHT_PROP,
          left: `${relativeOffset * BAR_WIDTH_PX + SPAN_MARGIN_PX + DATE_WIDTH_PX}px`,
          position: 'absolute',
          top,
          width: `${relativeLength * BAR_WIDTH_PX}px`
        }}
      >
        <span
          style={{
            backgroundColor: isServiceGap ? 'red' : 'grey',
            bottom: '10%',
            height: '.75em',
            position: 'absolute',
            width: '100%'
          }}
        />
      </span>
    </OverlayTrigger>
  )
}

/**
 * Renders a validity span START label (needs to be separate from the span itself for Z order).
 */
const FeedStartLabel = props => {
  const { name, top } = props
  const { relativeOffset, startLabel } = getRenderVars(props)
  return (
    <span
      data-test-id={`${name}-feed-version-validity-start`}
      style={{
        left: `${relativeOffset * BAR_WIDTH_PX}px`,
        position: 'absolute',
        textAlign: 'right',
        top,
        width: `${DATE_WIDTH_PX}px`,
        zIndex: DATE_LABEL_ZINDEX
      }}
    >
      {startLabel}
    </span>
  )
}

/**
 * Renders a validity span END label (needs to be separate from the span itself for Z order).
 */
const FeedEndLabel = props => {
  const { name, top, versionLabel } = props
  const {
    endLabel,
    relativeLength,
    relativeOffset
  } = getRenderVars(props)

  return (
    <span
      style={{
        left: `${relativeOffset * BAR_WIDTH_PX + SPAN_MARGIN_PX + DATE_WIDTH_PX + relativeLength * BAR_WIDTH_PX + SPAN_MARGIN_PX}px`,
        position: 'absolute',
        top,
        whiteSpace: 'nowrap',
        zIndex: DATE_LABEL_ZINDEX
      }}
    >
      <span data-test-id={`${name}-feed-version-validity-end`}>
        {endLabel}
      </span>
      {' '}
      {versionLabel}
    </span>
  )
}

/** Renders a marker on today's date (if one of the feeds being compared is valid). */
const TodayMarker = ({
  firstDate,
  lastDate
}) => {
  const totalDays = lastDate.diff(firstDate, 'days')
  const today = moment()
  const todayOffset = today.diff(firstDate, 'days')

  return (
    <OverlayTrigger
      overlay={(
        <Tooltip
          className='in'
          id='today-tip'
          positionTop={-25}
        >
          {`Today - ${today.format(TODAY_DATE_FORMAT)}`}
        </Tooltip>
      )}
      placement='top'
    >
      <div
        style={{
          backgroundColor: '#f0d000',
          border: '1px solid #c09000',
          bottom: '-3px',
          left: `${DATE_WIDTH_PX + todayOffset / totalDays * BAR_WIDTH_PX}px`,
          position: 'absolute',
          top: 0,
          width: '4px',
          zIndex: TODAY_MARKER_ZINDEX
        }}
      />
    </OverlayTrigger>
  )
}
