// @flow

import React, {Component} from 'react'
import { Row, Col, FormControl, Table, Button, Glyphicon, Tooltip, OverlayTrigger } from 'react-bootstrap'

import OptionButton from '../../common/components/OptionButton'
import type {Entity, GtfsSpecTable as GtfsPlusTableType, GtfsPlusValidationIssue} from '../../types'

import GtfsPlusField from './GtfsPlusField'
import GtfsPlusFieldHeader from './GtfsPlusFieldHeader'
import type {Props as GtfsPlusEditorProps} from './GtfsPlusEditor'

export type Props = GtfsPlusEditorProps & {
  disableEditing: boolean,
  getGtfsEntity: (string, string) => Entity,
  newRowsDisplayed: Array<any> => void,
  rows: Array<any>,
  showHelpClicked: (string, ?string) => void,
  table: GtfsPlusTableType,
  tableValidation: Array<GtfsPlusValidationIssue>
}

// The values here are used to filter the visibility of
// table rows to either all rows or just those with
// validation issues.
export const VISIBILITY = Object.freeze({
  ALL: 'all',
  VALIDATION: 'validation'
})

export default class GtfsPlusTable extends Component<Props> {
  componentDidMount () {
    this.props.newRowsDisplayed(this.props.rows)
  }

  componentDidUpdate () {
    this.props.newRowsDisplayed(this.props.rows)
  }

