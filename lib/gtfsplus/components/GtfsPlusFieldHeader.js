// @flow

import React, {Component} from 'react'
import {Glyphicon, OverlayTrigger, Tooltip} from 'react-bootstrap'

import type {GtfsPlusField, GtfsPlusTable, GtfsPlusValidationIssue} from '../../types'

type Props = {
  field: GtfsPlusField,
  showHelpClicked: (string, ?string) => void,
  table: GtfsPlusTable,
  tableValidation: Array<GtfsPlusValidationIssue>
}

export default class GtfsPlusFieldHeader extends Component<Props> {
  _onClick = () => {
    this.props.showHelpClicked(this.props.table.id, this.props.field.name)
  }

  /**
   * Column structure issues are identified by not having -1 for row index (not
   * applicable to any data row) and matching the field name.
   */
  _getColumnStructureIssues = () => {
    const {field, tableValidation} = this.props
    const tableLevelIssues = tableValidation.filter(issue =>
      issue.rowIndex === -1 && issue.fieldName === field.name)
    return tableLevelIssues.length > 0 ? tableLevelIssues : null
  }

  render () {
    const {field} = this.props
    const columnIssues = this._getColumnStructureIssues()
    const tooltip = columnIssues
      ? <Tooltip id={`${field.name}-field-tooltip`}>
        {columnIssues[0].description}
      </Tooltip>
      : null
    return (
      <th
        className={`gtfs-plus-column-header col-md-${field.columnWidth}`}>
        {field.name}{field.required ? ' *' : ''}
        {columnIssues &&
          <OverlayTrigger placement='top' overlay={tooltip}>
            <Glyphicon glyph='alert' style={{ color: 'red', marginLeft: '10px' }} />
          </OverlayTrigger>
        }
        <Glyphicon
          glyph='question-sign'
          className='pull-right'
          style={{ cursor: 'pointer' }}
          onClick={this._onClick} />
      </th>
    )
  }
}
