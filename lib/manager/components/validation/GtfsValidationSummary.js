import Icon from '@conveyal/woonerf/components/icon'
import React, { Component, PropTypes } from 'react'
import { Panel, Table, Button } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import Loading from '../../../common/components/Loading'

export default class GtfsValidationSummary extends Component {
  static propTypes = {
    version: PropTypes.object,
    feedVersionIndex: PropTypes.number,
    fetchValidationResult: PropTypes.func
  }
  componentWillMount () {
    if (!this.props.version.validationResult) {
      this.props.fetchValidationResult()
    }
  }
  render () {
    const {
      version,
      feedVersionIndex
    } = this.props
    const result = version.validationResult
    if (!result) {
      return <Loading />
    }
    let report
    if (result) {
      report = <ValidationSummaryTable version={version} />
    } else {
      report = (<div>No validation results to show.</div>)
    }

    return (
      <div>
        {report}
        <LinkContainer to={`/feed/${version.feedSource.id}/version/${feedVersionIndex}/issues`}>
          <Button
            block
            bsStyle='primary'
            bsSize='large'
            style={{marginTop: '20px'}}
          >
            <Icon type='file-text-o' /> View full validation report
          </Button>
        </LinkContainer>
      </div>
    )
  }
}

export class ValidationSummaryTable extends Component {
  render () {
    const {
      version
    } = this.props
    if (version && version.validationResult && version.validationResult.errors.length === 0) {
      return <div className='lead text-center '>No validation issues found.</div>
    } else if (!version || !version.validationResult) {
      return <div className='lead text-center '>Feed has not yet been validated.</div>
    }
    const breakWordStyle = {
      wordWrap: 'break-word',
      overflowWrap: 'break-word'
    }
    const problemMap = {}
    version.validationResult.errors && version.validationResult.errors.map(val => {
      if (!problemMap[val.errorType]) {
        problemMap[val.errorType] = {
          count: 0,
          priority: val.priority,
          file: val.file,
          affected: [val.affectedEntityId],
          description: val.problemDescription,
          data: [val.problemData]
        }
      }
      problemMap[val.errorType].count++
      problemMap[val.errorType].affected.push(val.affectedEntityId)
      problemMap[val.errorType].data.push(val.problemData)
    })
    return (
      <Panel>
        <Table
          striped
          fill>
          <thead>
            <tr>
              <th>File</th>
              <th>Issue</th>
              <th>Priority</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(problemMap).map((key) => {
              return (
                <tr key={key}>
                  <td style={breakWordStyle}>{problemMap[key].file}</td>
                  <td style={breakWordStyle}>{key.replace(/([A-Z])/g, ' $1')}</td>
                  <td style={breakWordStyle}>{problemMap[key].priority}</td>
                  <td style={breakWordStyle} title={problemMap[key].affected.join(', ')}>{problemMap[key].count}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Panel>
    )
  }
}
