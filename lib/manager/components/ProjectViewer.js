// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Tabs,
  Tab,
  Grid,
  Row,
  Col,
  Button,
  ListGroup,
  ListGroupItem,
  Glyphicon,
  ButtonToolbar,
  Panel
} from 'react-bootstrap'
import {browserHistory, Link} from 'react-router'
import {shallowEqual} from 'react-pure-render'

import * as deploymentActions from '../actions/deployments'
import * as feedsActions from '../actions/feeds'
import * as projectsActions from '../actions/projects'
import Loading from '../../common/components/Loading'
import ManagerPage from '../../common/components/ManagerPage'
import WatchButton from '../../common/containers/WatchButton'
import {getComponentMessages, getConfigProperty, isModuleEnabled} from '../../common/util/config'
import DeploymentsPanel from '../containers/DeploymentsPanel'
import FeedSourceTable from '../containers/FeedSourceTable'
import type {Props as ContainerProps} from '../containers/ActiveProjectViewer'
import type {Feed, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import CreateFeedSource from './CreateFeedSource'
import ProjectSettings from './ProjectSettings'
import LabelPanel from './LabelPanel'

type Props = ContainerProps & {
  activeComponent: ?string,
  activeSubComponent: ?string,
  createFeedSource: typeof feedsActions.createFeedSource,
  deleteProject: typeof projectsActions.deleteProject,
  deployPublic: typeof projectsActions.deployPublic,
  fetchProjectDeployments: typeof deploymentActions.fetchProjectDeployments,
  isFetching: boolean,
  onProjectViewerMount: typeof projectsActions.onProjectViewerMount,
  project: Project,
  projectId: string,
  updateProject: typeof projectsActions.updateProject,
  user: ManagerUserState
}

type State = {
  createMode?: boolean
}

export default class ProjectViewer extends Component<Props, State> {
  messages = getComponentMessages('ProjectViewer')
  state = {}

  _selectTab = (key: string) => {
    const {id} = this.props.project
    if (key === 'sources') {
      browserHistory.push(`/project/${id}/`)
    } else {
      browserHistory.push(`/project/${id}/${key}`)
    }
  }

  shouldComponentUpdate (newProps: Props, nextState: State) {
    return !shallowEqual(newProps, this.props) || !shallowEqual(nextState, this.state)
  }

  componentWillMount () {
    const {onProjectViewerMount, projectId} = this.props
    onProjectViewerMount(projectId)
  }

  _renderDeploymentsTab = () => {
    const {activeComponent, activeSubComponent, project} = this.props
    return isModuleEnabled('deployment') && (
      <Tab
        disabled={this._isProjectEditDisabled()}
        eventKey='deployments'
        title={
          <span><Glyphicon className='icon-link' glyph='globe' />
            <span className='hidden-xs'>{this.messages('deployments')}</span>
          </span>
        }>
        <DeploymentsPanel
          activeSubComponent={activeSubComponent}
          expanded={activeComponent === 'deployments'}
          project={project}
        />
      </Tab>
    )
  }

  _renderPublicFeeds = () => {
    const s3Bucket = getConfigProperty('application.data.gtfs_s3_bucket')
    const publicFeedsLink = s3Bucket &&
      `https://s3.amazonaws.com/${s3Bucket}/public/index.html`
    return isModuleEnabled('enterprise') && !this._isProjectEditDisabled() &&
      <div style={{marginBottom: '20px'}}>
        <Button
          block
          bsStyle='primary'
          onClick={this._onClickDeploy}
          style={{marginBottom: '5px'}}>
          <Icon type='users' /> {this.messages('makePublic')}
        </Button>
        {s3Bucket &&
          <p className='small'>
            <strong>{this.messages('note')}</strong>{' '}
            {this.messages('publicViewed')}
            <a href={publicFeedsLink} target='_blank'>{this.messages('here')}</a>.
          </p>
        }
      </div>
  }

  _isProjectEditDisabled = () => {
    const {project, user} = this.props
    return !user.permissions ||
      !user.permissions.isProjectAdmin(project.id, project.organizationId)
  }

  _isWatchingProject = () => {
    const {project, user} = this.props
    return user.subscriptions &&
      user.subscriptions.hasProjectSubscription(project.id, 'project-updated')
  }

  _onClickDeploy = () => this.props.deployPublic(this.props.project)

  _toggleCreateView = () => { this.setState({ createMode: !this.state.createMode }) }

  render () {
    const {
      activeComponent,
      activeSubComponent,
      createFeedSource,
      isFetching,
      project,
      user
    } = this.props
    if (activeComponent !== 'deployment' && isFetching && !project) {
      // Show spinner if fetching (and the project hasn't loaded yet).
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <h1
              className='text-center'
              style={{marginTop: '150px'}}>
              <Loading />
            </h1>
          </Grid>
        </ManagerPage>
      )
    }
    if (!project) {
      // If not fetching, but no project was found, show project not found view.
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <Row>
              <Col xs={12}>
                <p className='project-not-found'>
                  {this.messages('noProjectFound')} <strong>{this.props.projectId}</strong>
                </p>
                <p><Link to='/project'>{this.messages('returnToProjects')}</Link></p>
              </Col>
            </Row>
          </Grid>
        </ManagerPage>
      )
    }
    const projectEditDisabled = this._isProjectEditDisabled()
    return (
      <ManagerPage ref='page' title={project.name}>
        <Grid fluid>
          <Row className='project-header'>
            <Col xs={12}>
              <h3>
                <Icon className='icon-link' type='folder-open-o' />
                <Link to={`/project/${project.id}`}>{project.name}</Link>
                <ButtonToolbar className={`pull-right`}>
                  {getConfigProperty('application.notifications_enabled') ? <WatchButton
                    isWatching={this._isWatchingProject()}
                    subscriptionType='project-updated'
                    target={project.id}
                    user={user}
                  /> : null}
                </ButtonToolbar>
              </h3>
              <ul
                className='list-unstyled list-inline small'
                style={{ marginBottom: '0px' }}
              >
                <li>
                  <Icon type='cloud-download' />{' '}
                  {project.autoFetchFeeds
                    ? `${project.autoFetchHour}:${
                      project.autoFetchMinute < 10
                        ? '0' + project.autoFetchMinute
                        : project.autoFetchMinute
                    }`
                    : this.messages('autoFetchDisabled')}
                </li>
              </ul>
            </Col>
          </Row>
          <Tabs
            activeKey={activeComponent || 'sources'}
            id='project-viewer-tabs'
            mountOnEnter
            onSelect={this._selectTab}
          >
            <Tab
              eventKey='sources'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='list' />
                  <span className='hidden-xs'>
                    {this.messages('feeds.title')}
                  </span>
                </span>
              }
            >
              <Row>
                <Col sm={10} xs={12}>
                  {this.state.createMode ? (<CreateFeedSource
                    createFeedSource={createFeedSource}
                    onCancel={this._toggleCreateView}
                    projectId={project.id}
                  />) : (<FeedSourceTable
                    onNewFeedSourceClick={this._toggleCreateView}
                    project={project}
                  />
                  )}
                </Col>
                <Col sm={2} xs={12}>
                  {this._renderPublicFeeds()}
                  <ProjectSummaryPanel
                    feedSources={project.feedSources || []}
                    project={project}
                  />
                  <ExplanatoryPanel project={project} />
                  <LabelPanel project={project} user={user} />
                </Col>
              </Row>
            </Tab>
            {this._renderDeploymentsTab()}
            <Tab
              disabled={projectEditDisabled}
              eventKey='settings'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='cog' />
                  <span className='hidden-xs'>{this.messages('settings')}</span>
                </span>
              }
            >
              {// Prevent rendering component if not active to ensure that
              // keyboard listener is not active while form is not visible.
                activeComponent === 'settings' && (
                  <ProjectSettings
                    activeSettingsPanel={activeSubComponent}
                    projectEditDisabled={projectEditDisabled}
                    {...this.props}
                  />
                )}
            </Tab>
          </Tabs>
        </Grid>
      </ManagerPage>
    )
  }
}

