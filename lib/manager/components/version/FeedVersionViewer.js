// @flow

import Icon from '@conveyal/woonerf/components/icon'
import numeral from 'numeral'
import React, { Component } from 'react'
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
import { getComponentMessages, isModuleEnabled } from '../../../common/util/config'
import Loading from '../../../common/components/Loading'
import * as snapshotActions from '../../../editor/actions/snapshots'
import * as plusActions from '../../../gtfsplus/actions/gtfsplus'
import ActiveGtfsPlusVersionSummary from '../../../gtfsplus/containers/ActiveGtfsPlusVersionSummary'
import NotesViewer from '../NotesViewer'
import TransformationsViewer from '../TransformationsViewer'
import { errorPriorityLevels, getTableFatalExceptions, mobilityDataValidationErrorMapping } from '../../util/version'
import GtfsValidationViewer from '../validation/GtfsValidationViewer'
import type { Feed, FeedVersion, GtfsPlusValidation, Note, Project } from '../../../types'
import type { GtfsState, ManagerUserState } from '../../../types/reducers'

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
          <Col sm={12} xs={12}>
            <VersionList {...this.props} />
          </Col>
        </Row>
      )
    }
    return (
      <Row>
        <Col sm={3} xs={12}>
          <VersionSectionSelector
            comparedVersion={comparedVersion}
            feedVersionIndex={feedVersionIndex}
            gtfsPlusValidation={this.props.gtfsPlusValidation}
            version={version}
            versionSection={versionSection} />
        </Col>
        <Col sm={9} xs={12}>
          {!versionSection
            ? <FeedVersionReport {...this.props} />
            : versionSection === 'issues'
              ? <GtfsValidationViewer
                {...this.props}
                validationResult={version.validationResult} />
              : versionSection === 'gtfsplus' && isModuleEnabled('gtfsplus')
                ? <ActiveGtfsPlusVersionSummary
                  version={version}
                  versionSummaries={feedSource.feedVersionSummaries}
                />
                : versionSection === 'comments'
                  ? <NotesViewer
                    feedSource={feedSource}
                    stacked
                    user={user}
                    notes={version.notes}
                    notesRequested={notesRequested}
                    newNotePosted={newNotePosted} />
                  : versionSection === 'transformations'
                    ? <TransformationsViewer version={version} />
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
  // eslint-disable-next-line complexity
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
    if (validationResult && validationResult.error_counts) {
      validationResult.error_counts.forEach(category => {
        const level = errorPriorityLevels[category.priority]
        if (level < errorPriorityLevels[highestPriority]) {
          highestPriority = category.priority
        }
      })
    }

    // Do the same for the mobility data results
    let highestMBPriority = 'UNKNOWN'
    if (version && version.mobilityDataResult) {
      version.mobilityDataResult.notices.forEach(notice => {
        const level = errorPriorityLevels[mobilityDataValidationErrorMapping[notice.severity]]
        if (level < errorPriorityLevels[highestMBPriority]) {
          highestMBPriority = mobilityDataValidationErrorMapping[notice.severity]
        }
      })
    }

    const dtValidationCount = hasCriticalError
      ? 'critical error'
      : numeral(validationSummary.errorCount).format('0a')

    const mbValidationCount =
      version.mobilityDataResult &&
      version.mobilityDataResult.notices &&
      numeral(
        version.mobilityDataResult.notices.reduce((prev, cur) => {
          return prev + cur.totalNotices
        }, 0)
      ).format('0a')

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
      <div style={{ display: 'inline' }}>
        <BsLabel className={`gtfs-error-${highestPriority}-label-solid`}>
          DT {dtValidationCount}
        </BsLabel>
        {mbValidationCount && <BsLabel style={{marginLeft: '1ch'}} className={`gtfs-error-${highestMBPriority}-label-solid`}>
          MD {mbValidationCount}
        </BsLabel> }
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
    const { gtfsPlusValidation } = this.props
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
      ? <span><Loading inline small /></span>
      : <span><BsLabel bsStyle={color}>{text}</BsLabel></span>
  }

  // Render the number of transformations applied to the current feed version
  _renderTransformResultsCount = (version: FeedVersion) => {
    let totalCount = 0
    if (version.feedTransformResult) {
      const { tableTransformResults } = version.feedTransformResult
      totalCount = tableTransformResults.reduce((prev, cur) => {
        return cur.deletedCount + cur.updatedCount + cur.addedCount + prev
      }, 0)
    }
    return (
      <BsLabel>
        {totalCount}
      </BsLabel>
    )
  }

  render () {
    const { feedVersionIndex, version, versionSection } = this.props
    const versionPath = `/feed/${version.feedSource.id}/version/${feedVersionIndex}`
    return (
      <Panel>
        <ListGroup>
          <LinkContainer
            active={!versionSection}
            to={versionPath}
          >
            <ListGroupItem><Icon type='info-circle' /> Résumé de la version</ListGroupItem>
          </LinkContainer>
          <LinkContainer
            active={versionSection === 'issues'}
            to={`${versionPath}/issues`}
          >
            <ListGroupItem>
              <Icon type='exclamation-triangle' /> Erreurs de validation {this._renderIssuesLabel()}
            </ListGroupItem>
          </LinkContainer>
          <LinkContainer
            active={versionSection === 'transformations'}
            to={`${versionPath}/transformations`}
          >
            <ListGroupItem>
              <Icon type='exchange' /> Résultats des transformations {this._renderTransformResultsCount(version)}
            </ListGroupItem>
          </LinkContainer>
          {isModuleEnabled('gtfsplus')
            ? <LinkContainer
              active={versionSection === 'gtfsplus'}
              to={`${versionPath}/gtfsplus`}
            >
              <ListGroupItem>
                <Icon type='plus' /> GTFS+ de la version {this._renderGtfsPlusIssuesLabel(version)}
              </ListGroupItem>
            </LinkContainer>
            : null
          }
          <LinkContainer
            active={versionSection === 'comments'}
            to={`${versionPath}/comments`}
          >
            <ListGroupItem>
              <Glyphicon glyph='comment' /> Commentaires associés à la version{' '}
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
    const { feedSource } = this.props
    const { feedVersionSummaries } = feedSource
    return (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass='h3'>Liste des versions du flux</Panel.Title>
        </Panel.Heading>
        <ListGroup>
          {feedVersionSummaries ? (
            feedVersionSummaries.map((v) => {
              return (
                <ListGroupItem key={v.id}>
                  {v.name}{' '}
                  <small>
                    <VersionDateLabel version={v} />
                  </small>
                  <VersionButtonToolbar
                    versionSummary={v}
                    size='xsmall'
                    {...this.props}
                  />
                </ListGroupItem>
              )
            })
          ) : (
            <ListGroupItem>Pas de versions</ListGroupItem>
          )}
        </ListGroup>
      </Panel>
    )
  }
}
