// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Panel, ListGroup} from 'react-bootstrap'
import moment from 'moment'
import numeral from 'numeral'

import EditableTextField from '../../../common/components/EditableTextField'
import {getProfileLink} from '../../../common/util/util'
import TransformationsIndicatorBadge from '../transform/TransformationsIndicatorBadge'

import FeedVersionDetails from './FeedVersionDetails'
import FeedVersionMap from './FeedVersionMap'
import FeedVersionTabs from './FeedVersionTabs'
import VersionButtonToolbar from './VersionButtonToolbar'
import VersionRetrievalBadge from './VersionRetrievalBadge'
import type {Props as FeedVersionViewerProps} from './FeedVersionViewer'

const dateFormat = 'MMM. DD, YYYY'
const timeFormat = 'h:mma'

type Props = FeedVersionViewerProps

type State = {
  isochroneBand: number,
  tab: string
}

export default class FeedVersionReport extends Component<Props, State> {
  // TODO: move tab and isochroneBand to redux store
  state = {
    tab: 'feed',
    isochroneBand: 60 * 60
  }

  componentWillReceiveProps (nextProps: Props) {
    // Reset tab to summary when version changes
    const { version } = this.props
    if (version && nextProps.version && version.id !== nextProps.version.id) {
      this.setState({ tab: 'feed' })
    }
  }

  selectTab = (tab: string) => this.setState({tab})

  _onVersionNameChange = (value: string) => {
    this.props.renameFeedVersion(this.props.version, value)
  }

  _onChangeIsochroneBand = (value: number) => this.setState({isochroneBand: value * 60})

  render () {
    const {
      isPublic,
      version
    } = this.props
    const {
      fileSize,
      fileTimestamp,
      name,
      updated,
      user,
      validationSummary: summary
    } = version
    const versionLastModified = fileTimestamp
      ? moment(fileTimestamp).format(timeFormat + ', ' + dateFormat)
      : 'N/A'
    const userLink = user
      ? <a href={getProfileLink(user)}><strong>{user}</strong></a>
      : '[unknown]'
    const hasNoErrors = summary.loadStatus === 'SUCCESS' && summary.errorCount === 0
    return (
      <Panel
        // bsStyle='info'
      >
        <Panel.Heading>
          <div>
            <h4 style={{margin: '0px'}}>
              {/* Name Display / Editor */}
              {hasNoErrors
                ? (
                  <Icon
                    className='text-success'
                    style={{marginRight: 10}}
                    title='Flux chargé, aucune erreur !'
                    type='check'
                  />
                ) : summary.errorCount > 0 ? (
                  <Icon
                    className='text-warning'
                    style={{marginRight: 10}}
                    title='Flux chargé, erreurs rencontrées.'
                    type='exclamation-triangle'
                  />
                ) : (
                  <Icon
                    className='text-danger'
                    style={{marginRight: 10}}
                    title='Flux non chargé, une erreur est survenue.'
                    type='times'
                  />
                )
              }

              {isPublic
                ? <span>{name}</span>
                : <EditableTextField
                  inline
                  value={name}
                  maxLength={26}
                  rejectEmptyValue
                  disabled={isPublic}
                  onChange={this._onVersionNameChange} />
              }
              <VersionButtonToolbar size='small' versionSummary={version} {...this.props} />
            </h4>
            <small>
              <VersionRetrievalBadge version={version} />
              <TransformationsIndicatorBadge version={version} />
              {' '}
              <span title={moment(updated).format(dateFormat + ', ' + timeFormat)}>
                Version publiée {moment(updated).fromNow()}
              </span>
              {' '}
              by {userLink}
            </small>
          </div>
        </Panel.Heading>
        <ListGroup>
          <FeedVersionMap
            {...this.props}
            isochroneBand={this.state.isochroneBand}
            tab={this.state.tab} />
          <FeedVersionDetails
            {...this.props}
            tab={this.state.tab} />
          <FeedVersionTabs
            {...this.props}
            isochroneBand={this.state.isochroneBand}
            onChangeIsochroneBand={this._onChangeIsochroneBand}
            selectTab={this.selectTab}
            tab={this.state.tab} />
        </ListGroup>
        <Panel.Footer>
          <span>
            <Icon type='file-archive-o' />
            {' '}
            Fichier zip de {numeral(fileSize || 0).format('0 b')} modifié la dernière fois le {versionLastModified}
          </span>
        </Panel.Footer>
      </Panel>
    )
  }
}