class ProjectSummaryPanel extends Component<{feedSources: Array<Feed>, project: Project}> {
  messages = getComponentMessages('ProjectSummaryPanel')

  render () {
    const { feedSources, project } = this.props
    const errorCount = feedSources
      .map(fs => fs.latestValidation ? fs.latestValidation.errorCount : 0)
      .reduce((a, b) => a + b, 0)
    // FIXME
    const serviceSeconds = feedSources
      .map(fs => fs.latestValidation ? fs.latestValidation.avgDailyRevenueTime : 0)
      .reduce((a, b) => a + b, 0)
    return (
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>{project.name} {this.messages('summary')}</Panel.Title></Panel.Heading>
        <ListGroup>
          <ListGroupItem>{this.messages('numberOfFeeds')} {feedSources.length}</ListGroupItem>
          <ListGroupItem>{this.messages('totalErrors')} {errorCount}</ListGroupItem>
          <ListGroupItem>
            {this.messages('totalService')}{' '}
            {Math.floor(serviceSeconds / 60 / 60 * 100) / 100}{' '}
            {this.messages('hoursPerWeekday')}
          </ListGroupItem>
        </ListGroup>
      </Panel>
    )
  }
}

const ExplanatoryPanel = ({ project }) => {
  const messages = getComponentMessages('ProjectViewer')

  // If project has more than 3 labels, hide the feed source instruction
  if (project.labels.length <= 3) {
    return (
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>{messages('feedSourceTitle')}</Panel.Title></Panel.Heading>
        <Panel.Body>
          {messages('feedSourceDesc')}
        </Panel.Body>
      </Panel>
    )
  }

  return <div />
}
