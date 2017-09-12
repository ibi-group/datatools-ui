import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import moment from 'moment'
import { LinkContainer } from 'react-router-bootstrap'
import { Row, Col, Button, Table, FormControl, Panel, Glyphicon, Badge, ButtonToolbar, DropdownButton, MenuItem, Label } from 'react-bootstrap'
import { Link } from 'react-router'

import Loading from '../../common/components/Loading'
import EditableTextField from '../../common/components/EditableTextField'
import { versionsSorter } from '../../common/util/util'
import { getComponentMessages, getMessage } from '../../common/util/config'
import DeploymentPreviewButton from './DeploymentPreviewButton'

export default class DeploymentViewer extends Component {
  static propTypes = {
    addFeedVersion: PropTypes.func,
    deleteFeedVersion: PropTypes.func,
    deployment: PropTypes.object,
    updateDeployment: PropTypes.func,
    deployToTargetClicked: PropTypes.func,
    downloadDeployment: PropTypes.func,
    feedSources: PropTypes.array,
    project: PropTypes.object,
    searchTextChanged: PropTypes.func,
    updateVersionForFeedSource: PropTypes.func,
    user: PropTypes.object
  }

  _onAddFeedSource = (evt) => {
    const feed = this.props.feedSources.find(fs => fs.id === evt)
    this.props.addFeedVersion(this.props.deployment, {id: feed.latestVersionId})
  }

  _onChangeSearch = evt => this.props.searchTextChanged(evt.target.value)

  _onChangeName = (name) => this.props.updateDeployment(this.props.deployment, {name})

  _onClickDownload = () => this.props.downloadDeployment(this.props.deployment)

  _onSelectTarget = (value) => this.props.deployToTargetClicked(this.props.deployment, value)

  render () {
    const {
      deleteFeedVersion,
      deployment,
      feedSources,
      project,
      updateVersionForFeedSource,
      user
    } = this.props
    const {feedVersions} = deployment
    if (!deployment || !project || !feedSources) {
      return <Loading />
    }
    const deployableFeeds = feedSources
      ? feedSources.filter(fs =>
        feedVersions && feedVersions.findIndex(v => v.feedSource.id === fs.id) === -1 &&
        fs.deployable &&
        fs.latestValidation
      )
      : []
    const messages = getComponentMessages('DeploymentViewer')
    const versions = feedVersions ? feedVersions.sort(versionsSorter) : []
    return (
      <div>
        <Row>
          <Col xs={12}>
            <div>
              <ButtonToolbar className='pull-right'>
                <Button
                  bsStyle='default'
                  onClick={this._onClickDownload}>
                  <span><Glyphicon glyph='download' /> {getMessage(messages, 'download')}</span>
                </Button>
                <DropdownButton
                  bsStyle='primary'
                  id='deploy-server-dropdown'
                  disabled={!project.otpServers || !project.otpServers.length}
                  title={project.otpServers && project.otpServers.length
                    ? <span><Glyphicon glyph='globe' /> {getMessage(messages, 'deploy')}</span>
                    : <span>{getMessage(messages, 'noServers')}</span>
                  }
                  onSelect={this._onSelectTarget}>
                  {project.otpServers
                    ? project.otpServers.map((server, i) => (
                      <MenuItem key={i} eventKey={server.name}>{server.name}</MenuItem>
                    ))
                    : null
                  }
                </DropdownButton>
              </ButtonToolbar>
              <h2>
                <LinkContainer to={`/project/${project.id}/deployments`}>
                  <Button>
                    <Icon type='reply' /> Back to list
                  </Button>
                </LinkContainer>
                <EditableTextField
                  inline
                  style={{marginLeft: '5px'}}
                  value={deployment.name}
                  onChange={this._onChangeName} />
                {deployment.deployedTo
                  ? <span>
                    <Label>{deployment.deployedTo}</Label>
                    {' '}
                    <DeploymentPreviewButton deployment={deployment} />
                  </span>
                  : null
                }
              </h2>
            </div>
          </Col>
        </Row>
        <Panel
          header={(<h3><Glyphicon glyph='list' /> {getMessage(messages, 'versions')}</h3>)}
          collapsible
          defaultExpanded>
          <Row>
            <Col xs={8} sm={6} md={4}>
              <FormControl
                type='text'
                placeholder={getMessage(messages, 'search')}
                onChange={this._onChangeSearch} />
            </Col>
            <Col xs={4} sm={6} md={8}>
              <DropdownButton
                bsStyle='primary'
                id='add-feedsource-button'
                className='pull-right'
                disabled={!deployableFeeds.length}
                title={deployableFeeds.length ? <span><Glyphicon glyph='plus' /> {getMessage(messages, 'addFeedSource')}</span> : <span>{getMessage(messages, 'allFeedsAdded')}</span>}
                onSelect={this._onAddFeedSource}>
                {deployableFeeds.map((fs, i) => (
                  <MenuItem MenuItem key={i} eventKey={fs.id}>{fs.name}</MenuItem>
                ))}
              </DropdownButton>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <Table striped hover fill>
                <thead>
                  <tr>
                    <th className='col-md-4'>{getMessage(messages, 'table.name')}</th>
                    <th>Version</th>
                    <th className='hidden-xs'>{getMessage(messages, 'table.dateRetrieved')}</th>
                    <th className='hidden-xs'>{getMessage(messages, 'table.loadStatus')}</th>
                    <th className='hidden-xs'>{getMessage(messages, 'table.errorCount')}</th>
                    <th className='hidden-xs'>{getMessage(messages, 'table.routeCount')}</th>
                    <th className='hidden-xs'>{getMessage(messages, 'table.tripCount')}</th>
                    <th className='hidden-xs'>{getMessage(messages, 'table.stopTimesCount')}</th>
                    <th>{getMessage(messages, 'table.validFrom')}</th>
                    <th>{getMessage(messages, 'table.expires')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => {
                    return <FeedVersionTableRow
                      feedSource={version.feedSource}
                      version={version}
                      project={deployment.project}
                      deployment={deployment}
                      key={version.id}
                      user={user}
                      updateVersionForFeedSource={updateVersionForFeedSource}
                      deleteFeedVersionClicked={deleteFeedVersion} />
                  })}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Panel>
      </div>
    )
  }
}

