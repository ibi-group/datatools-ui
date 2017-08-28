import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import moment from 'moment'
import { LinkContainer } from 'react-router-bootstrap'
import { Row, Label, Col, Button, Table, FormControl, Glyphicon, Panel } from 'react-bootstrap'

import ActiveDeploymentViewer from '../containers/ActiveDeploymentViewer'
import ConfirmModal from '../../common/components/ConfirmModal'
import EditableTextField from '../../common/components/EditableTextField'
import { getComponentMessages, getMessage } from '../../common/util/config'

export default class DeploymentsPanel extends Component {
  static propTypes = {
    deployments: PropTypes.array,
    deleteDeploymentConfirmed: PropTypes.func,
    deploymentsRequested: PropTypes.func,
    onNewDeploymentClick: PropTypes.func,
    newDeploymentNamed: PropTypes.func,
    updateDeployment: PropTypes.func,
    expanded: PropTypes.bool
  }

  componentWillMount () {
    if (this.props.expanded) {
      this.props.deploymentsRequested()
    }
  }

  _onDeleteDeployment = (deployment) => {
    this.refs.confirmModal.open({
      title: 'Delete Deployment?',
      body: `Are you sure you want to delete the deployment ${deployment.name}?`,
      onConfirm: () => {
        console.log('OK, deleting')
        this.props.deleteDeploymentConfirmed(deployment)
      }
    })
  }

  render () {
    const deployment = this.props.deployments && this.props.deployments.find(d => d.id && d.id === this.props.activeSubComponent)
    if (deployment) {
      return (
        <ActiveDeploymentViewer
          project={this.props.project}
          deployment={deployment}
          feedSources={this.props.project.feedSources} />
      )
    }
    return (
      <Row>
        <ConfirmModal ref='confirmModal' />
        <Col xs={9}>
          <DeploymentsList
            deleteDeployment={this._onDeleteDeployment}
            {...this.props} />
        </Col>
        <Col xs={3}>
          <Panel header={<h3>Deploying feeds to OTP</h3>}>
            <p>A collection of feeds can be deployed to OpenTripPlanner (OTP) instances that have been defined in the organization settings.</p>
            <LinkContainer to={`/project/${this.props.project.id}/settings/deployment`}>
              <Button block bsStyle='primary'>
                <Icon type='cog' /> Edit deployment settings
              </Button>
            </LinkContainer>
          </Panel>
        </Col>
      </Row>
    )
  }
}

class DeploymentsList extends Component {
  _onChangeSearch = evt => this.props.searchTextChanged(evt.target.value)

  render () {
    const messages = getComponentMessages('DeploymentsPanel')
    return (
      <Panel
        header={
          <Row>
            <Col xs={4}>
              <FormControl
                placeholder={getMessage(messages, 'search')}
                onChange={this._onChangeSearch} />
            </Col>
            <Col xs={8}>
              <Button
                bsStyle='success'
                // disabled={projectEditDisabled}
                className='pull-right'
                onClick={this.props.onNewDeploymentClick}>
                <Glyphicon glyph='plus' /> {getMessage(messages, 'new')}
              </Button>
            </Col>
          </Row>
        }>
        <Table striped hover fill>
          <thead>
            <tr>
              <th className='col-md-4'>{getMessage(messages, 'table.name')}</th>
              <th>{getMessage(messages, 'table.creationDate')}</th>
              <th>{getMessage(messages, 'table.deployedTo')}</th>
              <th>{getMessage(messages, 'table.feedCount')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.props.deployments
              ? this.props.deployments.map((deployment, index) => (
                <DeploymentListItem
                  key={deployment.id || 'new-deployment-' + Math.random()}
                  deployment={deployment}
                  {...this.props} />
              ))
              : null
            }
          </tbody>
        </Table>
      </Panel>
    )
  }
}

class DeploymentListItem extends Component {
  _onChangeName = (name) => {
    const {deployment, newDeploymentNamed, updateDeployment} = this.props
    if (deployment.isCreating) newDeploymentNamed(name)
    else updateDeployment(deployment, {name})
  }

  _onClickDelete = () => this.props.deleteDeployment(this.props.deployment)

  render () {
    const {deployment} = this.props
    const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    return (
      <tr>
        <td>
          <EditableTextField
            isEditing={(deployment.isCreating === true)}
            value={deployment.name}
            onChange={this._onChangeName}
            link={`/project/${deployment.project.id}/deployments/${deployment.id}`} />
        </td>
        <td>
          {deployment.dateCreated
            ? <span>
              {moment(deployment.dateCreated).format('MMM Do YYYY')}
              {' '}
              ({moment(deployment.dateCreated).fromNow()})
            </span>
            : na
          }
        </td>
        <td>
          {deployment.deployedTo
            ? (<Label>{deployment.deployedTo}</Label>)
            : na
          }
        </td>
        <td>
          {deployment.feedVersions
            ? (<span>{deployment.feedVersions.length}</span>)
            : na
          }
        </td>
        <td>
          <Button
            bsStyle='danger'
            bsSize='xsmall'
            className='pull-right'
            onClick={this._onClickDelete}>
            <Glyphicon glyph='remove' />
          </Button>
        </td>
      </tr>
    )
  }
}
