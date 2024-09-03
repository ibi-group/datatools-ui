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
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>Propriétés {resourceType}</Panel.Title></Panel.Heading>
        <Panel.Body>
          <Table fill striped>
            <thead>
              <tr>
                <th className='col-md-4'>Propriété</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(resourceProps).sort().map((propName, index) => (
                <ExternalProperty
                  {...this.props}
                  feedSource={feedSource}
                  key={propName}
                  name={propName}
                  resourceType={resourceType}
                  value={resourceProps[propName]} />
              ))}
            </tbody>
          </Table>
        </Panel.Body>
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
            onChange={this._onChange}
            value={value} />
        </td>
      </tr>
    )
  }
}
