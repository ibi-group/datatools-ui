// @flow

import React, {Component, type Node} from 'react'
import {Alert as BootstrapAlert, Button, Glyphicon, Modal} from 'react-bootstrap'
import {Map, TileLayer, Rectangle} from 'react-leaflet'
import polygon from 'turf-polygon'
import area from '@turf/area'

import * as deploymentActions from '../../actions/deployments'
import {getComponentMessages} from '../../../common/util/config'
import {defaultTileLayerProps} from '../../../common/util/maps'
import {boundsContainNaN} from '../../../editor/util/map'
import {getServerForId} from '../../util/deployment'
import {getFeedNames, versionHasExpired} from '../../util/version'
import type {Deployment, Project, SummarizedFeedVersion} from '../../../types'

type Props = {
  deployToTarget: typeof deploymentActions.deployToTarget,
  deployment: Deployment,
  oldDeployment: ?Deployment,
  onClose: () => void,
  project: Project,
  target: string
}

type State = {
  isDeployed?: boolean
}

const BOUNDS_LIMIT = 10 // Limit for the decimal degrees span

export default class DeploymentConfirmModal extends Component<Props, State> {
  messages = getComponentMessages('DeploymentConfirmModal')
  state = {}

  _onClickDeploy = () => {
    const {deployment, deployToTarget, target} = this.props
    deployToTarget(deployment, target)
    this.setState({isDeployed: true})
  }

  _onClose = () => this.props.onClose()

  render () {
    const {Body, Footer, Header, Title} = Modal
    const {deployment, oldDeployment, project, target} = this.props
    const {isDeployed} = this.state
    const isMissingFeeds = deployment.feedVersions.length === 0
    const isMissingBounds = !deployment.projectBounds
    const {east, north, south, west} = deployment.projectBounds || {east: 10, north: 10, west: -10, south: -10}
    const boundsTooLarge = east - west > BOUNDS_LIMIT || north - south > BOUNDS_LIMIT
    const bounds = [[north, east], [south, west]]
    let deploymentAreaKm = 0
    if (!isMissingBounds) {
      const boundsPolygon = polygon([[[north, east], [north, west], [south, west], [south, east], [north, east]]])
      const boundsArea: number = area(boundsPolygon)
      deploymentAreaKm = (boundsArea / (1000 * 1000)).toFixed(3)
    }
    const deploymentIsDisabled = isDeployed || boundsTooLarge || isMissingBounds || isMissingFeeds
    const expiredFeeds: Array<SummarizedFeedVersion> = deployment.feedVersions.filter(versionHasExpired)
    const server = getServerForId(target, project)
    return (
      <Modal show onHide={this._onClose}>
        <Header>
          <Title>
            {this.messages('deploy')} {deployment.name}{' '}
            {this.messages('to')} {server ? server.name : target}?
          </Title>
        </Header>
        <Body>
          <h3>Deployment Settings</h3>
          <ul className='list-unstyled'>
            <li>
              <Glyphicon glyph='fullscreen' />{' '}OSM bounds:{' '}
              {isMissingBounds
                ? this.messages('invalidBounds')
                : `${south.toFixed(6)}, ${west.toFixed(6)} ${this.messages('to')} ${north.toFixed(6)}, ${east.toFixed(6)} (${deploymentAreaKm} sq. km)`
              }
            </li>
            <li>
              <Glyphicon glyph='list' />{' '}Deploying {deployment.feedVersions.length} feeds:{' '}
              {getFeedNames(deployment.feedVersions)}
            </li>
          </ul>
          <h3>OpenTripPlanner Settings</h3>
          <ul className='list-unstyled'>
            <li data-test-id='deployment-router-id'>
              Router ID: {deployment.routerId || '[default]'}
            </li>
            <li>Build config: {deployment.customBuildConfig ? 'custom' : 'default'}</li>
            <li>Router config: {deployment.customRouterConfig ? 'custom' : 'default'}</li>
          </ul>
          {!boundsContainNaN(bounds) && <Map
            ref='map'
            bounds={bounds}
            scrollWheelZoom={false}
            style={{width: '100%', height: '300px'}}>
            <TileLayer {...defaultTileLayerProps()} />
            {!isMissingBounds &&
              <Rectangle
                bounds={bounds}
                fillOpacity={0} />
            }
          </Map>}
          {isMissingFeeds &&
            <DeploymentConfirmModalAlert
              type='danger'
              label={this.messages('alert.missingFeeds')} />
          }
          {isMissingBounds &&
            <DeploymentConfirmModalAlert
              type='danger'
              label={this.messages('alert.missingBounds')} />
          }
          {boundsTooLarge &&
            <DeploymentConfirmModalAlert
              type='danger'
              label={this.messages('alert.boundsTooLarge')} />
          }
          {expiredFeeds.length > 0 &&
            <DeploymentConfirmModalAlert
              label={`${this.messages('alert.expiredFeeds')}: ${getFeedNames(expiredFeeds)}`}
            />
          }
          {/* Show succces alert. */}
          {isDeployed && oldDeployment &&
            <DeploymentConfirmModalAlert type='success' label={this.messages('alert.success')} />
          }
          {/* Warn that there is already a deployment to this router. */}
          {!isDeployed && oldDeployment &&
            <DeploymentConfirmModalAlert label={
              <span>
                <strong>{oldDeployment.name}</strong>{' '}
                {this.messages('alert.alreadyDeployed')}<br />
                EC2 instance(s):{' '}
                {server && server.ec2Instances
                  ? server.ec2Instances
                    .filter(instance => instance.state.name === 'running')
                    .map(instance => instance.instanceId)
                    .join(', ')
                  : null
                }
              </span>
            } />
          }
        </Body>
        <Footer>
          <Button
            bsStyle='primary'
            data-test-id='confirm-deploy-server-button'
            disabled={deploymentIsDisabled}
            onClick={this._onClickDeploy}
          >
            {this.messages('deploy')}
          </Button>
          <Button
            onClick={this._onClose}>
            {isDeployed
              ? this.messages('close')
              : this.messages('cancel')
            }
          </Button>
        </Footer>
      </Modal>
    )
  }
}

type DeploymentConfirmModalAlertProps = {
  label: Node,
  type?: 'danger' | 'success' | 'warning'
}

class DeploymentConfirmModalAlert extends Component<DeploymentConfirmModalAlertProps> {
  messages = getComponentMessages('DeploymentConfirmModalAlert')

  render () {
    const {type, label} = this.props
    return (
      <BootstrapAlert
        style={{marginTop: '15px', marginBottom: '0px'}}
        bsStyle={type}>
        <strong>{this.messages(type || 'warning')}</strong>{' '}
        {label}
      </BootstrapAlert>
    )
  }
}
