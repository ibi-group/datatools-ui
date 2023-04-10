// @flow

import React, {Component} from 'react'
import { Panel, Table } from 'react-bootstrap'

import * as feedsActions from '../actions/feeds'
import EditableTextField from '../../common/components/EditableTextField'

import type {Feed} from '../../types'

type Props = {
  editingIsDisabled: ?boolean,
  feedSource: Feed,
  isProjectAdmin: ?boolean,
  resourceProps: any,
  resourceType: string,
  updateExternalFeedResource: typeof feedsActions.updateExternalFeedResource
}

export default class ExternalPropertiesTable extends Component<Props> {
  render () {
    const {
      feedSource,
      resourceProps,
      resourceType
    } = this.props
    return (
      <Panel
        header={<h3>{resourceType} propiedades</h3>}>
        <Table striped fill>
          <thead>
            <tr>
              <th className='col-md-4'>Propiedad</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(resourceProps).sort().map((propName, index) => (
              <ExternalProperty
                {...this.props}
                key={propName}
                feedSource={feedSource}
                value={resourceProps[propName]}
                resourceType={resourceType}
                name={propName} />
            ))}
          </tbody>
        </Table>
      </Panel>
    )
  }
}

type PropertyProps = {
  editingIsDisabled: ?boolean,
  feedSource: Feed,
  isProjectAdmin: ?boolean,
  name: string,
  resourceType: string,
  updateExternalFeedResource: typeof feedsActions.updateExternalFeedResource,
  value: string
}

class ExternalProperty extends Component<PropertyProps> {
  _onChange = (value) => {
    const {feedSource, name, resourceType, updateExternalFeedResource} = this.props
    updateExternalFeedResource(feedSource, resourceType, {[name]: value})
  }

  render () {
    const {editingIsDisabled, isProjectAdmin, name, resourceType, value} = this.props
    const disabled = resourceType === 'MTC' && name === 'AgencyId'
      ? !isProjectAdmin
      : editingIsDisabled
    return (
      <tr>
        <td>{name}</td>
        <td>
          <EditableTextField
            disabled={disabled}
            value={value}
            onChange={this._onChange} />
        </td>
      </tr>
    )
  }
}
