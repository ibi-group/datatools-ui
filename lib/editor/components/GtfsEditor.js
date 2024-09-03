// @flow

import React, {Component} from 'react'

import * as activeActions from '../actions/active'
import * as editorActions from '../actions/editor'
import * as mapActions from '../actions/map'
import * as stopStrategiesActions from '../actions/map/stopStrategies'
import * as snapshotActions from '../actions/snapshots'
import * as tripActions from '../actions/trip'
import * as tripPatternActions from '../actions/tripPattern'
import CurrentStatusMessage from '../../common/containers/CurrentStatusMessage'
import ConfirmModal from '../../common/components/ConfirmModal'
import Title from '../../common/components/Title'
import CurrentStatusModal from '../../common/containers/CurrentStatusModal'
import * as userActions from '../../manager/actions/user'
import ActiveEntityList from '../containers/ActiveEntityList'
import ActiveTimetableEditor from '../containers/ActiveTimetableEditor'
import ActiveFeedInfoPanel from '../containers/ActiveFeedInfoPanel'
import {getConfigProperty} from '../../common/util/config'
import {getEntityName, getTableById} from '../util/gtfs'
import {getEditorEnabledState, GTFS_ICONS} from '../util/ui'
import type {Props as ContainerProps} from '../containers/ActiveGtfsEditor'
import ActiveEditorLockManager from '../containers/ActiveEditorLockManager'
import type {
  ControlPoint,
  Coordinates,
  Entity,
  Feed,
  FeedInfo,
  FetchStatus,
  GtfsStop,
  Pattern,
  Project
} from '../../types'
import type {
  EditSettingsState,
  EditorStatus,
  EditorTables,
  ManagerUserState,
  MapState
} from '../../types/reducers'
import type {EditorValidationIssue} from '../util/validation'

import EntityDetails from './EntityDetails'
import EditorHelpModal from './EditorHelpModal'
import EditorSidebar from './EditorSidebar'
import EditorMap from './map/EditorMap'

type Props = ContainerProps & {
  activeComponent: string,
  // FIXME activeEntity can be null at times
  activeEntity: Entity,
  activeEntityId: number,
  activePattern: Pattern,
  activePatternStops: Array<GtfsStop>,
  activeSubSubEntity: string,
  addStopAtIntersection: typeof stopStrategiesActions.addStopAtIntersection,
  addStopAtInterval: typeof stopStrategiesActions.addStopAtIntersection,
  addStopAtPoint: typeof stopStrategiesActions.addStopAtPoint,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  clearGtfsContent: typeof activeActions.clearGtfsContent,
  cloneGtfsEntity: typeof editorActions.cloneGtfsEntity,
  constructControlPoint: typeof mapActions.constructControlPoint,
  controlPoints: Array<ControlPoint>,
  createSnapshot: typeof snapshotActions.createSnapshot,
  currentPattern: Pattern,
  currentTable: string,
  deleteEntity: typeof activeActions.deleteGtfsEntity,
  editSettings: EditSettingsState,
  entities: Array<Entity>,
  entityEdited: boolean,
  feedInfo: FeedInfo,
  feedIsLocked: boolean,
  feedSource: Feed,
  feedSourceId: string,
  fetchTripPatterns: typeof tripPatternActions.fetchTripPatterns,
  fetchTripsForCalendar: typeof tripActions.fetchTripsForCalendar,
  handleControlPointDrag: typeof mapActions.handleControlPointDrag,
  handleControlPointDragEnd: typeof mapActions.handleControlPointDragEnd,
  handleControlPointDragStart: typeof mapActions.handleControlPointDragStart,
  hasRoutes: boolean,
  hideTutorial: boolean,
  loadFeedVersionForEditing: typeof snapshotActions.loadFeedVersionForEditing,
  mapState: MapState,
  namespace: string,
  newGtfsEntity: typeof editorActions.newGtfsEntity,
  offset: number,
  patternCoordinates: Array<Coordinates>,
  patternEdited: boolean,
  patternSegment: number,
  patternStop: {id: string, index: number},
  project: Project,
  refreshBaseEditorData: typeof activeActions.refreshBaseEditorData,
  removeControlPoint: typeof mapActions.removeControlPoint,
  removeEditorLock: typeof editorActions.removeEditorLock,
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  resetActiveGtfsEntity: typeof activeActions.resetActiveGtfsEntity,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActiveGtfsEntity: typeof activeActions.setActiveGtfsEntity,
  setActivePatternSegment: typeof tripPatternActions.setActivePatternSegment,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  showConfirmModal: ({body: string, onConfirm: () => void, title: string}) => void,
  sidebarExpanded: boolean,
  status: EditorStatus,
  stopLockTimer: typeof editorActions.stopLockTimer,
  subComponent: string,
  subEntity: number,
  subEntityId: number,
  subSubComponent: string,
  tableData: EditorTables,
  timetableStatus: FetchStatus, // fetchStatus
  tripPatterns: Array<Pattern>,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity,
  updateEditSetting: typeof activeActions.updateEditSetting,
  updateMapSetting: typeof mapActions.updateMapSetting,
  updatePatternStops: typeof tripPatternActions.updatePatternStops,
  updateUserData: typeof userActions.updateUserData,
  uploadBrandingAsset: typeof editorActions.uploadBrandingAsset,
  user: ManagerUserState,
  validationErrors: Array<EditorValidationIssue>,
  zoomToTarget: ?number
}

