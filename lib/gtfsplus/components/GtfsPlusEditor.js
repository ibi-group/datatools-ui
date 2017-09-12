import React, {Component, PropTypes} from 'react'
import { Grid, Row, Col, Button, Glyphicon, PageHeader } from 'react-bootstrap'
import JSZip from 'jszip'
import { Link } from 'react-router'

import ManagerPage from '../../common/components/ManagerPage'
import OptionButton from '../../common/components/OptionButton'
import GtfsPlusTable from './GtfsPlusTable'
import { getConfigProperty } from '../../common/util/config'

export default class GtfsPlusEditor extends Component {
  static propTypes = {
    deleteRowClicked: PropTypes.func,
    feedSource: PropTypes.object,
    fieldEdited: PropTypes.func,
    gtfsEntityLookup: PropTypes.object,
    gtfsEntitySelected: PropTypes.func,
    newRowClicked: PropTypes.func,
    newRowsDisplayed: PropTypes.func,
    onComponentMount: PropTypes.func,
    project: PropTypes.object,
    tableData: PropTypes.object,
    user: PropTypes.object,
    validation: PropTypes.object
  }

  state = {
    activeTableId: 'realtime_routes'
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  save = () => {
    const zip = new JSZip()

    for (const table of getConfigProperty('modules.gtfsplus.spec')) {
      if (!(table.id in this.props.tableData) || this.props.tableData[table.id].length === 0) continue

      let fileContent = ''
      // white the header line
      const fieldNameArr = table.fields.map(field => field['name'])
      fileContent += fieldNameArr.join(',') + '\n'

      // write the data rows
      this.props.tableData[table.id].map(rowData => {
        const rowText = fieldNameArr.map(fieldName => {
          return rowData[fieldName] || ''
        }).join(',')
        fileContent += rowText + '\n'
      })

      // add to the zip archive
      zip.file(table.name, fileContent)
    }

    zip.generateAsync({type: 'blob'}).then((content) => {
      this.props.feedSaved(content)
    })
  }

  _getGtfsEntity = (type, id) => this.props.gtfsEntityLookup[`${type}_${id}`]

  _gtfsEntitySelected = (type, entity) => this.props.gtfsEntitySelected(type, entity)

  _newRowsDisplayed = (rows) => this.props.newRowsDisplayed(this.state.activeTableId, rows, this.props.feedSource)

  _selectTable = (activeTableId) => this.setState({activeTableId})

  _showHelpClicked = (tableId, fieldName) => {
    const helpContent = fieldName
      ? getConfigProperty('modules.gtfsplus.spec')
          .find(t => t.id === tableId).fields
            .find(f => f.name === fieldName).helpContent
      : getConfigProperty('modules.gtfsplus.spec')
          .find(t => t.id === tableId).helpContent
    this.refs.page.showInfoModal({
      title: `Help for ${tableId}.txt` + (fieldName ? `: ${fieldName}` : ''),
      body: helpContent || '(No help content found for this field)'
    })
  }

  render () {
    const {
      feedSource,
      deleteRowClicked,
      fieldEdited,
      newRowClicked,
      project,
      tableData,
      user,
      validation
    } = this.props
    if (!feedSource) return null
    const editingIsDisabled = !user.permissions.hasFeedPermission(feedSource.organizationId, feedSource.projectId, feedSource.id, 'edit-gtfs')
    const buttonStyle = {
      display: 'block',
      width: '100%'
    }

    const activeTable = getConfigProperty('modules.gtfsplus.spec').find(t => t.id === this.state.activeTableId)

    return (
      <ManagerPage ref='page'>
        <Grid>
          <Row>
            <Col xs={12}>
              <ul className='breadcrumb'>
                <li><Link to='/'>Explore</Link></li>
                <li><Link to='/project'>Projects</Link></li>
                <li><Link to={`/project/${project.id}`}>{project.name}</Link></li>
                <li><Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link></li>
                <li className='active'>Edit GTFS+</li>
              </ul>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <PageHeader>Editing GTFS+ for {feedSource.name}
                <Button
                  bsStyle='primary'
                  bsSize='large'
                  disabled={editingIsDisabled}
                  className='pull-right'
                  onClick={this.save}>
                  <Glyphicon glyph='save' /> Save & Revalidate
                </Button>
              </PageHeader>
            </Col>
          </Row>

          <Row>
            <Col xs={2}>
              {getConfigProperty('modules.gtfsplus.spec').map((table, index) => {
                return (<p key={index}>
                  <OptionButton
                    bsStyle={table.id === this.state.activeTableId ? 'info' : 'default'}
                    key={table.id}
                    style={buttonStyle}
                    value={table.id}
                    onClick={this._selectTable}>
                    {validation && (table.id in validation)
                      ? <Glyphicon glyph='alert' style={{ color: 'red', marginRight: '8px' }} />
                      : null
                    }
                    {table.id}
                  </OptionButton>
                </p>)
              })}
            </Col>
            <Col xs={10}>
              <GtfsPlusTable
                ref='activeTable'
                feedSource={feedSource}
                table={activeTable}
                tableData={tableData[activeTable.id]}
                validation={validation[activeTable.id]}
                newRowClicked={newRowClicked}
                deleteRowClicked={deleteRowClicked}
                fieldEdited={fieldEdited}
                gtfsEntitySelected={this._gtfsEntitySelected}
                getGtfsEntity={this._getGtfsEntity}
                showHelpClicked={this._showHelpClicked}
                newRowsDisplayed={this._newRowsDisplayed} />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
