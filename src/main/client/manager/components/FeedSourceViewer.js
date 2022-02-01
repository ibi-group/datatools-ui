import fetch  from 'isomorphic-fetch'
import React  from 'react'
import Helmet from 'react-helmet'
import { Grid, Row, Col, Button, Table, Input, Panel, Glyphicon } from 'react-bootstrap'
import { Link, browserHistory } from 'react-router'

import ManagerPage  from '../../common/components/ManagerPage'
import EditableTextField from '../../common/components/EditableTextField'
import { retrievalMethodString } from '../../common/util/util'
import ExternalPropertiesTable  from './ExternalPropertiesTable'
import FeedVersionNavigator  from './FeedVersionNavigator'
import NotesViewer from './NotesViewer'
import { isModuleEnabled, isExtensionEnabled } from '../../common/util/config'

const retrievalMethods = [
  'FETCHED_AUTOMATICALLY',
  'MANUALLY_UPLOADED',
  'PRODUCED_IN_HOUSE'
]

export default class FeedSourceViewer extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      snapshotVersions: []
    }

    if(this.props.feedSource && this.props.feedSource.retrievalMethod === 'PRODUCED_IN_HOUSE') {
      this.updateSnapshotVersions(this.props.feedSource)
    }
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  componentWillReceiveProps (nextProps) {
    if(nextProps.feedSource && nextProps.feedSource.retrievalMethod === 'PRODUCED_IN_HOUSE') {
      this.updateSnapshotVersions(nextProps.feedSource)
    }
  }

  updateSnapshotVersions (feedSource) {
    const url = DT_CONFIG.modules.editor.url + '/api/mgrsnapshot?sourceId=' + feedSource.id
    fetch(url)
      .then(res => res.json())
      .then(snapshots => {
        this.setState({
          snapshotVersions: snapshots
        })
      })
      .catch(err => {
        console.log('Error fetching snapshots', err)
      })
  }

  deleteFeedVersion (feedSource, feedVersion) {
    this.refs['page'].showConfirmModal({
      title: 'Delete Feed Version?',
      body: 'Are you sure you want to delete this version?',
      onConfirm: () => {
        this.props.deleteFeedVersionConfirmed(feedSource, feedVersion)
      }
    })
  }

  showUploadFeedModal () {
    this.refs.page.showSelectFileModal({
      title: 'Upload Feed',
      body: 'Select a GTFS feed to upload:',
      onConfirm: (files) => {
        console.log('selected file', files[0]);
        this.props.uploadFeedClicked(this.props.feedSource, files[0])
      }
    })
  }

  render () {
    const fs = this.props.feedSource

    if(!fs) {
      return <ManagerPage />
    }
    const disabled = !this.props.user.permissions.hasFeedPermission(this.props.project.id, fs.id, 'manage-feed')
    const isWatchingFeed = this.props.user.subscriptions.hasFeedSubscription(this.props.project.id, fs.id, 'feed-updated')
    return (
      <ManagerPage ref='page'>
      <Helmet
        title={this.props.feedSource.name}
      />
        <Grid>
          <Row>
            <Col xs={12}>
              <ul className='breadcrumb'>
                <li><Link to='/'>Explore</Link></li>
                <li><Link to='/project'>Projects</Link></li>
                <li><Link to={`/project/${this.props.project.id}`}>{this.props.project.name}</Link></li>
                <li className='active'>{fs.name}</li>
              </ul>
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <h2>
                {fs.name} &nbsp;
                {fs.isPublic
                  ? <span><small>Private view (<Link to={`/public/feed/${fs.id}`}>View public page</Link>)</small> &nbsp;</span>
                  : null
                }
                {
                  DT_CONFIG.application.notifications_enabled ?
                  <Button
                    className={`pull-right`}
                    onClick={() => { this.props.updateUserSubscription(this.props.user.profile, fs.id, 'feed-updated') }}
                  >
                    {
                      isWatchingFeed ? <span><Glyphicon glyph='eye-close'/> Unwatch</span>
                      : <span><Glyphicon glyph='eye-open'/> Watch</span>
                    }
                  </Button>
                  : null
                }
              </h2>
            </Col>
          </Row>

          <Panel header={(<h3><Glyphicon glyph='cog' /> Feed Source Properties</h3>)}>
            <Row>
              <Col xs={6}>
                <Table striped style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th className='col-md-4'>Property</th>
                      <th className='col-md-8'>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Name</td>
                      <td>
                        <EditableTextField
                          value={fs.name}
                          disabled={disabled}
                          onChange={(value) => this.props.feedSourcePropertyChanged(fs, 'name', value)}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td>Retrieval Method</td>
                      <td>
                        <Row>
                          <Col xs={8}>
                            <Input type='select'
                              value={fs.retrievalMethod}
                              disabled={disabled}
                              onChange={(evt) => {
                                console.log(evt.target.value);
                                this.props.feedSourcePropertyChanged(fs, 'retrievalMethod', evt.target.value)
                              }}
                            >
                              {retrievalMethods.map(method => {
                                return <option value={method} key={method}>
                                  {retrievalMethodString(method)}
                                </option>
                              })}
                            </Input>
                          </Col>
                          <Col xs={4}>
                            {this.props.feedSource.retrievalMethod === 'MANUALLY_UPLOADED'
                              ? <Button
                                  className='pull-right'
                                  disabled={disabled || typeof this.props.uploadFeedClicked === 'undefined'}
                                  onClick={(evt) => { this.showUploadFeedModal() }}
                                >
                                  <Glyphicon glyph='upload' /> Upload
                                </Button>
                              : <Button
                                  className='pull-right'
                                  disabled={disabled || typeof this.props.updateFeedClicked === 'undefined'}
                                  onClick={(evt) => { this.props.updateFeedClicked(fs) }}
                                >
                                  <Glyphicon glyph='refresh' /> Update
                                </Button>
                            }
                          </Col>
                        </Row>
                      </td>
                    </tr>

                    {fs.retrievalMethod === 'FETCHED_AUTOMATICALLY'
                      ? <tr>
                          <td>Retrieval URL</td>
                          <td>
                            <EditableTextField
                              value={fs.url}
                              maxLength={30}
                              disabled={disabled}
                              onChange={(value) => this.props.feedSourcePropertyChanged(fs, 'url', value)}
                            />
                          </td>
                        </tr>
                      : null
                    }

                    {fs.retrievalMethod === 'PRODUCED_IN_HOUSE'
                      ? <tr>
                          <td>Editor Snapshot</td>
                          <td>
                            <Input type='select'
                              value={fs.snapshotVersion}
                              onChange={(evt) => {
                                console.log(evt.target.value);
                                this.props.feedSourcePropertyChanged(fs, 'snapshotVersion', evt.target.value)
                              }}
                            >
                              <option>(None Selected)</option>
                              {this.state.snapshotVersions.map(snapshot => {
                                return <option value={snapshot.id} key={snapshot.id}>
                                  {snapshot.name}
                                </option>
                              })}
                            </Input>
                          </td>
                        </tr>
                      : null
                    }
                    {!isExtensionEnabled('mtc')
                      ? <tr>
                          <td>Public?</td>
                          <td>
                            <Input
                              type='checkbox'
                              label='&nbsp;'
                              disabled={disabled}
                              defaultChecked={fs.isPublic}
                              onChange={(e) => {
                                this.props.feedSourcePropertyChanged(fs, 'isPublic', e.target.checked)
                              }}
                            />
                          </td>
                        </tr>
                      : null
                    }
                  </tbody>
                </Table>
              </Col>

              <Col xs={12} sm={6}>
                {Object.keys(fs.externalProperties || {}).map(resourceType => {
                  console.log('>> resourceType=' + resourceType);
                  return (<ExternalPropertiesTable
                    resourceType={resourceType}
                    editingIsDisabled={disabled}
                    resourceProps={fs.externalProperties[resourceType]}
                    externalPropertyChanged={(name, value) => {
                      this.props.externalPropertyChanged(fs, resourceType, name, value)
                    }}
                  />)
                })}
              </Col>

            </Row>
          </Panel>

          <NotesViewer
            title='Comments for this Feed Source'
            notes={fs.notes}
            feedSource={fs}
            user={this.props.user}
            updateUserSubscription={this.props.updateUserSubscription}
            noteCount={fs.noteCount}
            notesRequested={() => { this.props.notesRequestedForFeedSource(fs) }}
            newNotePosted={(note) => { this.props.newNotePostedForFeedSource(fs, note) }}
          />

          <Panel header={(<h3><Glyphicon glyph='list' /> Feed Versions</h3>)}>
            <FeedVersionNavigator
              versions={fs.feedVersions}
              feedSource={fs}
              user={this.props.user}
              updateUserSubscription={this.props.updateUserSubscription}
              updateDisabled={disabled}
              deleteDisabled={disabled}
              validationResultRequested={(version) => this.props.validationResultRequested(fs, version) }
              downloadFeedClicked={(version) => this.props.downloadFeedClicked(version)}
              deleteVersionClicked={(version) => {
                this.deleteFeedVersion(fs, version)
              }}
              notesRequestedForVersion={(version) => {
                  this.props.notesRequestedForVersion(version)
              }}
              newNotePostedForVersion={(version,note) => {
                this.props.newNotePostedForVersion(version, note)
              }}
              gtfsPlusDataRequested={(version) => {
                this.props.gtfsPlusDataRequested(version)
              }}
            />
          </Panel>
        </Grid>
      </ManagerPage>
    )
  }
}