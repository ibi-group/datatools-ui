// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React from 'react'

type Props = {
  dateFormat?: string,
  icon: string,
  statusSpanClass: string,
  statusText: string,
  subtext?: string,
  subtextDate?: string
}

export default function TimedStatus ({
  dateFormat,
  icon,
  statusSpanClass,
  statusText,
  subtext,
  subtextDate
}: Props) {
  return (
    <div>
      <span className={`feed-status ${statusSpanClass}`}>
        <Icon type={icon} />
        {statusText}
      </span>
      <div className='feed-status-subtext'>
        {subtext}
        {subtextDate && <br />}
        {subtextDate && dateFormat && `(${moment(subtextDate).format(dateFormat)})`}
      </div>
    </div>
  )
}
