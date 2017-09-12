import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes, Component} from 'react'
import {Row, Col, Button, InputGroup, FormControl, Glyphicon, ButtonToolbar, DropdownButton, MenuItem} from 'react-bootstrap'

import toSentenceCase from '../../common/util/to-sentence-case'
import {isExtensionEnabled, getComponentMessages, getMessage} from '../../common/util/config'
import ThirdPartySyncButton from './ThirdPartySyncButton'

export default class ProjectViewerHeader extends Component {
  static propTypes = {
    downloadMergedFeed: PropTypes.func,
    onNewFeedSourceClick: PropTypes.func,
    project: PropTypes.object,
    searchTextChanged: PropTypes.func,
    thirdPartySync: PropTypes.func,
    updateAllFeeds: PropTypes.func,
    user: PropTypes.object,
    visibilityFilter: PropTypes.object
  }

  _onDownloadMerged = () => this.props.downloadMergedFeed(this.props.project)

  _onSearchChange = evt => this.props.searchTextChanged(evt.target.value)

  _onUpdateProject = () => this.props.updateAllFeeds(this.props.project)

  render () {
    const {
      onNewFeedSourceClick,
      project,
      thirdPartySync,
      user,
      visibilityFilter
    } = this.props
    const messages = getComponentMessages('ProjectViewer')
    const projectEditDisabled = !user.permissions.isProjectAdmin(project.id, project.organizationId)
    return (
      <Row>
        <Col xs={4}>
          <InputGroup>
            <DropdownButton
              componentClass={InputGroup.Button}
              id='input-dropdown-addon'
              title={visibilityFilter.filter ? toSentenceCase(visibilityFilter.filter) : 'Filter'}
              onSelect={this._onSelectFilter}>
              <MenuItem eventKey='ALL'>All</MenuItem>
              <MenuItem eventKey='STARRED'>Starred</MenuItem>
              <MenuItem eventKey='PUBLIC'>Public</MenuItem>
              <MenuItem eventKey='PRIVATE'>Private</MenuItem>
            </DropdownButton>
            <FormControl
              placeholder={getMessage(messages, 'feeds.search')}
              onChange={this._onSearchChange} />
          </InputGroup>
        </Col>
        <Col xs={8}>
          {!projectEditDisabled &&
            <Button
              bsStyle='primary'
              disabled={projectEditDisabled}
              className='pull-right'
              onClick={onNewFeedSourceClick}>
              <Glyphicon glyph='plus' /> {getMessage(messages, 'feeds.new')}
            </Button>
          }
          <ButtonToolbar>
            {isExtensionEnabled('transitland') || isExtensionEnabled('transitfeeds') || isExtensionEnabled('mtc')
              ? <ThirdPartySyncButton
                projectEditDisabled={projectEditDisabled}
                thirdPartySync={thirdPartySync} />
              : null
            }
            <Button
              bsStyle='default'
              disabled={projectEditDisabled}
              onClick={this._onUpdateProject}>
              <Icon type='cloud-download' /> {getMessage(messages, 'feeds.update')}
            </Button>
            <Button
              bsStyle='primary'
              onClick={this._onDownloadMerged}>
              <Glyphicon glyph='download' /> {getMessage(messages, 'mergeFeeds')}
            </Button>
          </ButtonToolbar>
        </Col>
      </Row>
    )
  }
}
