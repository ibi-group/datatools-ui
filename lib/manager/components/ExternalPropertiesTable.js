import React, { Component, PropTypes } from 'react'
import { Panel, Table } from 'react-bootstrap'

import EditableTextField from '../../common/components/EditableTextField'

export default class ExternalPropertiesTable extends Component {
  static propTypes = {
    editingIsDisabled: PropTypes.bool,
    externalPropertyChanged: PropTypes.func,
    feedSource: PropTypes.object,
    isProjectAdmin: PropTypes.bool,
    resourceProps: PropTypes.object,
    resourceType: PropTypes.string
  }
  render () {
    const {
      feedSource,
      resourceProps,
      resourceType
    } = this.props
    return (
      <Panel
        header={<h3>{resourceType} properties</h3>}>
        <Table striped fill>
          <thead>
            <tr>
              <th className='col-md-4'>Property</th>
              <th>Value</th>
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

class ExternalProperty extends Component {
  static propTypes = {
    editingIsDisabled: PropTypes.bool,
    externalPropertyChanged: PropTypes.func,
    feedSource: PropTypes.object,
    isProjectAdmin: PropTypes.bool,
    resourceType: PropTypes.string
  }

  _onChange = (value) => {
    const {externalPropertyChanged, feedSource, name, resourceType} = this.props
    externalPropertyChanged(feedSource, resourceType, {[name]: value})
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
