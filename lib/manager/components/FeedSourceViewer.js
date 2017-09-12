import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Grid, Row, Col, Badge, Glyphicon, Tabs, Tab} from 'react-bootstrap'
import {Link, browserHistory} from 'react-router'

import ManagerPage from '../../common/components/ManagerPage'
import ManagerHeader from './ManagerHeader'
import ActiveFeedVersionNavigator from '../containers/ActiveFeedVersionNavigator'
import FeedSourceSettings from './FeedSourceSettings'
import NotesViewer from './NotesViewer'
import ActiveEditorFeedSourcePanel from '../../editor/containers/ActiveEditorFeedSourcePanel'
import {isModuleEnabled, getComponentMessages, getMessage} from '../../common/util/config'

export default class FeedSourceViewer extends Component {
  static propTypes = {
    feedSource: PropTypes.object,
    feedSourceId: PropTypes.string,
    feedVersionIndex: PropTypes.number,
    isFetching: PropTypes.bool,
    project: PropTypes.object,
    routeParams: PropTypes.object,
    user: PropTypes.object,
    activeComponent: PropTypes.string,
    activeSubComponent: PropTypes.string,
    componentDidUpdate: PropTypes.func,
    createDeployment: PropTypes.func,
    deleteFeedSource: PropTypes.func,
    deleteFeedVersionConfirmed: PropTypes.func,
    downloadFeedClicked: PropTypes.func,
    externalPropertyChanged: PropTypes.func,
    feedSourcePropertyChanged: PropTypes.func,
    feedVersionRenamed: PropTypes.func,
    gtfsPlusDataRequested: PropTypes.func,
    loadFeedVersionForEditing: PropTypes.func,
    newNotePostedForFeedSource: PropTypes.func,
    newNotePostedForVersion: PropTypes.func,
    notesRequestedForFeedSource: PropTypes.func,
    notesRequestedForVersion: PropTypes.func,
    onComponentMount: PropTypes.func,
    fetchFeed: PropTypes.func,
    updateUserSubscription: PropTypes.func,
    uploadFeed: PropTypes.func,
    fetchValidationResult: PropTypes.func
  }

  state = {}

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  componentDidMount () {
    this.setState({didMount: true})
  }

  componentDidUpdate (prevProps) {
    this.props.componentDidUpdate(prevProps, this.props)
    if (this.props.feedSource && this.state.didMount) {
      this.setState({didMount: false})
    }
  }

  confirmDeleteFeedSource = () => {
    const {deleteFeedSource, feedSource} = this.props
    this.refs.page.showConfirmModal({
      title: 'Delete Feed Source?',
      body: 'Are you sure you want to delete this feed source? This action cannot be undone and all feed versions will be deleted.',
      onConfirm: () => {
        deleteFeedSource(feedSource)
        .then(() => browserHistory.push(`/project/${feedSource.projectId}`))
      }
    })
  }

  _postNote = (note) => { this.props.newNotePostedForFeedSource(this.props.feedSource, note) }

  _requestNotes = () => this.props.notesRequestedForFeedSource(this.props.feedSource)

  render () {
    const {
      activeComponent,
      activeSubComponent,
      externalPropertyChanged,
      feedSource,
      feedSourcePropertyChanged,
      feedVersionIndex,
      project,
      routeParams,
      updateUserSubscription,
      user
    } = this.props
    if (this.props.isFetching && this.state.didMount) {
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <h1
              className='text-center'
              style={{marginTop: '150px'}}>
              <Icon className='fa-5x fa-spin' type='refresh' />
            </h1>
          </Grid>
        </ManagerPage>
      )
    } else if (!feedSource) {
      return (
        <ManagerPage ref='page'>
          <Grid fluid>
            <Row>
              <Col xs={12}>
                <p>No feed source found for <strong>{this.props.feedSourceId}</strong></p>
                <p><Link to='/project'>Return to list of projects</Link></p>
              </Col>
            </Row>
          </Grid>
        </ManagerPage>
      )
    }
    const messages = getComponentMessages('FeedSourceViewer')
    const disabled = !user.permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'manage-feed')
    const editDisabled = disabled && !user.permissions.hasFeedPermission(project.organizationId, project.id, feedSource.id, 'edit-gtfs')
    const activeTab = ['settings', 'comments', 'snapshots'].indexOf(activeComponent) === -1 || typeof routeParams.feedVersionIndex !== 'undefined'
      ? ''
      : activeComponent
    return (
      <ManagerPage
        // breadcrumbs={<Breadcrumbs project={project} feedSource={feedSource} />}
        ref='page'
        title={feedSource.name}>
        <Grid fluid>
          <ManagerHeader {...this.props} />
          {/* Feed Versions tab */}
          <Tabs id='feed-source-viewer-tabs'
            style={{minHeight: '400px'}}
            activeKey={activeTab}
            onSelect={(eventKey => browserHistory.push(`/feed/${feedSource.id}/${eventKey}`))}>
            <Tab eventKey='' title={<span><Icon className='icon-link' type='database' /><span className='hidden-xs'>{getMessage(messages, 'gtfs')}</span></span>}>
              <Row>
                <Col xs={12}>
                  <ActiveFeedVersionNavigator
                    routeParams={routeParams}
                    feedSource={feedSource}
                    disabled={disabled}
                    versionIndex={feedVersionIndex}
                    deleteDisabled={disabled}
                    editDisabled={editDisabled}
                    {...this.props} />
                </Col>
              </Row>
            </Tab>

            {isModuleEnabled('editor')
              ? <Tab eventKey='snapshots'
                title={
                  <span>
                    <Icon className='icon-link' type='pencil-square-o' />
                    <span className='hidden-xs'>{getComponentMessages('EditorFeedSourcePanel').title} </span>
                    <Badge>{feedSource.editorSnapshots ? feedSource.editorSnapshots.length : 0}</Badge>
                  </span>
                }>
                <ActiveEditorFeedSourcePanel project={project} feedSource={feedSource} />
              </Tab>
              : null
            }
            {/* Comments for feed source */}
            <Tab eventKey='comments'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='comment' />
                  <span className='hidden-xs'>{getComponentMessages('NotesViewer').title} </span>
                  <Badge>{feedSource.noteCount}</Badge>
                </span>
              }
              onEnter={this._requestNotes}>
              <NotesViewer
                type='feed-source'
                notes={feedSource.notes}
                feedSource={feedSource}
                user={user}
                updateUserSubscription={updateUserSubscription}
                noteCount={feedSource.noteCount}
                notesRequested={this._requestNotes}
                newNotePosted={this._postNote} />
            </Tab>
            {/* Settings */}
            <Tab
              disabled={disabled}
              eventKey='settings'
              title={
                <span>
                  <Glyphicon className='icon-link' glyph='cog' />
                  <span className='hidden-xs'>{getMessage(messages, 'properties.title')}</span>
                </span>
              }>
              <FeedSourceSettings
                activeComponent={activeComponent}
                activeSubComponent={activeSubComponent}
                confirmDeleteFeedSource={this.confirmDeleteFeedSource}
                externalPropertyChanged={externalPropertyChanged}
                feedSource={feedSource}
                feedSourcePropertyChanged={feedSourcePropertyChanged}
                project={project}
                user={user} />
            </Tab>
          </Tabs>
        </Grid>
      </ManagerPage>
    )
  }
}
