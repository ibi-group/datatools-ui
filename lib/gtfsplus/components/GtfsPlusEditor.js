// @flow

import React, {Component} from 'react'
import {Grid, Row, Col, Button, Glyphicon, PageHeader} from 'react-bootstrap'
import JSZip from 'jszip'
import {Link} from 'react-router'

import ManagerPage from '../../common/components/ManagerPage'
import OptionButton from '../../common/components/OptionButton'
import * as editorActions from '../../editor/actions/editor'
import ActiveEditorLockManager from '../../editor/containers/ActiveEditorLockManager'
import {getEditorEnabledState} from '../../editor/util/ui'
import * as gtfsPlusActions from '../actions/gtfsplus'
import {getGtfsPlusSpec} from '../../common/util/config'
import * as feedsActions from '../../manager/actions/feeds'
import type {Props as ContainerProps} from '../containers/ActiveGtfsPlusEditor'
import type {Feed, FeedVersionSummary, GtfsPlusValidation, Project} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import GtfsPlusTable from './GtfsPlusTable'

export type Props = ContainerProps & {
  activeTableId: string,
  addGtfsPlusRow: typeof gtfsPlusActions.addGtfsPlusRow,
  currentPage: number,
  deleteGtfsPlusRow: typeof gtfsPlusActions.deleteGtfsPlusRow,
  downloadGtfsPlusFeed: typeof gtfsPlusActions.downloadGtfsPlusFeed,
  feedIsLocked: boolean,
  feedSource: Feed,
  feedSourceId: string,
  feedVersionId: string,
  feedVersionSummary: FeedVersionSummary,
  fetchFeedSourceAndProject: typeof feedsActions.fetchFeedSourceAndProject,
  gtfsEntityLookup: Object,
  loadGtfsEntities: typeof gtfsPlusActions.loadGtfsEntities,
  lockEditorFeedSourceIfNeeded: typeof editorActions.lockEditorFeedSourceIfNeeded,
  pageCount: number,
  project: Project,
  receiveGtfsEntities: typeof gtfsPlusActions.receiveGtfsEntities,
  recordsPerPage: number,
  removeEditorLock: typeof editorActions.removeEditorLock,
  setActiveTable: typeof gtfsPlusActions.setActiveTable,
  setCurrentPage: typeof gtfsPlusActions.setCurrentPage,
  setVisibilityFilter: typeof gtfsPlusActions.setVisibilityFilter,
  stopLockTimer: typeof editorActions.stopLockTimer,
  tableData: null | any,
  updateGtfsPlusField: typeof gtfsPlusActions.updateGtfsPlusField,
  uploadGtfsPlusFeed: typeof gtfsPlusActions.uploadGtfsPlusFeed,
  user: ManagerUserState,
  validation: GtfsPlusValidation,
  visibility: string,
  visibleRows: Array<any>
}

export default class GtfsPlusEditor extends Component<Props> {
  GTFS_PLUS_SPEC = getGtfsPlusSpec()

  componentWillMount () {
    const {
      downloadGtfsPlusFeed,
      feedSource,
      feedSourceId,
      feedVersionId,
      fetchFeedSourceAndProject,
      lockEditorFeedSourceIfNeeded,
      tableData
    } = this.props
    // Fetch feed source (which will also fetch version summaries) and containing project.
    if (!feedSource) fetchFeedSourceAndProject(feedSourceId)
    if (!tableData) downloadGtfsPlusFeed(feedVersionId)
    lockEditorFeedSourceIfNeeded(feedSourceId, editorActions.GTFS_PLUS_EDITOR_LOCK)
  }

  componentWillReceiveProps (nextProps: Props) {
    const {
      feedSourceId,
      lockEditorFeedSourceIfNeeded,
      removeEditorLock,
      stopLockTimer
    } = this.props
    if (nextProps.feedSourceId !== feedSourceId) {
      // Remove editor lock.
      removeEditorLock(editorActions.GTFS_PLUS_EDITOR_LOCK, feedSourceId, false)
      // Re-establish lock for new feed source and fetch GTFS.
      lockEditorFeedSourceIfNeeded(nextProps.feedSourceId, editorActions.GTFS_PLUS_EDITOR_LOCK)
    } else if (this.props.feedIsLocked) {
      // The actions below apply if content has been loaded into the GTFS+ editor.
      if (!nextProps.feedIsLocked) {
        // If user clicked "Re-lock feed",
        // re-establish lock for the feed source and fetch GTFS to resume editing.
        lockEditorFeedSourceIfNeeded(nextProps.feedSourceId, editorActions.GTFS_PLUS_EDITOR_LOCK)
      } else {
        // If the user dismissed the "Relock feed" dialog, stop the lock timer and leave the UI disabled.
        // The "Relock feed" modal will reappear next time the user switches back to the tab.
        stopLockTimer()
      }
    }
  }

