// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Col,
  Glyphicon,
  Label
  as
  BsLabel,
  ListGroup,
  ListGroupItem,
  Panel,
  Row
} from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import * as versionsActions from '../../actions/versions'
import {getComponentMessages, isModuleEnabled} from '../../../common/util/config'
import Loading from '../../../common/components/Loading'
import * as snapshotActions from '../../../editor/actions/snapshots'
import * as plusActions from '../../../gtfsplus/actions/gtfsplus'
import ActiveGtfsPlusVersionSummary from '../../../gtfsplus/containers/ActiveGtfsPlusVersionSummary'
import NotesViewer from '../NotesViewer'
import {errorPriorityLevels, getTableFatalExceptions} from '../../util/version'
import GtfsValidationViewer from '../validation/GtfsValidationViewer'
import type {Feed, FeedVersion, GtfsPlusValidation, Note, Project} from '../../../types'
import type {GtfsState, ManagerUserState} from '../../../types/reducers'

import VersionButtonToolbar from './VersionButtonToolbar'
import VersionDateLabel from './VersionDateLabel'
import FeedVersionReport from './FeedVersionReport'
import DeltaStat from './DeltaStat'

export type Props = {
  comparedVersion?: FeedVersion,
  deleteDisabled: ?boolean,
  deleteFeedVersion: typeof versionsActions.deleteFeedVersion,
  downloadFeedViaToken: typeof versionsActions.downloadFeedViaToken,
  downloadGtfsPlusFeed: typeof plusActions.downloadGtfsPlusFeed,
  editDisabled: ?boolean,
  exportVersionShapes: typeof versionsActions.exportVersionShapes,
  feedSource: Feed,
  feedSource: Feed,
  feedVersionIndex: number,
  fetchGTFSEntities: typeof versionsActions.fetchGTFSEntities,
  fetchValidationErrors: typeof versionsActions.fetchValidationErrors,
  gtfs: GtfsState,
  gtfsPlusValidation: GtfsPlusValidation,
  hasVersions: boolean,
  isPublic?: boolean,
  listView: boolean,
  loadFeedVersionForEditing: typeof snapshotActions.loadFeedVersionForEditing,
  mergeVersions: typeof versionsActions.mergeVersions,
  newNotePosted: $Shape<Note> => void,
  notesRequested: () => void,
  project: ?Project,
  publishFeedVersion: typeof versionsActions.publishFeedVersion,
  renameFeedVersion: typeof versionsActions.renameFeedVersion,
  user: ManagerUserState,
  version: FeedVersion,
  versionSection: ?string,
  versions: Array<FeedVersion>
}

export default class FeedVersionViewer extends Component<Props> {
  messages = getComponentMessages('FeedVersionViewer')

  render () {
    const {
      comparedVersion,
      feedSource,
      feedVersionIndex,
      listView,
      newNotePosted,
      notesRequested,
      user,
      version,
      versions,
      versionSection
    } = this.props

    if (feedSource && !feedSource.latestValidation) {
      return (
        <p className='text-center lead'>
          {this.messages('noVersionsExist')}
        </p>
      )
    }

    if (!version) {
      return <Loading />
    }

    if (listView) {
      // List view of feed versions
      return (
        <Row>
          <Col xs={12} sm={12}>
            <VersionList {...this.props} />
          </Col>
        </Row>
      )
    }
    return (
      <Row>
        <Col xs={12} sm={3}>
          <VersionSectionSelector
            comparedVersion={comparedVersion}
            feedVersionIndex={feedVersionIndex}
            gtfsPlusValidation={this.props.gtfsPlusValidation}
            version={version}
            versionSection={versionSection} />
        </Col>
        <Col xs={12} sm={9}>
          {!versionSection
            ? <FeedVersionReport {...this.props} />
            : versionSection === 'issues'
              ? <GtfsValidationViewer
                {...this.props}
                validationResult={version.validationResult} />
              : versionSection === 'gtfsplus' && isModuleEnabled('gtfsplus')
                ? <ActiveGtfsPlusVersionSummary
                  versions={versions}
                  version={version} />
                : versionSection === 'comments'
                  ? <NotesViewer
                    feedSource={feedSource}
                    stacked
                    user={user}
                    notes={version.notes}
                    notesRequested={notesRequested}
                    newNotePosted={newNotePosted} />
                  : null
          }
        </Col>
      </Row>
    )
  }
}

type SelectorProps = {
  comparedVersion: ?FeedVersion,
  feedVersionIndex: number,
  gtfsPlusValidation: GtfsPlusValidation,
  version: FeedVersion,
  versionSection: ?string
}

