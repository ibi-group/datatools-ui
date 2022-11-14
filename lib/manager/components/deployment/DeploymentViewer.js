// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import {
  FormGroup,
  InputGroup,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Button,
  Panel,
  FormControl,
  Glyphicon,
  Badge,
  ButtonGroup,
  DropdownButton,
  MenuItem
} from 'react-bootstrap'
import {Map, TileLayer, Rectangle} from 'react-leaflet'

import * as deploymentActions from '../../actions/deployments'
import Loading from '../../../common/components/Loading'
import EditableTextField from '../../../common/components/EditableTextField'
import Title from '../../../common/components/Title'
import WatchButton from '../../../common/containers/WatchButton'
import {getComponentMessages, getConfigProperty} from '../../../common/util/config'
import {formatTimestamp, fromNow} from '../../../common/util/date-time'
import {defaultTileLayerProps} from '../../../common/util/maps'
import { versionsSorter } from '../../../common/util/util'
import {boundsContainNaN} from '../../../editor/util/map'
import {getServerDeployedTo} from '../../util/deployment'
import type {Props as ContainerProps} from '../../containers/ActiveDeploymentViewer'
import type {
  ServerJob,
  ShapefileExportType,
  SummarizedFeedVersion
} from '../../../types'
import type {ManagerUserState} from '../../../types/reducers'

import CurrentDeploymentPanel from './CurrentDeploymentPanel'
import DeploymentConfigurationsPanel from './DeploymentConfigurationsPanel'
import DeploymentConfirmModal from './DeploymentConfirmModal'
import DeploymentVersionsTable from './DeploymentVersionsTable'
import PeliasPanel from './PeliasPanel'

type Props = ContainerProps & {
  addFeedVersion: typeof deploymentActions.addFeedVersion,
  deployJobs: Array<ServerJob>,
  deployToTarget: typeof deploymentActions.deployToTarget,
  downloadBuildArtifact: typeof deploymentActions.downloadBuildArtifact,
  downloadDeployment: typeof deploymentActions.downloadDeployment,
  downloadDeploymentShapes: typeof deploymentActions.downloadDeploymentShapes,
  fetchDeployment: typeof deploymentActions.fetchDeployment,
  incrementAllVersionsToLatest: typeof deploymentActions.incrementAllVersionsToLatest,
  terminateEC2InstanceForDeployment: typeof deploymentActions.terminateEC2InstanceForDeployment,
  updateDeployment: typeof deploymentActions.updateDeployment,
  user: ManagerUserState
}

type State = {
  searchText: ?string,
  target: ?string
}

const BOUNDS_LIMIT = 10 // Limit for the decimal degrees span

export default class DeploymentViewer extends Component<Props, State> {
  messages = getComponentMessages('DeploymentViewer')
  state = {
    otp: [],
    searchText: null,
    target: null
  }

  componentDidMount () {
    const { deployment, fetchDeployment } = this.props
    // Account for the possiblity we are dealing with a deployment summary and need to fetch the
    // entire deployment
    fetchDeployment(deployment.id)
    this.resetMap()
  }

  /**
   * When the component remounts after an initial mount, the map needs to be
   * reset using Leaflet.invalidateSize so that the map tiles do not "grey out."
   *
   * Also, this re-fits the bounds to the deployment bounds.
   */
  resetMap () {
    setTimeout(() => {
      if (this.refs.map) {
        this.refs.map.leafletElement.invalidateSize()
        this.refs.map.leafletElement.fitBounds(this._getBounds())
      }
    }, 500)
  }

  _getBounds = () => {
    const {east, north, south, west} = this.props.deployment.projectBounds ||
      {east: 10, north: 10, west: -10, south: -10}
    return [[north, east], [south, west]]
  }

  _onAddFeedSource = (feedSourceId: string) => {
    const feed = this.props.feedSources.find(fs => fs.id === feedSourceId)
    const id = feed && feed.latestVersionId
    if (!id) {
      console.warn('No latest version ID found for feed', feed)
      return
    }
    this.props.addFeedVersion(this.props.deployment, {id})
  }

  _onChangeSearch = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({searchText: evt.target.value})

  _onChangeName = (name: string) => this._updateDeployment({name})

  _onClickDownload = () => this.props.downloadDeployment(this.props.deployment)

  _onClickDownloadShapes = (type: ShapefileExportType) => this.props.downloadDeploymentShapes(this.props.deployment, type)

  _onCloseModal = () => this.setState({target: null})

  _onSelectTarget = (target: string) => this.setState({target})

  _updateDeployment = (props: {[string]: any}) => {
    const {deployment, updateDeployment} = this.props
    updateDeployment(deployment, props)
  }

  _incrementAllVersionsToLatest = () => {
    const {deployment, incrementAllVersionsToLatest} = this.props
    const feedsNeedingUpdates = deployment.feedVersions.filter(
      v => !deployment.pinnedfeedVersionIds.includes(v.id) &&
        v.id !== v.feedSource.latestVersionId
    )
    const message = `Are you sure you would like to advance ${feedsNeedingUpdates.length} feed(s) to their latest versions?`
    if (window.confirm(message)) {
      incrementAllVersionsToLatest(deployment)
    }
  }

