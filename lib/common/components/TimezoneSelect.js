// @flow

import React, {Component} from 'react'

import {getComponentMessages} from '../util/config'
import timezones from '../util/timezones'
import type { ReactSelectOption } from '../../types'

import GtfsEntitySelect from './GtfsEntitySelect'

type Props = {
  clearable?: boolean,
  onChange: ReactSelectOption => void,
  value: ?string
}

export default class TimezoneSelect extends Component<Props> {
  messages = getComponentMessages('TimezoneSelect')

  render () {
    const {clearable, onChange} = this.props
    const options = timezones.map(tz => ({value: tz, label: tz}))
    return (
      <GtfsEntitySelect
        clearable={clearable}
        onChange={onChange}
        options={options}
        placeholder={this.messages('placeholder')}
        refString='tzSelect'
        {...this.props}
      />
    )
  }
}