class VersionSectionSelector extends Component<SelectorProps> {
  _renderIssuesLabel = () => {
    const { comparedVersion, version } = this.props
    const { feedLoadResult, validationResult, validationSummary } = version

    const tableFatalExceptions = getTableFatalExceptions(version)
    const hasCriticalError = validationSummary.loadStatus !== 'SUCCESS' ||
      !feedLoadResult || feedLoadResult.fatalException ||
      tableFatalExceptions.length > 0

    // Determine the highest priority issue (which will determine the label
    // color).
    let highestPriority = 'UNKNOWN'
    if (validationResult.error_counts) {
      validationResult.error_counts.forEach(category => {
        const level = errorPriorityLevels[category.priority]
        if (level < errorPriorityLevels[highestPriority]) {
          highestPriority = category.priority
        }
      })
    }

    const text = hasCriticalError
      ? 'critical error'
      : validationSummary.errorCount

    let diffLabel
    if (comparedVersion) {
      const diff = validationSummary.errorCount - comparedVersion.validationSummary.errorCount
      diffLabel = (
        <DeltaStat
          comparedVersionIndex={comparedVersion.version}
          diff={diff}
          inverse
          style={{ marginLeft: '3px' }} />
      )
    }

    return (
      <div style={{display: 'inline'}}>
        <BsLabel className={`gtfs-error-${highestPriority}-label-solid`}>
          {text}
        </BsLabel>
        {diffLabel}
      </div>
    )
  }

  _getGtfsPlusIssueCount = (gtfsPlusValidation: GtfsPlusValidation) => {
    // Null issue count will indicate validation has not been loaded yet.
    if (!gtfsPlusValidation) return null
    else return gtfsPlusValidation.issues.length
  }

  _renderGtfsPlusIssuesLabel (version) {
    const {gtfsPlusValidation} = this.props
    const issueCount = this._getGtfsPlusIssueCount(gtfsPlusValidation)
    const hasEdits = gtfsPlusValidation && !gtfsPlusValidation.published
    const color = issueCount
      ? 'danger'
      : hasEdits
        ? 'warning'
        : 'success'
    const text = (issueCount !== null && issueCount > 0)
      ? issueCount
      : <Icon type='check' />
    return issueCount === null
      ? <span><Loading small inline /></span>
      : <span><BsLabel bsStyle={color}>{text}</BsLabel></span>
  }

  render () {
    const { feedVersionIndex, version, versionSection } = this.props
    const versionPath = `/feed/${version.feedSource.id}/version/${feedVersionIndex}`
    return (
      <Panel>
        <ListGroup fill>
          <LinkContainer
            to={versionPath}
            active={!versionSection}>
            <ListGroupItem><Icon type='info-circle' /> Version summary</ListGroupItem>
          </LinkContainer>
          <LinkContainer
            to={`${versionPath}/issues`}
            active={versionSection === 'issues'}>
            <ListGroupItem>
              <Icon type='exclamation-triangle' /> Validation issues {this._renderIssuesLabel()}
            </ListGroupItem>
          </LinkContainer>
          {isModuleEnabled('gtfsplus')
            ? <LinkContainer
              to={`${versionPath}/gtfsplus`}
              active={versionSection === 'gtfsplus'}>
              <ListGroupItem>
                <Icon type='plus' /> GTFS+ for this version {this._renderGtfsPlusIssuesLabel(version)}
              </ListGroupItem>
            </LinkContainer>
            : null
          }
          <LinkContainer
            to={`${versionPath}/comments`}
            active={versionSection === 'comments'}>
            <ListGroupItem>
              <Glyphicon glyph='comment' /> Version comments{' '}
              <BsLabel>{version.noteCount}</BsLabel>
            </ListGroupItem>
          </LinkContainer>
        </ListGroup>
      </Panel>
    )
  }
}

export type ListProps = Props

class VersionList extends Component<ListProps> {
  render () {
    return <Panel header={<h3>List of feed versions</h3>}>
      <ListGroup fill>
        {this.props.versions
          ? this.props.versions.map(v => {
            return (
              <ListGroupItem key={v.id}>
                {v.name}
                {' '}
                <small>
                  <VersionDateLabel version={v} />
                </small>
                <VersionButtonToolbar
                  version={v}
                  size='xsmall'
                  {...this.props} />
              </ListGroupItem>
            )
          })
          : <ListGroupItem>
            No versions
          </ListGroupItem>
        }
      </ListGroup>
    </Panel>
  }
}
