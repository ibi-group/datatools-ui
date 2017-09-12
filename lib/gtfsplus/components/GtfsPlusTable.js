import React, {Component, PropTypes} from 'react'
import { Row, Col, FormControl, Table, Button, Glyphicon, Tooltip, OverlayTrigger } from 'react-bootstrap'

import OptionButton from '../../common/components/OptionButton'
import GtfsPlusField from './GtfsPlusField'
import GtfsPlusFieldHeader from './GtfsPlusFieldHeader'

const RECORDS_PER_PAGE = 25

export default class GtfsPlusTable extends Component {
  static propTypes = {
    table: PropTypes.object
  }

  state = {
    currentPage: 1,
    pageCount: this.props.tableData ? Math.ceil(this.props.tableData.length / RECORDS_PER_PAGE) : 0,
    visibility: 'all'
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.table !== nextProps.table) {
      this.setState({ currentPage: 1 })
    }
  }

  componentDidMount () {
    this.props.newRowsDisplayed(this.getActiveRowData(this.state.currentPage))
  }

  componentDidUpdate () {
    this.props.newRowsDisplayed(this.getActiveRowData(this.state.currentPage))
  }

  getActiveRowData (currentPage) {
    if (!this.props.tableData) return []
    const tableValidation = this.props.validation || []
    if (this.state.visibility === 'validation' && tableValidation.length < 5000) {
      return this.props.tableData
        .filter(record => (tableValidation.find(v => v.rowIndex === record.origRowIndex)))
        .slice((currentPage - 1) * RECORDS_PER_PAGE,
          Math.min(currentPage * RECORDS_PER_PAGE, this.props.tableData.length))
    }
    return this.props.tableData
      .slice((currentPage - 1) * RECORDS_PER_PAGE,
        Math.min(currentPage * RECORDS_PER_PAGE, this.props.tableData.length))
  }

  _onChangeVisibleRows = (evt) => this.setState({visibility: evt.target.value, currentPage: 1})

  _onClickNewRow = () => this.props.newRowClicked(this.props.table.id)

  _onClickShowTableHelp = () => this.props.showHelpClicked(this.props.table.id)

  _onGoToFocus = e => e.target.select()

  _onGoToKeyUp = e => {
    if (e.keyCode === 13) {
      const newPage = parseInt(e.target.value)
      if (newPage > 0 && newPage <= this.state.pageCount) {
        e.target.value = ''
        this.setState({ currentPage: newPage })
      }
    }
  }

  _onClickDeleteRow = (index) => this.props.deleteRowClicked(this.props.table.id, index)

  _onPageLeft = evt => this.setState({ currentPage: this.state.currentPage - 1 })

  _onPageRight = evt => this.setState({ currentPage: this.state.currentPage + 1 })

  render () {
    const {showHelpClicked, table} = this.props
    const {pageCount} = this.state
    const rowData = this.getActiveRowData(this.state.currentPage)
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
    return (<div>
      <Row>
        <Col xs={12}>
          <div style={headerStyle}>
            {table.name}
            <Glyphicon
              glyph='question-sign'
              style={{ cursor: 'pointer', fontSize: '18px', marginLeft: '10px' }}
              onClick={this._onClickShowTableHelp} />
          </div>
        </Col>
      </Row>

      <Row>
        <Col xs={8}>
          <div className='form-inline'>
            {(pageCount > 1)
              ? <span style={{ marginRight: '15px' }}>
                <Button
                  disabled={this.state.currentPage <= 1}
                  onClick={this._onPageLeft}>
                  <Glyphicon glyph='arrow-left' />
                </Button>
                <span style={{fontSize: '18px', margin: '0px 10px'}}>
                  Page {this.state.currentPage} of {pageCount}
                </span>
                <Button
                  disabled={this.state.currentPage >= pageCount}
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
              Show&nbsp;
              <FormControl
                componentClass='select'
                onChange={this._onChangeVisibleRows}>
                <option value='all'>All Records</option>
                <option value='validation'>Validation Issues Only</option>
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
          {rowData && rowData.length > 0
            ? rowData.map((data, rowIndex) => {
              const tableRowIndex = ((this.state.currentPage - 1) * RECORDS_PER_PAGE) + rowIndex
              return (
                <tr key={rowIndex}>
                  {table.fields.map(field => {
                    const validationIssue = this.props.validation
                      ? this.props.validation.find(v =>
                          (v.rowIndex === data.origRowIndex && v.fieldName === field.name))
                      : null

                    const tooltip = validationIssue ? (
                      <Tooltip id='validation-tooltip'>{validationIssue.description}</Tooltip>
                    ) : null
                    return (
                      <td key={field.name}>
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
                            row={tableRowIndex}
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
                      value={rowIndex}
                      className='pull-right'
                      onClick={this._onClickDeleteRow}>
                      <Glyphicon glyph='remove' />
                    </OptionButton>
                  </td>
                </tr>
              )
            })
            : null
          }
        </tbody>
      </Table>

      {!rowData || rowData.length === 0
        ? <Row><Col xs={12}>
          <i>No entries exist for this table.</i>
        </Col></Row>
        : null
      }

      <Row>
        <Button
          bsStyle='primary'
          bsSize='large'
          className='pull-right'
          onClick={this._onClickNewRow}
        ><Glyphicon glyph='plus' /> New Row</Button>
      </Row>

    </div>)
  }
}