  _onChangeVisibleRows = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {setVisibilityFilter} = this.props
    const visibility = evt.target.value
    // $FlowFixMe: This should be one of $Values<typeof VISIBILITY>
    setVisibilityFilter({visibility})
  }

  /**
   * Table level issues are identified by not having -1 for row index.
   */
  _getTableLevelIssues = () => {
    const {tableValidation} = this.props
    const tableLevelIssues = tableValidation.filter(issue => issue.rowIndex === -1)
    return tableLevelIssues.length > 0 ? tableLevelIssues : null
  }

  _onClickNewRow = () => this.props.addGtfsPlusRow({tableId: this.props.table.id})

  _onClickShowTableHelp = () => this.props.showHelpClicked(this.props.table.id)

  _onGoToFocus = (e: SyntheticInputEvent<HTMLInputElement>) => e.target.select()

  _onGoToKeyUp = (e: any) => {
    // on press [ENTER], set page to new page number
    if (e.keyCode === 13) {
      const newPage = parseInt(e.target.value)
      if (newPage > 0 && newPage <= this.props.pageCount) {
        e.target.value = ''
        this.props.setCurrentPage({newPage})
      }
    }
  }

  _onPageLeft = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.setCurrentPage({ newPage: this.props.currentPage - 1 })

  _onPageRight = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.setCurrentPage({ newPage: this.props.currentPage + 1 })

  render () {
    const {
      currentPage,
      disableEditing,
      pageCount,
      rows,
      showHelpClicked,
      table,
      visibility
    } = this.props
    const headerStyle = {
      fontWeight: 'bold',
      fontSize: '24px',
      borderBottom: '2px solid black',
      marginBottom: '16px'
    }
    const subHeaderStyle = {
      marginBottom: '24px',
      textAlign: 'right'
    }
    const tableLevelIssues = this._getTableLevelIssues()
    return (<div>
      <Row>
        <Col xs={12}>
          <div style={headerStyle}>
            {table.name}
            <Glyphicon
              glyph='question-sign'
              style={{ cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}
              onClick={this._onClickShowTableHelp} />
            {tableLevelIssues &&
              <small style={{ marginLeft: '10px' }} className='text-danger'>
                {tableLevelIssues.length} critical table issue(s)!
              </small>
            }
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={8}>
          <div className='form-inline'>
            {(pageCount > 1)
              ? <span style={{ marginRight: '15px' }}>
                <Button
                  disabled={currentPage <= 1}
                  onClick={this._onPageLeft}>
                  <Glyphicon glyph='arrow-left' />
                </Button>
                <span style={{fontSize: '18px', margin: '0px 10px'}}>
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  disabled={currentPage >= pageCount}
                  onClick={this._onPageRight}>
                  <Glyphicon glyph='arrow-right' />
                </Button>
                <span style={{fontSize: '18px', marginLeft: '15px'}}>
                  Go to <FormControl
                    type='text'
                    size={5}
                    style={{ width: '50px', display: 'inline', textAlign: 'center' }}
                    onKeyUp={this._onGoToKeyUp}
                    onFocus={this._onGoToFocus} />
                </span>
              </span>
              : null
            }
            <span style={{ fontSize: '18px' }}>
              Show{' '}
              <FormControl
                componentClass='select'
                value={visibility}
                onChange={this._onChangeVisibleRows}>
                <option value={VISIBILITY.ALL}>All Records</option>
                <option value={VISIBILITY.VALIDATION}>Validation Issues Only</option>
              </FormControl>
            </span>
          </div>
        </Col>

        <Col xs={4} style={subHeaderStyle}>
          <i>Click (?) icon for details on field.<br />Required fields denoted by (*)</i>
        </Col>
      </Row>

      <Table>
        <thead>
          <tr>
            {table.fields.map((field, index) => (
              <GtfsPlusFieldHeader
                {...this.props}
                key={index}
                field={field}
                showHelpClicked={showHelpClicked}
                table={table} />
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0
            ? rows
              .map((data, rowIndex) => (
                <GtfsPlusRow
                  {...this.props}
                  data={data}
                  key={`${table.id}-${rowIndex}`}
                  index={rowIndex} />
              ))
            : null
          }
        </tbody>
      </Table>

      {(!rows || rows.length === 0)
        ? <Row><Col xs={12}>
          <i>No {visibility === 'validation' ? 'validation issues' : 'entries exist'} for this table.</i>
        </Col></Row>
        : null
      }

      <Row>
        <Button
          bsStyle='primary'
          bsSize='large'
          className='pull-right'
          disabled={disableEditing}
          onClick={this._onClickNewRow}
        >
          <Glyphicon glyph='plus' /> New Row
        </Button>
      </Row>

    </div>)
  }
}

type RowProps = {
  data: any,
  index: number
} & Props

class GtfsPlusRow extends Component<RowProps> {
  _onClickDeleteRow = (rowIndex: number) => {
    this.props.deleteGtfsPlusRow({
      rowIndex,
      tableId: this.props.table.id
    })
  }

  render () {
    const {data, disableEditing, table, tableValidation} = this.props
    // // if validation filter is on, do not render issue-free records
    // if (visibility === 'validation' && validation.length < 5000 && !validation.find(v => v.rowIndex === data.origRowIndex)) {
    //   return null
    // }
    // // filter out rows that are not on current page
    // if (index > currentPage * recordsPerPage || index < (currentPage - 1) * recordsPerPage) {
    //   return null
    // }
    return (
      <tr>
        {table.fields.map((field, i) => {
          const validationIssue = tableValidation
            ? tableValidation.find(v =>
              (v.rowIndex === data.origRowIndex && v.fieldName === field.name))
            : null

          const tooltip = validationIssue ? (
            <Tooltip id='validation-tooltip'>{validationIssue.description}</Tooltip>
          ) : null
          return (
            <td key={`${i}-${field.name}-${data[field.name]}`}>
              {validationIssue
                ? <div style={{ float: 'left' }}>
                  <OverlayTrigger placement='top' overlay={tooltip}>
                    <Glyphicon glyph='alert' style={{ color: 'red', marginTop: '4px' }} />
                  </OverlayTrigger>
                </div>
                : null
              }
              <div style={{ marginLeft: (validationIssue ? '20px' : '0px') }}>
                {<GtfsPlusField
                  {...this.props}
                  row={data.rowIndex}
                  field={field}
                  currentValue={data[field.name]} />}
              </div>
            </td>
          )
        })}
        <td>
          <OptionButton
            bsStyle='danger'
            bsSize='small'
            className='pull-right'
            disabled={disableEditing}
            onClick={this._onClickDeleteRow}
            value={data.rowIndex}
          >
            <Glyphicon glyph='remove' />
          </OptionButton>
        </td>
      </tr>
    )
  }
}
