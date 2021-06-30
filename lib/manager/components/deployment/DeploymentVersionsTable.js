// @flow

import React, {Component} from 'react'
import {Table} from 'react-bootstrap'

import {getComponentMessages} from '../../../common/util/config'
import DeploymentTableRow from './DeploymentTableRow'

import type {Deployment, Project, SummarizedFeedVersion} from '../../../types'

type Props = {
  deployment: Deployment,
  project: Project,
  versions: Array<SummarizedFeedVersion>
}

export default class DeploymentVersionsTable extends Component<Props> {
  messages = getComponentMessages('DeploymentVersionsTable')

  render () {
    const {
      deployment,
      project,
      versions
    } = this.props
    return (
      <Table striped hover fill>
        <thead>
          <tr>
            <th className='col-md-4'>{this.messages('name')}</th>
            <th>Version</th>
            <th className='hidden-xs'>{this.messages('loadStatus')}</th>
            <th className='hidden-xs'>{this.messages('errorCount')}</th>
            <th className='hidden-xs'>{this.messages('routeCount')}</th>
            <th className='hidden-xs'>{this.messages('tripCount')}</th>
            <th className='hidden-xs'>{this.messages('stopTimesCount')}</th>
            <th>{this.messages('validFrom')}</th>
            <th>{this.messages('expires')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {versions.map((version) => {
            return (
              <DeploymentTableRow
                feedSource={version.feedSource}
                version={version}
                project={project}
                deployment={deployment}
                key={version.id}
              />
            )
          })}
        </tbody>
      </Table>
    )
  }
}
