import React, {Component, PropTypes} from 'react'
import { Panel, Row, Col, Table, Button, Glyphicon, Alert } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import moment from 'moment'

import { getConfigProperty } from '../../common/util/config'

export default class GtfsPlusVersionSummary extends Component {
  static propTypes = {
    gtfsplus: PropTypes.object,
    gtfsPlusDataRequested: PropTypes.func,
    publishClicked: PropTypes.func,
    user: PropTypes.object,
    version: PropTypes.object
  }

  state = { expanded: false }

  componentDidMount () {
    this.props.gtfsPlusDataRequested(this.props.version.id)
  }

  isTableIncluded (tableId) {
    if (!this.props.gtfsplus.tableData) return null
    return tableId in this.props.gtfsplus.tableData ? 'Yes' : 'No'
  }

  tableRecordCount (tableId) {
    if (!this.props.gtfsplus.tableData) return null
    if (!(tableId in this.props.gtfsplus.tableData)) return 'N/A'
    return this.props.gtfsplus.tableData[tableId].length.toLocaleString()
  }

  validationIssueCount (tableId) {
    if (!this.props.gtfsplus.validation) return null
    if (!(tableId in this.props.gtfsplus.validation)) return 'None'
    return this.props.gtfsplus.validation[tableId].length.toLocaleString()
  }

  feedStatus () {
    if (!this.props.gtfsplus.timestamp) return null
    if (!this.gtfsPlusEdited()) return <i>GTFS+ data for this feed version has not been edited.</i>
    return <b>GTFS+ Data updated {moment(this.props.gtfsplus.timestamp).format('MMM. DD, YYYY, h:MMa')}</b>
  }

  gtfsPlusEdited () {
    return (this.props.gtfsplus.timestamp !== this.props.version.fileTimestamp)
  }

  _onClickEdit = () => {
    const {version} = this.props
    browserHistory.push(`/gtfsplus/${version.feedSource.id}/${version.id}`)
  }

  _onClickPublish = () => {
    this.props.publishClicked(this.props.version)
    this.setState({ expanded: false })
  }

  _toggleExpanded = () => {
    const {gtfsPlusDataRequested, version} = this.props
    const {expanded} = this.state
    if (!expanded) gtfsPlusDataRequested(version.id)
    this.setState({ expanded: !expanded })
  }

  render () {
    const {
      user,
      version
    } = this.props
    const { feedSource } = version
    const editingIsDisabled = !user.permissions.hasFeedPermission(feedSource.organizationId, feedSource.projectId, feedSource.id, 'edit-gtfs')
    const publishingIsDisabled = !user.permissions.hasFeedPermission(feedSource.organizationId, feedSource.projectId, feedSource.id, 'approve-gtfs')
    const header = (
      <h3>
        <Glyphicon glyph='check' /> GTFS+ for this Version
      </h3>
    )

    return (
      <Panel header={header}>
        <Row>
          <Col xs={6}>
            <Alert>{this.feedStatus()}</Alert>
          </Col>
          <Col xs={6} style={{ textAlign: 'right' }}>
            <Button
              disabled={editingIsDisabled}
              bsStyle='primary'
              onClick={this._onClickEdit}>
              <Glyphicon glyph='edit' /> Edit GTFS+
            </Button>
            {this.gtfsPlusEdited()
              ? <Button
                disabled={publishingIsDisabled}
                bsStyle='primary'
                style={{ marginLeft: '6px' }}
                onClick={this._onClickPublish}>
                <Glyphicon glyph='upload' /> Publish as New Version
              </Button>
              : null
            }
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <Panel>
              <Table striped fill>
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Included?</th>
                    <th>Records</th>
                    <th>Validation Issues</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {getConfigProperty('modules.gtfsplus.spec').map((table, index) => {
                    const issueCount = this.validationIssueCount(table.id)
                    return (
                      <tr
                        key={index}
                        className={issueCount > 0 && 'warning'}
                        style={{ color: this.isTableIncluded(table.id) === 'Yes' ? 'black' : 'lightGray' }}>
                        <td>{table.name}</td>
                        <td>{this.isTableIncluded(table.id)}</td>
                        <td>{this.tableRecordCount(table.id)}</td>
                        <td>{issueCount}</td>
                        <td />
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Panel>
          </Col>
        </Row>
      </Panel>
    )
  }
}
