import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Row, Col, ButtonGroup, ButtonToolbar, DropdownButton, MenuItem, Button, Glyphicon } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'

import { isModuleEnabled, getComponentMessages, getMessage } from '../../../common/util/config'
import { isValidZipFile } from '../../../common/util/util'
import FeedVersionViewer from './FeedVersionViewer'
import OptionButton from '../../../common/components/OptionButton'
import SelectFileModal from '../../../common/components/SelectFileModal'

export default class FeedVersionNavigator extends Component {
  static propTypes = {
    deleteDisabled: PropTypes.bool,
    editDisabled: PropTypes.bool,
    feedSource: PropTypes.object,
    feedVersionIndex: PropTypes.number,
    isPublic: PropTypes.bool,
    deleteFeedVersionConfirmed: PropTypes.func,
    downloadFeedClicked: PropTypes.func,
    feedVersionRenamed: PropTypes.func,
    gtfsPlusDataRequested: PropTypes.func,
    hasVersions: PropTypes.bool,
    loadFeedVersionForEditing: PropTypes.func,
    newNotePostedForVersion: PropTypes.func,
    notesRequestedForVersion: PropTypes.func,
    createDeploymentFromFeedSource: PropTypes.func,
    fetchValidationResult: PropTypes.func,
    setVersionIndex: PropTypes.func,
    sortedVersions: PropTypes.array,
    validationJob: PropTypes.object,
    version: PropTypes.object
  }

  state = {}

  componentWillReceiveProps (nextProps) {
    if (nextProps.feedVersionIndex !== this.props.feedVersionIndex && nextProps.feedSource && nextProps.feedSource.feedVersions) {
      this.props.setVersionIndex(nextProps.feedSource, nextProps.feedVersionIndex, false)
    }
  }

  _onCreateNewVersion = key => {
    const {createDeploymentFromFeedSource, feedSource, fetchFeed} = this.props
    switch (key) {
      // case 'delete':
      //   return this.refs['deleteModal'].open()
      case 'fetch':
        return fetchFeed(feedSource)
      case 'upload':
        return this.refs['uploadModal'].open()
      case 'deploy':
        return createDeploymentFromFeedSource(feedSource)
      case 'public':
        return browserHistory.push(`/public/feed/${feedSource.id}`)
      case 'snapshot':
        return browserHistory.push(`/feed/${feedSource.id}/snapshots`)
    }
  }

  _createDeployment = () => this.props.createDeploymentFromFeedSource(this.props.feedSource)

  _decrementVersion = () => this.props.setVersionIndex(this.props.feedSource, this.props.feedVersionIndex - 1)

  _incrementVersion = () => this.props.setVersionIndex(this.props.feedSource, this.props.feedVersionIndex + 1)

  _onChangeListView = (listView) => this.setState({listView})

  _onConfirmUpload = (files) => {
    const {feedSource, uploadFeed} = this.props
    if (isValidZipFile(files[0])) {
      uploadFeed(feedSource, files[0])
      return true
    } else {
      return false
    }
  }

  _onFetchValidation = (version) => this.props.fetchValidationResult(this.props.version, this.props.isPublic)

  _onVersionNotePosted = (note) => this.props.newNotePostedForVersion(this.props.version, note)

  _onVersionNotesRequested = () => this.props.notesRequestedForVersion(this.props.version)

  _onRequestGtfsPlusData = (version) => this.props.gtfsPlusDataRequested(version.id)

  _onSelectVersion = (key) => {
    if (key !== this.props.feedVersionIndex) {
      this.props.setVersionIndex(this.props.feedSource, key)
    }
  }

