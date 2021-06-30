// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Button, Badge, Glyphicon} from 'react-bootstrap'
import {connect} from 'react-redux'
import { Link } from 'react-router'
import Select from 'react-select'

import * as deploymentActions from '../../actions/deployments'
import {formatTimestamp, fromNow} from '../../../common/util/date-time'
import {
  versionHasExpired,
  versionHasNotBegun,
  versionIsPinnedInDeployment
} from '../../util/version'

import type {
  Deployment,
  Feed,
  Project,
  SummarizedFeedVersion
} from '../../../types'
import type {AppState} from '../../../types/reducers'

function addClassIfFalsy (val, className) {
  return !val ? ` ${className}` : ''
}

function warnIfFalsy (val) {
  return addClassIfFalsy(val, 'warning')
}

function dangerIfTruthy (val) {
  return addClassIfFalsy(!val, 'danger')
}

type RowProps = {
  deployment: Deployment,
  feedSource: Feed,
  project: Project,
  version: SummarizedFeedVersion
}

type ConnectedRowProps = RowProps & {
  deleteFeedVersion: typeof deploymentActions.deleteFeedVersion,
  feedVersionPinned: boolean,
  isVersionEditable: boolean,
  togglePinFeedVersion: typeof deploymentActions.togglePinFeedVersion,
  updateVersionForFeedSource: typeof deploymentActions.updateVersionForFeedSource,
  userCanEditDeployment: boolean,
  userCanRemoveVersion: boolean
}

class DeploymentTableRow extends Component<ConnectedRowProps> {
  _numberToOption = n => ({value: n, label: n})

  _onChangeVersion = option => {
    const {
      deployment,
      feedSource,
      updateVersionForFeedSource
    } = this.props
    const versionToAdd = {feedSourceId: feedSource.id, version: option.value}
    updateVersionForFeedSource(deployment, feedSource, versionToAdd)
  }

  _togglePinFeedVersion = () => {
    const {togglePinFeedVersion, deployment, version} = this.props
    togglePinFeedVersion(deployment, version)
  }

  _removeVersion = () => {
    const {deleteFeedVersion, deployment, version} = this.props
    deleteFeedVersion(deployment, version)
  }

  render () {
    const {
      feedSource,
      feedVersionPinned,
      isVersionEditable,
      userCanEditDeployment,
      userCanRemoveVersion,
      version
    } = this.props
    const {latestVersionId} = feedSource
    const {validationResult: result} = version
    const expired = versionHasExpired(version)
    const future = versionHasNotBegun(version)
    return (
      <tr>
        <td>
          <Link to={`/feed/${feedSource.id}`}>{feedSource.name}</Link>
          {feedVersionPinned && <Icon type='thumb-tack' />}
        </td>
        <td className={version.id !== latestVersionId ? 'warning' : ''}>
          <div style={{display: 'flex', minWidth: '100px'}}>
            <Button
              bsSize='xsmall'
              active={feedVersionPinned}
              disabled={!userCanEditDeployment}
              onClick={this._togglePinFeedVersion}>
              <Icon
                type={'thumb-tack'}
                title={feedVersionPinned
                  ? 'Unpin version in auto-deployments'
                  : 'Pin version in auto-deployments'
                }
                alt='Toggle pin version' />
            </Button>
            <div style={{marginLeft: '5px', width: '70%'}}>
              <Select
                clearable={false}
                disabled={!isVersionEditable}
                options={Array.from(Array(feedSource.versionCount).keys())
                  .reverse()
                  .map(n => this._numberToOption(n + 1))
                }
                value={this._numberToOption(version.version)}
                onChange={this._onChangeVersion}
              />
            </div>
          </div>
        </td>
        <td className='hidden-xs'>
          <Badge>{result.loadStatus}</Badge>
        </td>
        <td className={`hidden-xs${warnIfFalsy(!result.errorCount)}`}>
          {result.errorCount}
        </td>
        <td className={`hidden-xs${warnIfFalsy(result.routeCount)}`}>
          {result.routeCount}
        </td>
        <td className={`hidden-xs${warnIfFalsy(result.tripCount)}`}>
          {result.tripCount}
        </td>
        <td className={`hidden-xs${warnIfFalsy(result.stopTimesCount)}`}>
          {result.stopTimesCount}
        </td>
        <td className={dangerIfTruthy(future)}>
          {formatTimestamp(result.startDate, false)} ({fromNow(result.startDate)})
        </td>
        <td className={dangerIfTruthy(expired)}>
          {formatTimestamp(result.endDate, false)} ({fromNow(result.endDate)})
        </td>
        <td>
          <Button
            bsStyle='danger'
            bsSize='xsmall'
            disabled={!userCanRemoveVersion}
            className='pull-right'
            onClick={this._removeVersion}>
            <Glyphicon glyph='remove' />
          </Button>
        </td>
      </tr>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: RowProps) => {
  const {deployment, feedSource, project, version} = ownProps
  const feedVersionPinned = versionIsPinnedInDeployment(deployment, version)
  const user = state.user
  const userCanEditDeployment = user.permissions &&
    user.permissions.hasFeedPermission(
      project.organizationId,
      project.id,
      feedSource.id,
      'manage-feed'
    )
  const isVersionEditable = userCanEditDeployment && !feedVersionPinned

  // Cannot remove feed source if the deployment is feed-specific or it is
  // pinned
  const userCanRemoveVersion = isVersionEditable &&
    deployment.feedSourceId !== feedSource.id

  return {
    feedVersionPinned,
    isVersionEditable,
    userCanEditDeployment,
    userCanRemoveVersion
  }
}

const mapDispatchToProps = {
  deleteFeedVersion: deploymentActions.deleteFeedVersion,
  togglePinFeedVersion: deploymentActions.togglePinFeedVersion,
  updateVersionForFeedSource: deploymentActions.updateVersionForFeedSource
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeploymentTableRow)