class FeedVersionTableRow extends Component {
  static propTypes = {
    deleteFeedVersionClicked: PropTypes.func,
    deployment: PropTypes.object,
    feedSource: PropTypes.object,
    project: PropTypes.object,
    updateVersionForFeedSource: PropTypes.func,
    user: PropTypes.object,
    version: PropTypes.object
  }

  _decrementVersion = () => {
    const {deployment, feedSource, updateVersionForFeedSource, version} = this.props
    updateVersionForFeedSource(deployment, feedSource, {id: version.previousVersionId})
  }

  _incrementVersion = () => {
    const {deployment, feedSource, updateVersionForFeedSource, version} = this.props
    updateVersionForFeedSource(deployment, feedSource, {id: version.nextVersionId})
  }

  _removeVersion = () => {
    const {deleteFeedVersionClicked, deployment, version} = this.props
    deleteFeedVersionClicked(deployment, version)
  }

  render () {
    const {
      feedSource,
      project,
      user,
      version
    } = this.props
    const result = version.validationResult
    const na = (<span style={{ color: 'lightGray' }}>N/A</span>)
    const hasVersionStyle = {cursor: 'pointer'}
    const noVersionStyle = {color: 'lightGray'}
    const disabled = !user.permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'manage-feed')
    return (
      <tr key={feedSource.id}>
        <td>
          <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link>
        </td>
        <td className='col-md-1 col-xs-3'>
          <Link to={`/feed/${feedSource.id}/version/${version.version - 1}`}>Version {version.version}</Link>
          <ButtonToolbar>
            <Button
              bsSize='xsmall'
              bsStyle='default'
              style={{color: 'black'}}
              disabled={!version.previousVersionId}
              onClick={this._decrementVersion}>
              <Glyphicon
                glyph='menu-left'
                style={version.previousVersionId ? hasVersionStyle : noVersionStyle}
                title={version.previousVersionId ? 'Previous version' : 'No previous versions'}
                alt='Previous version' />
            </Button>
            <Button
              bsSize='xsmall'
              bsStyle='default'
              style={{color: 'black'}}
              disabled={!version.nextVersionId}
              onClick={this._incrementVersion}>
              <Glyphicon
                glyph='menu-right'
                style={version.nextVersionId ? hasVersionStyle : noVersionStyle}
                title={version.nextVersionId ? 'Next version' : 'No newer versions'}
                alt='Next Version' />
            </Button>
          </ButtonToolbar>
        </td>
        <td className='hidden-xs'>
          {na}
        </td>
        <td className='hidden-xs'>
          <Badge>{result.loadStatus}</Badge>
        </td>
        <td className='hidden-xs'>{result.errorCount}</td>
        <td className='hidden-xs'>{result.routeCount}</td>
        <td className='hidden-xs'>{result.tripCount}</td>
        <td className='hidden-xs'>{result.stopTimesCount}</td>
        <td>{moment(result.startDate).format('MMM Do YYYY')} ({moment(result.startDate).fromNow()})</td>
        <td>{moment(result.endDate).format('MMM Do YYYY')} ({moment(result.endDate).fromNow()})</td>
        <td>
          <Button
            bsStyle='danger'
            bsSize='xsmall'
            disabled={disabled}
            className='pull-right'
            onClick={this._removeVersion}>
            <Glyphicon glyph='remove' />
          </Button>
        </td>
      </tr>
    )
  }
}
