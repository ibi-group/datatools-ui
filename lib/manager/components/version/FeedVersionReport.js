import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Panel, ListGroup} from 'react-bootstrap'
import moment from 'moment'
import numeral from 'numeral'

import EditableTextField from '../../../common/components/EditableTextField'
import FeedVersionDetails from './FeedVersionDetails'
import FeedVersionMap from './FeedVersionMap'
import FeedVersionTabs from './FeedVersionTabs'
import { VersionButtonToolbar } from './FeedVersionViewer'
import { getProfileLink } from '../../../common/util/util'

const dateFormat = 'MMM. DD, YYYY'
const timeFormat = 'h:mma'

export default class FeedVersionReport extends Component {
  static propTypes = {
    version: PropTypes.object,
    versions: PropTypes.array,
    feedVersionIndex: PropTypes.number,
    isPublic: PropTypes.bool,
    hasVersions: PropTypes.bool,
    feedVersionRenamed: PropTypes.func,
    fetchValidationResult: PropTypes.func,
    publishFeedVersion: PropTypes.func,
    user: PropTypes.object
  }

  // TODO: move tab and isochroneBand to redux store
  state = {
    tab: 'feed',
    isochroneBand: 60 * 60
  }

  selectTab = (tab) => this.setState({tab})

  _onVersionNameChange = (value) => this.props.feedVersionRenamed(this.props.version, value)

  _onChangeIsochroneBand = (value) => this.setState({isochroneBand: value * 60})

  render () {
    const {
      isPublic,
      validationJob,
      version
    } = this.props
    const versionLastModified = version.fileTimestamp
      ? moment(version.fileTimestamp).format(timeFormat + ', ' + dateFormat)
      : 'N/A'
    const userLink = version.user
      ? <a href={getProfileLink(version.user)}><strong>{version.user}</strong></a>
      : '[unknown]'
    return (
      <Panel
        // bsStyle='info'
        header={
          <div>
            <h4 style={{margin: '0px'}}>
              {/* Name Display / Editor */}
              {validationJob
                ? <Icon title='Feed is processing...' className='fa-spin' type='refresh' />
                : version.validationSummary.loadStatus === 'SUCCESS' && version.validationSummary.errorCount === 0
                ? <Icon title='Feed loaded successfully, and is error-free!' className='text-success' type='check' style={{marginRight: 10}} />
                : version.validationSummary.errorCount > 0
                ? <Icon title='Feed loaded successfully, but has errors.' className='text-warning' type='exclamation-triangle' style={{marginRight: 10}} />
                : <Icon title='Feed did not load successfully, something has gone wrong!' className='text-danger' type='times' style={{marginRight: 10}} />
              }
              {isPublic
                ? <span>{version.name}</span>
                : <EditableTextField
                  inline
                  value={version.name}
                  maxLength={26}
                  disabled={isPublic}
                  onChange={this._onVersionNameChange} />
              }
              <VersionButtonToolbar size='small' {...this.props} />
            </h4>
            <small title={moment(version.updated).format(dateFormat + ', ' + timeFormat)}>
              <Icon type='clock-o' />
              {' '}
              Version published {moment(version.updated).fromNow()} by {userLink}
            </small>
          </div>
        }
        footer={
          <span>
            <Icon type='file-archive-o' />
            {' '}
            {numeral(version.fileSize || 0).format('0 b')} zip file last modified at {versionLastModified}
          </span>}>
        <ListGroup fill>
          <FeedVersionMap
            {...this.props}
            isochroneBand={this.state.isochroneBand}
            tab={this.state.tab} />
          <FeedVersionDetails
            {...this.props}
            tab={this.state.tab} />
          <FeedVersionTabs
            {...this.props}
            onChangeIsochroneBand={this._onChangeIsochroneBand}
            selectTab={this.selectTab}
            isochroneBand={this.state.isochroneBand}
            tab={this.state.tab} />
        </ListGroup>
      </Panel>
    )
  }
}
