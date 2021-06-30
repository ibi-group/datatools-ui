// @flow

import React from 'react'
import {Label as BsLabel, OverlayTrigger, Tooltip} from 'react-bootstrap'

import {formatDelta} from '../../util/version'

/**
 * Renders a delta statistic as a label with tooltip when comparing feed
 * versions.
 */
const DeltaStat = (
  {
    comparedVersionIndex,
    diff,
    inverse,
    style
  }: {
    comparedVersionIndex: number,
    diff: number,
    inverse?: boolean,
    style: any
}) => {
  // Construct the tooltip label and style based on positive/negative diff.
  let bsStyle = 'default'
  let comparePhrase = 'No change'
  let conjunction = 'from'
  if (diff > 0) {
    comparePhrase = `${Math.abs(diff)} more`
    conjunction = 'than'
    if (inverse) bsStyle = 'danger'
    else bsStyle = 'success'
  } else if (diff < 0) {
    comparePhrase = `${Math.abs(diff)} fewer`
    conjunction = 'than'
    if (inverse) bsStyle = 'success'
    else bsStyle = 'danger'
  }
  // Render the label
  return (
    <OverlayTrigger
      placement='bottom'
      overlay={
        <Tooltip id='delta-stat'>
          {comparePhrase} {conjunction} version {comparedVersionIndex}
        </Tooltip>
      }
    >
      <BsLabel
        bsStyle={bsStyle}
        style={style}
      >
        {formatDelta(diff)}
      </BsLabel>
    </OverlayTrigger>
  )
}

export default DeltaStat