  render () {
    const versionTitleStyle = {
      fontSize: '24px',
      fontWeight: 'bold'
    }
    const {
      disabled,
      editDisabled,
      feedSource,
      feedVersionIndex,
      hasVersions,
      isPublic,
      sortedVersions,
      user,
      version,
      versionSection
    } = this.props
    const versions = feedSource.feedVersions
    const messages = getComponentMessages('FeedVersionNavigator')

    if (typeof feedVersionIndex === 'undefined') return null

    return (
      <div>
        <SelectFileModal ref='uploadModal'
          title='Upload Feed'
          body='Select a GTFS feed to upload:'
          onConfirm={this._onConfirmUpload}
          errorMessage='Uploaded file must be a valid zip file (.zip).' />
        <Row style={{marginBottom: '20px'}}>
          {/* Version Navigation Widget and Name Editor */}
          <Col xs={12} style={versionTitleStyle}>
            <ButtonToolbar>
              <ButtonGroup>
                <OptionButton
                  active={!this.state.listView}
                  value={false}
                  onClick={this._onChangeListView}>
                  <Icon type='square' />
                </OptionButton>
                <OptionButton
                  active={this.state.listView}
                  value={!false}
                  onClick={this._onChangeListView}>
                  <Icon type='list' />
                </OptionButton>
              </ButtonGroup>
              {this.state.listView
                ? null
                : <ButtonGroup> {/* Version Navigation/Selection Widget */}
                  {/* Previous Version Button */}
                  <Button href='#'
                    disabled={!hasVersions || !sortedVersions[feedVersionIndex - 2]}
                    onClick={this._decrementVersion}>
                    <Glyphicon glyph='arrow-left' />
                  </Button>

                  {/* Version Selector Dropdown */}
                  <DropdownButton
                    href='#'
                    id='versionSelector'
                    title={`${getMessage(messages, 'version')} ${feedVersionIndex} ${getMessage(messages, 'of')} ${versions.length}`}
                    onSelect={this._onSelectVersion}>
                    {versions.map((version, k) => {
                      k = k + 1
                      return <MenuItem key={k} eventKey={k}>{k}. {version.name}</MenuItem>
                    })}
                  </DropdownButton>
                  {/* Next Version Button */}
                  <Button href='#'
                    disabled={!hasVersions || !sortedVersions[feedVersionIndex]}
                    onClick={this._incrementVersion}>
                    <Glyphicon glyph='arrow-right' />
                  </Button>
                </ButtonGroup>
              }
              <ButtonToolbar className='pull-right'>
                <ButtonGroup>
                  {isModuleEnabled('deployment') && !isPublic
                    ? <Button
                      disabled={disabled} // || !feedSource.latestValidation}
                      onClick={this._createDeployment}>
                      <Icon type='globe' /> Deploy feed
                    </Button>
                    : null
                  }
                  {isModuleEnabled('editor') && !isPublic
                    ? <LinkContainer to={`/feed/${feedSource.id}/edit`}>
                      <Button
                        disabled={editDisabled}>
                        <Glyphicon glyph='pencil' /> Edit feed
                      </Button>
                    </LinkContainer>
                    : null
                  }
                </ButtonGroup>
                {!isPublic
                  ? <DropdownButton
                    bsStyle='success'
                    disabled={disabled}
                    title={
                      <span>
                        <Icon type='plus' /> Create new version
                      </span>
                    }
                    id='bg-nested-dropdown'
                    onSelect={this._onCreateNewVersion}>
                    <MenuItem disabled={disabled || !feedSource.url} eventKey='fetch'><Glyphicon glyph='refresh' /> Fetch</MenuItem>
                    <MenuItem disabled={disabled} eventKey='upload'><Glyphicon glyph='upload' /> Upload</MenuItem>
                    <MenuItem divider />
                    <MenuItem
                      disabled={disabled || !feedSource.editorSnapshots || feedSource.editorSnapshots.length === 0}
                      eventKey='snapshot'>
                      <Glyphicon glyph='camera' /> From snapshot
                    </MenuItem>
                  </DropdownButton>
                  : null
                }
              </ButtonToolbar>
            </ButtonToolbar>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <FeedVersionViewer
              isPublic={isPublic}
              feedSource={feedSource}
              version={version}
              feedVersionIndex={feedVersionIndex}
              versionSection={versionSection || null}
              versions={versions}
              listView={this.state.listView}
              hasVersions={hasVersions}
              fetchValidationResult={this._onFetchValidation}
              gtfsPlusDataRequested={this._onRequestGtfsPlusData}
              notesRequested={this._onVersionNotesRequested}
              newNotePosted={this._onVersionNotePosted}
              user={user}
              {...this.props} />
          </Col>
        </Row>
      </div>
    )
  }
}
