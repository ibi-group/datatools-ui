// @flow

import React, {Component} from 'react'

import {getComponentMessages} from '../util/config'
import type { ReactSelectOption } from '../../types'

import GtfsEntitySelect from './GtfsEntitySelect'

type Props = {
  clearable?: boolean,
  onChange: ReactSelectOption => void,
  serviceIds: Array<string>,
  value: ?string
}

export default class GtfsServiceSelect extends Component<Props> {
  messages = getComponentMessages('GtfsServiceSelect')

  render () {
    const {clearable, onChange, serviceIds} = this.props
    const options = serviceIds.map(serviceId => ({label: serviceId, value: serviceId}))
    return (
      <GtfsEntitySelect
        clearable={clearable}
        onChange={onChange}
        options={options}
        placeholder={this.messages('placeholder')}
        refString='gtfsServiceSelect'
        {...this.props}
      />
    )
  }
}