  renderHeader () {
    const {
      deployJobs,
      deployment,
      project,
      user
    } = this.props
    const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    const isWatchingDeployment = user.subscriptions &&
      user.subscriptions.hasFeedSubscription(
        project.id,
        deployment.id,
        'deployment-updated'
      )

    return (
      <div>
        <h4>
          <ButtonGroup className='pull-right'>
            <WatchButton
              isWatching={isWatchingDeployment}
              subscriptionType='deployment-updated'
              target={deployment.id}
              user={user} />
            <Button
              bsStyle='default'
              onClick={this._onClickDownload}>
              <span><Glyphicon glyph='download' /> {this.messages('download')}</span>
            </Button>
            <DropdownButton
              id='shp-export'
              onSelect={this._onClickDownloadShapes}
              title={
                <span>
                  <Icon type='file-zip-o' />
                  <span className='hidden-xs'> Export (.shp)</span>
                </span>
              }>
              <MenuItem eventKey='STOPS'><Icon type='map-marker' /> Stops</MenuItem>
              <MenuItem eventKey='ROUTES'><Icon type='ellipsis-h' /> Routes</MenuItem>
            </DropdownButton>
            <DropdownButton
              bsStyle='primary'
              disabled={!project.otpServers || !project.otpServers.length}
              id='deploy-server-dropdown'
              onSelect={this._onSelectTarget}
              pullRight
              title={project.otpServers && project.otpServers.length
                ? <span>
                  <Glyphicon glyph='globe' />{' '}
                  {this.messages('deploy')}
                </span>
                : <span>{this.messages('noServers')}</span>
              }>
              {project.otpServers
                ? project.otpServers.map((server, i) => (
                  <MenuItem
                    data-test-id={`deploy-server-${i}-button`}
                    // Disable server if the server is missing a name or
                    // has neither an internal URL or s3 bucket name.
                    // This used to check for test deployments (using the existence of deployment.feedSourceId)
                    // to avoid deploying a test deployment to a "production" router, however now that there
                    // is only one router (even for OTP1 instances) this functionality has been removed.
                    disabled={
                      deployJobs.length > 0 ||
                      !server.name ||
                      (
                        (!server.internalUrl || server.internalUrl.length === 0) &&
                        !server.s3Bucket
                      )
                    }
                    eventKey={server.id}
                    key={server.id}
                  >
                    {server.name || '[Unnamed]'}
                  </MenuItem>
                ))
                : null
              }
              {project.otpServers && <MenuItem divider />}
              <LinkContainer
                key={project.id}
                to='/admin/servers'>
                <MenuItem>
                  <Icon type='cog' /> Manage servers
                </MenuItem>
              </LinkContainer>
            </DropdownButton>
          </ButtonGroup>
          <EditableTextField
            inline
            onChange={this._onChangeName}
            style={{marginLeft: '5px'}}
            value={deployment.name} />
        </h4>
        <small title={deployment.lastDeployed && formatTimestamp(deployment.lastDeployed)}>
          <Icon type='clock-o' />
          {' '}
          Last deployed {deployment.lastDeployed ? fromNow(deployment.lastDeployed) : na}
        </small>
      </div>
    )
  }

  renderMap () {
    const { deployment } = this.props
    const isMissingBounds = !deployment.projectBounds
    const {east, north, south, west} = deployment.projectBounds ||
      {east: 10, north: 10, west: -10, south: -10}
    const boundsTooLarge = east - west > BOUNDS_LIMIT || north - south > BOUNDS_LIMIT
    const bounds = this._getBounds()

    // Flex V2 routes may have no stops and therefore have no bounds detected by
    // datatools server. The bounds will then include NaN. Since there is nothing to
    // represent, we should render nothing.
    if (boundsContainNaN(bounds)) return null
    return (
      <Map
        bounds={bounds}
        ref='map'
        scrollWheelZoom={false}
        style={{width: '100%', height: '300px'}}>
        <TileLayer {...defaultTileLayerProps()} />
        {!isMissingBounds &&
          <Rectangle
            bounds={bounds}
            // If bounds are too large, draw rectangle in red
            // (otherwise use the default path color).
            color={boundsTooLarge ? 'red' : '#3388ff'}
            fillOpacity={0} />
        }
      </Map>
    )
  }

