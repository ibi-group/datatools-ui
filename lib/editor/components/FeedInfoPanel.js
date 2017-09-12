import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Button, ButtonGroup, DropdownButton, Dropdown, MenuItem, Tooltip, OverlayTrigger } from 'react-bootstrap'
import { browserHistory } from 'react-router'

import CreateSnapshotModal from './CreateSnapshotModal'
import SelectFileModal from '../../common/components/SelectFileModal.js'
import { GTFS_ICONS } from '../util/ui'

const PANEL_WIDTH = 400

export default class FeedInfoPanel extends Component {
  static propTypes = {
    feedSource: PropTypes.object,
    project: PropTypes.object,
    feedInfo: PropTypes.object,
    createSnapshot: PropTypes.func,
    setActiveEntity: PropTypes.func
  }

  state = {
    right: 5
  }

  _onAddSelect = key => {
    this.props.setActiveEntity(this.props.feedSource.id, key, {id: 'new'})
  }

  _onDropdownArrowClick = () => this.props.getSnapshots(this.props.feedSource)

  _onNavigate = key => {
    switch (key) {
      case '1':
        return browserHistory.push(`/project/${this.props.project.id}`)
      case '2':
        return browserHistory.push(`/feed/${this.props.feedSource.id}`)
    }
  }

  _onOkClicked = (name, comment) => {
    this.props.createSnapshot(this.props.feedSource, name, comment)
  }

  _onSelectSnapshot = key => {
    const snapshot = this.props.feedSource.editorSnapshots.find(s => s.id === key)
    this.props.showConfirmModal({
      title: `Restore ${key}?`,
      body: `Are you sure you want to restore this snapshot?`,
      onConfirm: () => {
        this.props.restoreSnapshot(this.props.feedSource, snapshot)
      }
    })
  }

  _onToggleHide = () => {
    const toolbarVisible = this.state.right > 0
    if (toolbarVisible) {
      this.setState({right: 30 - PANEL_WIDTH})
    } else {
      this.setState({right: 5})
    }
  }

  _openSnapshotModal = () => this.refs.snapshotModal.open()

  showUploadFileModal = () => {
    this.refs.selectFileModal.open({
      title: 'Upload route shapefile',
      body: 'Select a zipped shapefile to display on map:',
      onConfirm: (files) => {
        const nameArray = files[0].name.split('.')
        if (files[0].type !== 'application/zip' || nameArray[nameArray.length - 1] !== 'zip') {
          return false
        } else {
          this.props.displayRoutesShapefile(this.props.feedSource, files[0])
          return true
        }
      },
      errorMessage: 'Uploaded file must be a valid zip file (.zip).'
    })
  }

  render () {
    const { feedSource, feedInfo } = this.props
    if (!feedInfo) return null
    const panelStyle = {
      position: 'absolute',
      right: this.state.right,
      bottom: 20,
      zIndex: 500,
      borderRadius: '5px',
      width: `${PANEL_WIDTH}px`
    }
    if (!feedInfo || !feedSource) {
      return null
    }
    const toolbarVisible = this.state.right > 0
    const feedName = feedSource && feedSource.name && feedSource.name.length > 10
      ? feedSource.name.substr(0, 10) + '...'
      : feedSource && feedSource.name
      ? feedSource.name
      : 'Unnamed'

    return (
      <div>
        <SelectFileModal ref='selectFileModal' />
        <div style={panelStyle}>
          <CreateSnapshotModal
            ref='snapshotModal'
            onOkClicked={this._onOkClicked} />
          <ButtonGroup>
            {/* Hide toolbar toggle */}
            <OverlayTrigger placement='top' overlay={<Tooltip id='hide-tooltip'>{toolbarVisible ? 'Hide toolbar' : 'Show toolbar'}</Tooltip>}>
              <Button onClick={this._onToggleHide}>
                <Icon type={toolbarVisible ? 'caret-right' : 'caret-left'} />
              </Button>
            </OverlayTrigger>
            {/* Navigation dropdown */}
            <DropdownButton
              dropup
              title={<span title={`Editing ${feedSource && feedSource.name}`}>Editing {feedName}</span>}
              id='navigation-dropdown'
              onSelect={this._onNavigate}>
              <MenuItem eventKey='1'><Icon type='reply' /> Back to project</MenuItem>
              <MenuItem eventKey='2'><Icon type='reply' /> Back to feed source</MenuItem>
            </DropdownButton>
            <Button
              onClick={this.showUploadFileModal}>
              <Icon type='upload' />
            </Button>
            {/* Add entity dropdown */}
            <DropdownButton
              pullRight dropup
              title={<span><Icon type='plus' /></span>}
              id='add-entity-dropdown'
              onSelect={this._onAddSelect}>
              {GTFS_ICONS.map(c => {
                if (!c.addable) return null
                const name = c.id === 'scheduleexception' ? 'schedule exception' : c.id
                return (
                  <MenuItem key={c.id} eventKey={c.id}><Icon type={c.icon} /> Add {name}</MenuItem>
                )
              })}
            </DropdownButton>
            {/* Snapshot dropdown */}
            {
              <Dropdown
                dropup
                pullRight
                id='snapshot-dropdown'
                onSelect={this._onSelectSnapshot}>
                <OverlayTrigger placement='top' overlay={<Tooltip id='snapshot-tooltip'>Take snapshot</Tooltip>}>
                  <Button
                    bsStyle='primary'
                    onClick={this._openSnapshotModal}>
                    <Icon type='camera' />
                  </Button>
                </OverlayTrigger>
                <Dropdown.Toggle
                  bsStyle='primary'
                  onClick={this._onDropdownArrowClick} />
                <Dropdown.Menu style={{maxHeight: '200px', overflowY: 'scroll'}}>
                  {feedSource && feedSource.editorSnapshots
                    ? feedSource.editorSnapshots.map(snapshot => {
                      return (
                        <MenuItem
                          key={snapshot.id}
                          eventKey={snapshot.id}>
                          <Icon type='reply' /> Revert to {snapshot.name}
                        </MenuItem>
                      )
                    })
                    : <MenuItem disabled eventKey={null}>No snapshots</MenuItem>
                  }
                </Dropdown.Menu>
              </Dropdown>
            }
          </ButtonGroup>
        </div>
      </div>
    )
  }
}
