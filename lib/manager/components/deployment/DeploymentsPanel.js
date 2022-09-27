// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import {
  Button,
  Checkbox,
  Col,
  ControlLabel,
  Glyphicon,
  HelpBlock,
  FormControl,
  FormGroup,
  Label as BsLabel,
  Panel,
  Row,
  Table
} from 'react-bootstrap'
import Select from 'react-select'

import * as deploymentActions from '../../actions/deployments'
import * as projectsActions from '../../actions/projects'
import ActiveDeploymentViewer from '../../containers/ActiveDeploymentViewer'
import ConfirmModal from '../../../common/components/ConfirmModal'
import EditableTextField from '../../../common/components/EditableTextField'
import Loading from '../../../common/components/Loading'
import {AUTO_DEPLOY_TYPES} from '../../../common/constants'
import {getComponentMessages} from '../../../common/util/config'
import {formatTimestamp, fromNow} from '../../../common/util/date-time'
import {deploymentsComparator, getServerDeployedTo} from '../../util/deployment'
import type {Props as ContainerProps} from '../../containers/DeploymentsPanel'
import type {Deployment, Project, ReactSelectOption} from '../../../types'

type Props = ContainerProps & {
  createDeployment: typeof deploymentActions.createDeployment,
  deleteDeployment: typeof deploymentActions.deleteDeployment,
  saveDeployment: typeof deploymentActions.saveDeployment,
  updateDeployment: typeof deploymentActions.updateDeployment,
  updateProject: typeof projectsActions.updateProject
}

export default class DeploymentsPanel extends Component<Props> {
  messages = getComponentMessages('DeploymentsPanel')

  _updateProject = (updates: any) => {
    const {project, updateProject} = this.props
    updateProject(project.id, updates, true)
  }

  _onChangePinned = (option: ReactSelectOption) => {
    this._updateProject({pinnedDeploymentId: option ? option.value : null})
  }

  _onToggleAutoDeploy = (options: Array<ReactSelectOption>) => {
    this._updateProject({autoDeployTypes: options.map(o => o.value)})
  }

  _onChangeDeployWithCriticalErrors = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this._updateProject({
      autoDeployWithCriticalErrors: !this.props.project.autoDeployWithCriticalErrors
    })
  }

  _onDeleteDeployment = (deployment: Deployment) => {
    this.refs.confirmModal.open({
      title: 'Delete Deployment?',
      body: `Are you sure you want to delete the deployment ${deployment.name}?`,
      onConfirm: () => this.props.deleteDeployment(deployment)
    })
  }

  render () {
    const {
      activeSubComponent: deploymentId,
      createDeployment,
      project,
      saveDeployment,
      updateDeployment
    } = this.props
    const {deployments = [], pinnedDeploymentId} = project
    // Deployment is selected, but deployments have not finished loading.
    if (deploymentId && !deployments) return <Loading />
    // FIXME don't sort this on every render
    deployments.sort((a, b) => deploymentsComparator(a, b, pinnedDeploymentId))
    const deployment = deployments.find(d => d.id && d.id === deploymentId)
    // Deployment is selected and found in list.
    if (deployment) {
      return (
        <ActiveDeploymentViewer
          deployment={deployment}
          feedSources={project.feedSources}
          project={project} />
      )
    }
    return (
      <Row>
        <ConfirmModal ref='confirmModal' />
        <Col md={9} sm={12}>
          <DeploymentsList
            createDeployment={createDeployment}
            deleteDeployment={this._onDeleteDeployment}
            deployments={deployments}
            project={project}
            saveDeployment={saveDeployment}
            updateDeployment={updateDeployment} />
        </Col>
        <Col md={3} sm={12}>
          <Panel>
            <Panel.Heading><Panel.Title componentClass='h3'><Icon type='rocket' /> {this.messages('autoDeploy.title')}</Panel.Title></Panel.Heading>
            <Panel.Body>
              <FormGroup controlId='pinnedDeploymentId'>
                <ControlLabel>
                  <Icon type='thumb-tack' />{' '}
                  {this.messages('pinnedDeployment.label')}
                </ControlLabel>
                <Select
                  name='pinnedDeploymentId'
                  onChange={this._onChangePinned}
                  options={deployments.map(d => ({label: d.name, value: d.id}))}
                  placeholder={this.messages('pinnedDeployment.placeholder')}
                  value={project.pinnedDeploymentId}
                />
                <HelpBlock>{this.messages('pinnedDeployment.help')}</HelpBlock>
              </FormGroup>
              <FormGroup controlId='autoDeployTypes'>
                <ControlLabel>
                  <Icon type='bolt' />{' '}
                  {this.messages('autoDeploy.label')}
                </ControlLabel>
                <Select
                  multi
                  name='autoDeployTypes'
                  onChange={this._onToggleAutoDeploy}
                  options={Object.values(AUTO_DEPLOY_TYPES).map(t => ({
                  // Satisfy flow with typeof check. Ugh.
                    label: typeof t === 'string'
                      ? this.messages(`autoDeploy.types.${t}`)
                      : t,
                    value: t
                  }))}
                  placeholder={this.messages('autoDeploy.placeholder')}
                  value={project.autoDeployTypes}
                />
                <HelpBlock>{this.messages('autoDeploy.help')}</HelpBlock>
              </FormGroup>
              <FormGroup controlId='autoDeployWithCriticalErrors'>
                <ControlLabel>
                  <Icon type='warning' />{' '}
                  {this.messages('autoDeploy.deployWithErrors.title')}
                </ControlLabel>
                <Checkbox
                  checked={project.autoDeployWithCriticalErrors}
                  name='autoDeployWithCriticalErrors'
                  onChange={this._onChangeDeployWithCriticalErrors}
                >
                  {this.messages('autoDeploy.deployWithErrors.checklabel')}
                </Checkbox>
                <HelpBlock>
                  {this.messages('autoDeploy.deployWithErrors.help')}
                </HelpBlock>
              </FormGroup>
            </Panel.Body>
          </Panel>
          <Panel>
            <Panel.Heading><Panel.Title componentClass='h3'><Icon type='cog' /> {this.messages('config.title')}</Panel.Title></Panel.Heading>
            <Panel.Body>
              <p>{this.messages('config.body')}</p>
              <LinkContainer to={`/project/${project.id}/settings/deployment`}>
                <Button block>
                  <Icon type='cog' /> {this.messages('config.editSettings')}
                </Button>
              </LinkContainer>
              <LinkContainer to={`/admin/servers`}>
                <Button block>
                  <Icon type='server' /> {this.messages('config.manageServers')}
                </Button>
              </LinkContainer>
            </Panel.Body>
          </Panel>
        </Col>
      </Row>
    )
  }
}