  save = () => {
    const {
      downloadGtfsPlusFeed,
      feedVersionId,
      tableData,
      uploadGtfsPlusFeed
    } = this.props
    if (!tableData) return
    const zip = new JSZip()

    for (const table of this.GTFS_PLUS_SPEC) {
      if (!(table.id in tableData) || tableData[table.id].length === 0) continue

      let fileContent = ''
      // white the header line
      const fieldNameArr = table.fields.map(field => field['name'])
      fileContent += fieldNameArr.join(',') + '\n'

      // write the data rows
      tableData[table.id].map(rowData => {
        const rowText = fieldNameArr.map(fieldName => {
          return rowData[fieldName] || ''
        }).join(',')
        fileContent += rowText + '\n'
      })

      // add to the zip archive
      zip.file(table.name, fileContent)
    }

    zip.generateAsync({type: 'blob'})
      .then(content => uploadGtfsPlusFeed(feedVersionId, content))
      .then(() => downloadGtfsPlusFeed(feedVersionId))
  }

  _getGtfsEntity = (type: string, id: string) => this.props.gtfsEntityLookup[`${type}_${id}`]

  _newRowsDisplayed = (rows: Array<any>) => {
    const {activeTableId, feedVersionSummary, loadGtfsEntities, validation} = this.props
    if (feedVersionSummary) loadGtfsEntities(activeTableId, rows, feedVersionSummary, validation)
  }

  _selectTable = (activeTableId: string) => this.props.setActiveTable({activeTableId})

  _showHelpClicked = (tableId: string, fieldName: ?string) => {
    const activeTable = this.GTFS_PLUS_SPEC.find(t => t.id === tableId)
    if (!activeTable) {
      console.warn(`Could not locate GTFS+ table with id=${tableId}`)
      return
    }
    const field = activeTable.fields
      .find(f => f.name === fieldName)
    const helpContent = fieldName
      ? field && field.helpContent
      : activeTable.helpContent
    this.refs.page.showInfoModal({
      title: `Help for ${tableId}.txt` + (fieldName ? `: ${fieldName}` : ''),
      body: helpContent || '(No help content found for this field)'
    })
  }

  render () {
    const {
      activeTableId,
      feedIsLocked,
      feedSource,
      feedSourceId,
      feedVersionSummary,
      project,
      tableData,
      user,
      validation,
      visibleRows
    } = this.props
    if (!feedSource) return null
    const { editingIsDisabled } = getEditorEnabledState(feedSource, user, feedIsLocked)
    const activeTable = this.GTFS_PLUS_SPEC.find(t => t.id === activeTableId)
    if (!activeTable) {
      console.warn(`Could not locate GTFS+ table with id=${activeTableId}`)
      return null
    }

    return (
      <ManagerPage itemToLock={editorActions.GTFS_PLUS_EDITOR_LOCK} ref='page'>
        <ActiveEditorLockManager
          feedSourceId={feedSourceId}
          itemToLock={editorActions.GTFS_PLUS_EDITOR_LOCK}
        />
        <Grid>
          <Row>
            <Col xs={12}>
              <ul className='breadcrumb'>
                <li><Link to='/'>Explore</Link></li>
                <li><Link to='/project'>Projects</Link></li>
                <li><Link to={`/project/${project.id}`}>{project.name}</Link></li>
                <li><Link to={`/feed/${feedSource.id}/version/${feedVersionSummary.version}/gtfsplus`}>{feedSource.name}</Link></li>
                <li className='active'>Edit GTFS+</li>
              </ul>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <PageHeader>Editing GTFS+ for {feedSource.name}
                <Button
                  bsStyle='primary'
                  bsSize='large'
                  disabled={editingIsDisabled}
                  className='pull-right'
                  onClick={this.save}>
                  <Glyphicon glyph='save' /> Save & Revalidate
                </Button>
              </PageHeader>
            </Col>
          </Row>

          <Row>
            <Col xs={2}>
              {tableData && this.GTFS_PLUS_SPEC.map((table, index) => {
                const tableLength = tableData[table.id] && tableData[table.id].length
                return (<p key={index}>
                  <OptionButton
                    active={table.id === activeTableId}
                    key={table.id}
                    className={'gtfsplus-table-button'}
                    style={{color: tableLength ? 'black' : 'grey'}}
                    title={table.id}
                    value={table.id}
                    onClick={this._selectTable}>
                    {validation && (table.id in validation)
                      ? <Glyphicon glyph='alert' style={{ color: 'red', marginRight: '8px' }} />
                      : null
                    }
                    {table.id}
                  </OptionButton>
                </p>)
              })}
            </Col>
            <Col xs={10}>
              <GtfsPlusTable
                {...this.props}
                disableEditing={editingIsDisabled}
                getGtfsEntity={this._getGtfsEntity}
                newRowsDisplayed={this._newRowsDisplayed}
                ref='activeTable'
                rows={visibleRows}
                showHelpClicked={this._showHelpClicked}
                table={activeTable}
                tableValidation={validation[activeTable.id] || []} />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