type State = {
  activeTableId: ?string
}

export default class GtfsEditor extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      activeTableId: this.props.currentTable
    })

    // Wipe any leftover state that may exist for other feed sources in editor.
    // NOTE: Clear GTFS content happens outside of refreshBaseEditorData function so
    // that it is only ever called on mount (refreshBaseEditorData is called after
    // a successful snapshot/import when starting from scratch).
    this.props.clearGtfsContent()
    this._refreshEditor()
  }

  componentDidUpdate (prevProps: Props) {
    // Detect push changes to URL (e.g., back button or direct link) and update
    // active table/entity accordingly.
    const {
      activeComponent,
      activeEntityId,
      activeSubSubEntity,
      feedSourceId,
      setActiveGtfsEntity,
      subComponent,
      subEntityId,
      subSubComponent
    } = this.props
    if (prevProps.activeComponent !== activeComponent ||
      prevProps.activeEntityId !== activeEntityId ||
      prevProps.subComponent !== subComponent ||
      prevProps.subEntityId !== subEntityId ||
      prevProps.subSubComponent !== subSubComponent ||
      prevProps.activeSubSubEntity !== activeSubSubEntity
    ) {
      setActiveGtfsEntity(feedSourceId, activeComponent, activeEntityId, subComponent, subEntityId, subSubComponent, activeSubSubEntity)
    }
  }

  // FIXME: needs to be updated for GraphQL
  componentWillReceiveProps (nextProps: Props) {
    const {
      clearGtfsContent,
      feedSourceId,
      namespace,
      removeEditorLock,
      stopLockTimer
    } = this.props
    if (nextProps.feedSourceId !== feedSourceId) {
      // Clear GTFS content if feedSource changes (i.e., user switches feed sources).
      // Remove editor lock.
      removeEditorLock(editorActions.GTFS_EDITOR_LOCK, feedSourceId, false)
      clearGtfsContent()
      // Re-establish lock for new feed source and fetch GTFS.
      this._refreshBaseEditorData(nextProps)
    } else if (this.props.feedIsLocked && namespace && nextProps.namespace === namespace) {
      // The actions below apply if content has been loaded into the GTFS editor.
      if (!nextProps.feedIsLocked) {
        // If user clicked "Re-lock feed",
        // re-establish lock for the feed source and fetch GTFS to resume editing.
        this._refreshBaseEditorData(nextProps)
      } else {
        // If the user dismissed the "Relock feed" dialog, stop the lock timer and leave the UI disabled.
        // The "Relock feed" modal will reappear next time the user switches back to the tab.
        stopLockTimer()
      }
    }
    if (namespace && nextProps.namespace !== namespace) {
      // If the editor namespace changes (not simply from null), re-fetch the GTFS.
      // There should be no need to re-lock the feed because feeds are locked by
      // feed source because there is only ever one editable namespace per feed
      // source. If this changes (i.e., more than one namespace per feed is
      // simultaneously editable), this behavior needs to be altered.
      // NOTE: The namespace could change like this if a user restores a snapshot
      // while they have the editor open.
      this._refreshBaseEditorData(nextProps, true)
    }
  }

  /**
   * Helper to refresh gtfs editor with current props.  Can be used by
   * components in the render method.
   */
  _refreshEditor = () => {
    this._refreshBaseEditorData(this.props)
  }

  _refreshBaseEditorData (props: Props, forceFetch?: boolean) {
    const {
      activeComponent,
      activeEntityId,
      activeSubSubEntity,
      feedSource,
      feedSourceId,
      refreshBaseEditorData,
      subComponent,
      subEntityId,
      subSubComponent
    } = props

    refreshBaseEditorData({
      activeComponent,
      activeEntityId,
      activeSubSubEntity,
      feedSource,
      feedSourceId,
      forceFetch,
      subComponent,
      subEntityId,
      subSubComponent
    })
  }

  showConfirmModal = (props: {body: string, onConfirm: () => void, title: string}) => {
    this.refs.confirmModal.open(props)
  }

  getEditorTitle () {
    const {activeComponent, activeEntity} = this.props
    const appName = getConfigProperty('application.title')
    let title = ''
    if (appName) title += `${appName} - `
    title += 'DataHub Editor'
    if (activeEntity) {
      title += ` - ${getEntityName(activeEntity)}`
    } else if (activeComponent) {
      const icon = GTFS_ICONS.find(i => i.id === activeComponent)
      title += ` - ${icon ? icon.label : 'unknown'}`
    }
    return title
  }

  getMapOffset (activeComponent: string, dWidth: number, activeEntityId: number, lWidth: number) {
    return activeComponent === 'feedinfo'
      ? dWidth
      : activeEntityId
        ? lWidth + dWidth
        : activeComponent
          ? lWidth
          : 0
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      activeEntityId,
      createSnapshot,
      feedIsLocked,
      feedSource,
      feedSourceId,
      hideTutorial,
      loadFeedVersionForEditing,
      mapState,
      namespace,
      routeParams,
      sidebarExpanded,
      status,
      subSubComponent,
      tableData,
      user
    } = this.props

    const { editingIsDisabled } = getEditorEnabledState(feedSource, user, feedIsLocked)
    const LIST_WIDTH = 220
    const stops: Array<GtfsStop> = getTableById(tableData, 'stop')
    const DETAILS_WIDTH = 300
    const entityDetails = activeEntityId
      ? <EntityDetails
        key='entity-details'
        offset={LIST_WIDTH}
        showConfirmModal={this.showConfirmModal}
        width={DETAILS_WIDTH}
        {...this.props} />
      : null
    return (
      <div className='GtfsEditor'>
        <Title>{this.getEditorTitle()}</Title>
        <ActiveEditorLockManager
          disableLock={!namespace}
          feedSourceId={feedSourceId}
          itemToLock={editorActions.GTFS_EDITOR_LOCK}
        />
        <EditorSidebar
          activeComponent={activeComponent}
          editingIsDisabled={editingIsDisabled}
          feedSource={feedSource} />
        {status.showEditorModal
          ? <EditorHelpModal
            createSnapshot={createSnapshot}
            feedSource={feedSource}
            hideTutorial={hideTutorial}
            loadFeedVersionForEditing={loadFeedVersionForEditing}
            isNewFeed
            refreshEditor={this._refreshEditor}
            show
            status={status} />
          : null
        }
        <div style={{
          position: 'fixed',
          left: sidebarExpanded ? 130 : 50,
          bottom: 0,
          right: 0,
          minHeight: '500px',
          top: 0}}>
          {subSubComponent === 'timetable' // && activeEntity
            ? <ActiveTimetableEditor
              route={activeEntity}
              routeParams={routeParams}
              showConfirmModal={this.showConfirmModal} />
            : activeComponent === 'feedinfo'
              ? <EntityDetails
                width={DETAILS_WIDTH}
                {...this.props} />
              : activeComponent
                ? [
                  <ActiveEntityList
                    activeComponent={activeComponent}
                    activeEntityId={activeEntityId}
                    feedSourceId={feedSourceId}
                    tableData={tableData}
                    width={LIST_WIDTH}
                    showConfirmModal={this.showConfirmModal}
                    key='entity-list' />,
                  entityDetails
                ]
                : null
          }
          <EditorMap
            offset={this.getMapOffset(activeComponent, DETAILS_WIDTH, activeEntityId, LIST_WIDTH)}
            hidden={subSubComponent === 'timetable'}
            stops={stops}
            showConfirmModal={this.showConfirmModal}
            drawStops={!!(mapState.zoom && mapState.zoom > 14)}
            zoomToTarget={mapState.target}
            {...this.props} />
          <ActiveFeedInfoPanel
            feedSourceId={feedSourceId}
            showConfirmModal={this.showConfirmModal} />
        </div>
        <CurrentStatusMessage />
        <ConfirmModal ref='confirmModal' />
        <CurrentStatusModal itemToLock={editorActions.GTFS_EDITOR_LOCK} ref='statusModal' />
      </div>
    )
  }
}