type ListProps = {
  createDeployment: typeof deploymentActions.createDeployment,
  deleteDeployment: Deployment => void,
  deployments: Array<Deployment>,
  project: Project,
  saveDeployment: typeof deploymentActions.saveDeployment,
  updateDeployment: typeof deploymentActions.updateDeployment
}

type State = {searchText?: string}

class DeploymentsList extends Component<ListProps, State> {
  messages = getComponentMessages('DeploymentsList')
  state = {}

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({searchText: evt.target.value})

  _onClickNewDeployment = () => this.props.createDeployment(this.props.project.id)

  render () {
    const {
      deleteDeployment,
      deployments,
      project,
      saveDeployment,
      updateDeployment
    } = this.props
    const {searchText} = this.state
    // Filter deployments by search text.
    const visibleDeployments: Array<Deployment> = deployments
      .filter(({name}) =>
        name.toLowerCase().indexOf((searchText || '').toLowerCase()) !== -1
      )
    return (
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>
          <Row>
            <Col xs={4}>
              <FormControl
                onChange={this._onChangeSearch}
                placeholder={this.messages('search')} />
            </Col>
            <Col xs={8}>
              <Button
                bsStyle='success'
                className='pull-right'
                onClick={this._onClickNewDeployment}>
                <Glyphicon glyph='plus' /> {this.messages('new')}
              </Button>
            </Col>
          </Row>
        </Panel.Title></Panel.Heading>
        <Table fill hover striped>
          <thead>
            <tr>
              <th className='col-md-4'>{this.messages('table.name')}</th>
              <th>{this.messages('table.creationDate')}</th>
              <th>{this.messages('table.lastDeployed')}</th>
              <th>{this.messages('table.deployedTo')}</th>
              <th>{this.messages('table.feedCount')}</th>
              <th>{this.messages('table.testDeployment')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleDeployments.map((deployment, index) => (
              <DeploymentListItem
                deleteDeployment={deleteDeployment}
                deployment={deployment}
                key={deployment.id || 'new-deployment-' + Math.random()}
                project={project}
                saveDeployment={saveDeployment}
                updateDeployment={updateDeployment}
              />
            ))}
          </tbody>
        </Table>
      </Panel>
    )
  }
}

type RowProps = {
  deleteDeployment: Deployment => void,
  deployment: Deployment,
  project: Project,
  saveDeployment: typeof deploymentActions.saveDeployment,
  updateDeployment: typeof deploymentActions.updateDeployment
}

const NA = <span className='deployment-na'>N/A</span>

class DeploymentListItem extends Component<RowProps> {
  _renderTime = (time: ?number) => time
    ? <span title={formatTimestamp(time)}>{fromNow(time)}</span>
    : NA

  _isPinned = () => {
    const {deployment, project} = this.props
    return project.pinnedDeploymentId === deployment.id
  }

  _onChangeName = (name) => {
    const {deployment, project, saveDeployment, updateDeployment} = this.props
    if (deployment.isCreating) saveDeployment({projectId: project.id, name})
    else updateDeployment(deployment, {name})
  }

  _onClickDelete = () => this.props.deleteDeployment(this.props.deployment)

  render () {
    const {deployment, project} = this.props
    const server = getServerDeployedTo(deployment, project)
    return (
      <tr className={this._isPinned() ? 'pinned-deployment' : ''}>
        <td>
          {this._isPinned() ? <Icon type='thumb-tack' /> : null}
          <EditableTextField
            inline
            isEditing={(deployment.isCreating === true)}
            link={`/project/${deployment.projectId}/deployments/${deployment.id}`}
            onChange={this._onChangeName}
            rejectEmptyValue
            value={deployment.name}
          />
        </td>
        <td>{this._renderTime(deployment.dateCreated)}</td>
        <td>{this._renderTime(deployment.lastDeployed)}</td>
        <td>{(!deployment.ec2Instances || deployment.ec2Instances.length > 0) && server ? <BsLabel>{server.name}</BsLabel> : NA}</td>
        <td>{deployment.feedVersions ? deployment.feedVersions.length : NA}</td>
        <td>{deployment.routerId ? 'Yes' : NA}</td>
        <td>
          <Button
            bsSize='xsmall'
            bsStyle='danger'
            className='pull-right'
            onClick={this._onClickDelete}>
            <Glyphicon glyph='remove' />
          </Button>
        </td>
      </tr>
    )
  }
}
