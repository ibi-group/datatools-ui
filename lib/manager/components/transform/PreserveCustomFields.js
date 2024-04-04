import React from 'react'

import { getComponentMessages } from '../../../common/util/config'

import ReplaceFileFromString from './ReplaceFileFromString'
import CustomCSVForm from './CustomCSVForm'

export default class PreserveCustomFields extends ReplaceFileFromString {
  // Messages are for the child CSV Form component but since messages are shared across transformation types,
  // the messages are being grouped under that component.
  messages = getComponentMessages('PreserveCustomFields')
  render () {
    const {transformation} = this.props
    const {csvData} = this.state
    const inputIsSame = csvData === transformation.csvData

    return (
      <CustomCSVForm
        buttonText={this.messages('saveCsv')}
        csvData={csvData}
        headerText={this.messages('addCsvWithCustomFields')}
        inputIsSame={inputIsSame}
        onChangeCsvData={this._onChangeCsvData}
        onSaveCsvData={this._onSaveCsvData}
      />
    )
  }
}
