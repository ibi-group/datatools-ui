// @flow

import React, { Component } from 'react'

import type { AddCustomFileProps, TransformProps } from '../../../types'
import CSV_VALIDATION_ERRORS from '../../util/enums/transform'
import { getComponentMessages } from '../../../common/util/config'

import CustomCSVForm from './CustomCSVForm'

/**
 * Component that renders fields for AddCustomFile. This transformation shares csvData props with the ReplaceFileFromString transformation.
 * TODO: adapt this transformation to include a file upload for larger custom files?
 */
export default class AddCustomFile extends Component<TransformProps<AddCustomFileProps>, AddCustomFileProps> {
  // Messages are for the child CSV Form component but since messages are shared across transformation types,
  // the messages are being grouped under that component.
  messages = getComponentMessages('AddCustomFile')
  constructor (props: TransformProps<AddCustomFileProps>) {
    super(props)
    this.state = {csvData: props.transformation.csvData, table: props.transformation.table}
  }

  componentDidMount () {
    this._updateErrors()
  }

  componentDidUpdate (prevProps: TransformProps<AddCustomFileProps>, prevState: AddCustomFileProps) {
    if (prevState !== this.state) {
      this._updateErrors()
    }
  }

  _handleChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const newState = {...this.state, table: evt.target.value}
    this.setState(newState)
  }

  _onSaveCsvData = () => {
    const csvData = this.state.csvData || null
    const table = this.state.table
    this.props.onSave({csvData, table}, this.props.index)
  }

  _onChangeCsvData = (evt: {target: {name?: string, value: string}}) => {
    const newState = {...this.state, csvData: evt.target.value}
    this.setState(newState)
  }

  _getValidationErrors (fields: AddCustomFileProps): Array<string> {
    const issues = []
    const { csvData, table } = fields

    // CSV data must be defined.
    if (!csvData || csvData.length === 0) {
      issues.push(CSV_VALIDATION_ERRORS.UNDEFINED_CSV_DATA)
    }
    if (!table) {
      issues.push(CSV_VALIDATION_ERRORS.CSV_MUST_HAVE_NAME)
    }
    if (table && table.endsWith('.txt')) {
      issues.push(CSV_VALIDATION_ERRORS.CSV_NAME_CONTAINS_TXT)
    }
    return issues
  }

  /**
   * Notify containing component of the resulting validation errors if any.
   * @param fields: The updated state. If not set, the component state will be used.
   */
  _updateErrors = (fields?: AddCustomFileProps) => {
    const { onValidationErrors } = this.props
    onValidationErrors(this._getValidationErrors(fields || this.state))
  }

  render () {
    const {transformation} = this.props
    const {csvData, table} = this.state
    const inputIsSame = csvData === transformation.csvData && table === transformation.table
    return (
      <div>
        <div>
          <input
            onChange={this._handleChange}
            placeholder={this.messages('customFileName')}
            type='text'
            value={table || null}
          />.txt
        </div>
        <CustomCSVForm
          buttonText={this.messages('saveCsvAndFileName')}
          csvData={csvData}
          headerText={this.messages('addCustomCsvData')}
          inputIsSame={inputIsSame}
          onChangeCsvData={this._onChangeCsvData}
          onSaveCsvData={this._onSaveCsvData}
          placeholder={''}
        />
      </div>
    )
  }
}