  renderDeployentVersionsTableHeader (versions: Array<SummarizedFeedVersion>) {
    const { deployment, feedSources, project } = this.props
    const { feedVersions } = deployment
    if (!deployment || !project || !feedSources) return <Loading />
    // Only permit adding feed sources to non-feed source deployments.
    const deployableFeeds = !deployment.feedSourceId && feedSources
      ? feedSources.filter(fs =>
        // Include feed sources that are not currently added, have feed versions,
        // are marked deployable, and have been validated.
        feedVersions && feedVersions.findIndex(v => v.feedSource.id === fs.id) === -1 &&
        fs.deployable &&
        fs.latestValidation
      )
      : []
    const earliestDate = formatTimestamp(`${Math.min(...versions.map(v => +v.validationResult.startDate))}`, false)
    const latestDate = formatTimestamp(`${Math.max(...versions.map(v => +v.validationResult.endDate))}`, false)
    const feedsAreUpToDate = deployment.feedVersions.every(
      v => deployment.pinnedfeedVersionIds.includes(v.id) ||
        v.id === v.feedSource.latestVersionId
    )
    return (
      <Row>
        <Col xs={6}>
          <h4>
            <Glyphicon glyph='list' /> {this.messages('versions')}{' '}
            <Badge>{versions.length}</Badge>
            <br />
            <small>
              <Glyphicon glyph='calendar' />{' '}
              {earliestDate} {this.messages('to')} {latestDate}
            </small>
          </h4>
        </Col>
        <Col xs={6}>
          <div className='pull-right' style={{display: 'flex'}}>
            <Button
              bsStyle={feedsAreUpToDate ? 'success' : 'default'}
              disabled={feedsAreUpToDate}
              onClick={this._incrementAllVersionsToLatest}
            >
              <Icon
                type={feedsAreUpToDate ? 'check-circle-o' : 'arrow-circle-o-right'}
              />{' '}
              {feedsAreUpToDate
                ? 'All feeds up-to-date!'
                : 'Advance all feeds'
              }
            </Button>
            <FormGroup style={{marginLeft: '5px', marginBottom: 0}}>
              <InputGroup>
                <FormControl
                  className='pull-right'
                  onChange={this._onChangeSearch}
                  placeholder={this.messages('search')}
                  style={{width: '160px'}}
                  type='text' />
                <DropdownButton
                  componentClass={InputGroup.Button}
                  disabled={!deployableFeeds.length}
                  id='add-feedsource-button'
                  onSelect={this._onAddFeedSource}
                  title={deployableFeeds.length
                    ? <span>
                      <Glyphicon glyph='plus' />{' '}
                      {this.messages('addFeedSource')}
                    </span>
                    : <span>{this.messages('allFeedsAdded')}</span>
                  }>
                  {deployableFeeds.map((fs, i) => (
                    <MenuItem eventKey={fs.id} key={i} MenuItem>{fs.name}</MenuItem>
                  ))}
                </DropdownButton>
              </InputGroup>
            </FormGroup>
          </div>
        </Col>
      </Row>
    )
  }

  render () {
    const {
      deployJobs,
      deployment,
      deployToTarget,
      feedSources,
      project,
      updateDeployment
    } = this.props
    const {target} = this.state
    const {feedVersions} = deployment
    if (!deployment || !deployment.feedVersions || !deployment.deployJobSummaries || !project || !feedSources) return <Loading />
    const versions = feedVersions
      ? feedVersions
        .filter(
          version =>
            version.feedSource.name
              .toLowerCase()
              .indexOf((this.state.searchText || '').toLowerCase()) !== -1
        )
        .sort(versionsSorter)
      : []
    const serverDeployedTo = getServerDeployedTo(deployment, project)
    const oldDeployment = (target && project.deployments)
      ? project.deployments.find(d => d.deployedTo === target && deployment.routerId === d.routerId)
      : null
    const appName = getConfigProperty('application.title')
    const title = `${appName ? appName + ' - ' : ''}${deployment.name}`
    return (
      <div>
        <Title>{title}</Title>
        {target && (
          <DeploymentConfirmModal
            deployment={deployment}
            deployToTarget={deployToTarget}
            oldDeployment={oldDeployment}
            onClose={this._onCloseModal}
            project={project}
            target={target}
          />
        )}
        <Row>
          <Col sm={9}>
            <Panel >
              <Panel.Heading><Panel.Title componentClass='h3'>{this.renderHeader()}</Panel.Title></Panel.Heading>
              <Panel.Body>
                <ListGroup>
                  <ListGroupItem style={{ padding: '0px' }}>
                    {this.renderMap()}
                  </ListGroupItem>
                  <ListGroupItem>
                    {this.renderDeployentVersionsTableHeader(versions)}
                  </ListGroupItem>
                  {versions.length === 0 ? (
                    <p className='lead text-center margin-top-15'>
                      No feed sources found.
                    </p>
                  ) : (
                    <DeploymentVersionsTable
                      deployment={deployment}
                      project={project}
                      versions={versions}
                    />
                  )}
                </ListGroup>
              </Panel.Body>
            </Panel>
            {/* Pelias panel */}
            <PeliasPanel
              deployment={deployment}
              project={project}
              updateDeployment={updateDeployment}
            />
          </Col>
          <Col sm={3}>
            {/* Current deployment panel */}
            <CurrentDeploymentPanel
              deployJobs={deployJobs}
              deployment={deployment}
              downloadBuildArtifact={this.props.downloadBuildArtifact}
              fetchDeployment={this.props.fetchDeployment}
              project={project}
              server={serverDeployedTo}
              terminateEC2InstanceForDeployment={
                this.props.terminateEC2InstanceForDeployment
              }
            />
            {/* Configurations panel */}
            <DeploymentConfigurationsPanel
              deployment={deployment}
              updateDeployment={updateDeployment}
            />
          </Col>
        </Row>
      </div>
    )
  }
}
