// @flow

import {latLngBounds} from 'leaflet'

import UserPermissions from '../common/user/UserPermissions'
import UserSubscriptions from '../common/user/UserSubscriptions'

import type {
  Alert,
  ControlPoint,
  FetchStatus,
  GtfsPlusValidation,
  GtfsRoute,
  GtfsStop,
  Organization,
  Pattern,
  Project,
  RecentActivity,
  ServerJob,
  ShapePoint,
  Sign,
  Trip,
  UserProfile
} from './'

type FetchStatusSubState = {
  fetchStatus: FetchStatus
}

/**
 * ----------------------------
 * Admin Reducers
 * ----------------------------
 */
export type OrganizationsState = {
  data: null | Array<Organization>,
  isFetching: boolean,
  userQueryString: ?string
}

export type AdminUsersState = {
  data: ?Array<UserProfile>,
  isFetching: boolean,
  page: number,
  perPage: number,
  userCount: number,
  userQueryString: ?string
}

export type AdminState = {
  organizations: OrganizationsState,
  users: AdminUsersState
}

/**
 * ----------------------------
 * Alert Reducers
 * ----------------------------
 */

export type ActiveState = {
  active: any
}

export type AlertFilter = {
  feedId?: ?string,
  filter: string,
  searchText: ?string,
  sort?: ?{
    direction: string,
    type: string
  }
}

export type AlertsReducerState = {
  all: Array<Alert>,
  counts: any,
  entities: Array<any>,
  fetched: boolean,
  filter: AlertFilter,
  isFetching: boolean
}

export type AlertsState = ActiveState & AlertsReducerState

/**
 * ----------------------------
 * Editor Reducers
 * ----------------------------
 */

type TypeCount = {
  count: number,
  type: string
}

export type TripCounts = {
  pattern_id: Array<TypeCount>,
  route_id: Array<TypeCount>,
  service_id: Array<TypeCount>
}

export type EditorTables = {
  agency: Array<{
    agency_id: string,
    agency_name: string,
    id: number
  }>,
  calendar: Array<{
    description: string,
    id: number,
    service_id: string
  }>,
  fares: Array<{
    fare_id: string,
    id: number,
  }>,
  feed_info: Array<{
    default_route_color: ?any,
    default_route_type: ?any,
    feed_end_date: ?any,
    feed_lang: string,
    feed_publisher_name: string,
    feed_publisher_url: string,
    feed_start_date: ?any,
    feed_version: string,
    id: number
  }>,
  routes: Array<{
    id: number,
    route_id: string,
    route_long_name: string,
    route_short_name: string,
    tripPatterns?: Array<Pattern>
  }>,
  schedule_exceptions: Array<{
    id: number,
    name: string
  }>,
  stops: Array<{
    id: number,
    stop_code: string,
    stop_id: string,
    stop_lat: number,
    stop_lon: number,
    stop_name: string,
    zone_id: string
  }>,
  trip_counts: TripCounts
}

export type LockState = {
  feedId?: ?string,
  sessionId?: ?string,
  timer?: ?IntervalID,
  timestamp?: ?string
}

export type EditorStatus = {
  baseFetched?: boolean,
  creatingSnapshot?: boolean,
  savePending?: boolean,
  saveSuccessful?: boolean,
  showEditorModal?: boolean,
  snapshotFinished?: boolean
}

export type DataStateSort = {
  direction: any,
  key: string
}

export type DataState = {
  active: {
    component?: string,
    edited?: boolean,
    entity?: any,
    entityId?: number,
    feedSourceId?: string,
    patternEdited?: boolean,
    patternSegment?: number,
    patternStop?: { id: null | string, index: null | number },
    subComponent?: string,
    subEntity?: any,
    subEntityId?: number,
    subSubComponent?: string,
    subSubEntityId?: string
  },
  lock: LockState,
  sort: DataStateSort,
  status: EditorStatus,
  tables: EditorTables
}

export type EditSettingsState = {
  addStops: boolean,
  afterIntersection: boolean,
  controlPoints: null | Array<ControlPoint>,
  currentDragId: null | string,
  distanceFromIntersection: number,
  editGeometry: boolean,
  followStreets: boolean,
  hideInactiveSegments: boolean,
  hideStopHandles: boolean,
  intersectionStep: number,
  onMapClick: string,
  patternSegments: null | Array<Coordinates>,
  shapePoints: ?Array<ShapePoint>,
  showStops: boolean,
  showTooltips: boolean,
  stopInterval: number
}

export type MapState = {
  bounds: latLngBounds,
  routesGeojson: any,
  target: ?number,
  zoom: ?number
}

export type TimetableState = {
  +activeCell: ?string,
  +edited: Array<number>,
  +hideDepartureTimes: boolean,
  +offset: number,
  +scrollIndexes: {
    +scrollToColumn: number,
    +scrollToRow: number
  },
  +selected: Array<number>,
  +status: {
    +error: boolean,
    +fetched: boolean,
    +fetching: boolean,
    scheduleId?: string
  },
  +trips: Array<Trip>
}

export type EditSettingsUndoState = {
  future: Array<EditSettingsState>,
  index: number,
  limit: number,
  past: Array<EditSettingsState>,
  present: EditSettingsState
}

export type EditorState = {
  data: DataState,
  editSettings: EditSettingsUndoState,
  mapState: MapState,
  timetable: TimetableState
}

/**
 * ----------------------------
 * Gtfs Reducers
 * ----------------------------
 */

 type Point = [number, number]

export type MapFilter = {
  bounds: [Point, Point],
  zoom: number
}

export type DateTimeFilter = {
  date: string,
  from: number,
  to: number
}

export type FilterState = {
  activeFeeds: any,
  dateTimeFilter: DateTimeFilter,
  loadedFeeds: Array<any>,
  map: MapFilter,
  patternFilter: ?string,
  permissionFilter: string,
  project: ?string,
  routeFilter: ?string,
  routeLimit: number,
  routeOffset: number,
  showAllRoutesOnMap: boolean,
  showArrivals: boolean,
  timepointFilter: boolean,
  typeFilter: Array<string>,
  version: any
}

export type ValidationPattern = {
  geometry: {
    coordinates: Array<Array<number>>,
    type: string,
  },
  name: string,
  pattern_id: string,
  route_id: string,
  route_name: string,
  shape: Array<{
    lat: number,
    lon: number
  }>,
  stops: Array<{
    stop_id: string
  }>,
  trips: Array<{
    stop_times: Array<{
      arrival_time: number,
      departure_time: number
    }>
  }>
}

export type ValidationStop = {
  location_type: ?number,
  stop_code: ?string,
  stop_desc: ?string,
  stop_id: string,
  stop_lat: number,
  stop_lon: number,
  stop_name: string,
  stop_url: ?string,
  wheelchair_boarding: ?number,
  zone_id: ?string
}

export type PatternsState = FetchStatusSubState & {
  data: {
    patterns: Array<ValidationPattern>,
    stops: Array<ValidationStop>
  }
}

export type RouteDetailsData = {
  numRoutes: number,
  routes: Array<{
    route_desc: ?string,
    route_id: string,
    route_long_name: string,
    route_short_name: string,
    stops: Array<{
      stop_id: string
    }>,
    trips: Array<{
      pattern_id: string,
      stop_times: Array<{
        arrival_time: number,
        departure_time: number
      }>
    }>
  }>
}

export type RouteListItem = {
  route_id: string,
  route_long_name: ?string,
  route_name: string,
  route_short_name: ?string
}

type AllRoutes = Array<RouteListItem>

export type AllRoutesSubState = FetchStatusSubState & {
  data: null | AllRoutes
}

export type RoutesState = {
  allRoutes: AllRoutesSubState,
  routeDetails: FetchStatusSubState & {
    data: null | RouteDetailsData
  }
}

export type ShapesState = FetchStatusSubState & {
  data: Array<any>
}

export type StopsState = FetchStatusSubState & {
  data: Array<GtfsStop>
}

export type TimetableStop = {
  stop_id: string,
  stop_name: string
}

export type TimetableData = {
  feed: ?{
    patterns: Array<{
      stops: Array<TimetableStop>,
      trips: Array<{
        direction_id: number,
        pattern_id: string,
        service_id: string,
        stop_times: Array<{
          arrival_time: ?number,
          departure_time: ?number,
          stop_id: string,
          stop_sequence: number,
          timepoint: ?boolean
        }>,
        trip_headsign: string,
        trip_id: string,
        trip_short_name: ?string
      }>
    }>
  }
}

export type TimetablesState = FetchStatusSubState & {
  data: null | TimetableData
}

export type ValidationState = FetchStatusSubState & {
  data: {[string]: any}
}

export type GtfsState = {
  filter: FilterState,
  patterns: PatternsState,
  routes: RoutesState,
  shapes: ShapesState,
  stops: StopsState,
  timetables: TimetablesState,
  validation: ValidationState
}

/**
 * ----------------------------
 * Gtfs Plus Reducers
 * ----------------------------
 */

export type GtfsPlusReducerState = {
  activeTableId: 'realtime_routes',
  currentPage: number,
  feedVersionId: null | string,
  gtfsEntityLookup: {
    [string]: GtfsStop | GtfsRoute
  },
  pageCount: number,
  recordsPerPage: number,
  tableData: null | any, // TODO specify more exact type
  timestamp: null | any, // TODO specify more exact type
  validation: ?GtfsPlusValidation,
  visibility: string
}

export type GtfsPlusStates = {
  gtfsplus: GtfsPlusReducerState
}

/**
 * ----------------------------
 * Manager Reducers
 * ----------------------------
 */

export type LanguagesState = {
  +active: any,
  +all: any
}

export type ProjectFilter = {
  filter: null | string,
  searchText: null | string
}

export type ProjectsState = {
  active: null | Project,
  all: Array<Project>,
  filter: ProjectFilter,
  isFetching: boolean
}

export type JobStatusState = {
  jobs: Array<ServerJob>,
  retired: Array<ServerJob>,
  timer: ?IntervalID,
  visible: boolean
}

export type AppInfo = null | {
  commit: string,
  repoUrl: string
}

export type ModalStatus = {
  action: string,
  body: string,
  detail: string,
  title: string
}

export type StatusState = {
  appInfo: AppInfo,
  jobMonitor: JobStatusState,
  message: ?string,
  modal: ?ModalStatus
}

export type UiState = {
  hideTutorial: boolean,
  sidebarExpanded: boolean
}

export type ManagerUserState = {
  +isCheckingLogin: boolean,
  +permissions: ?UserPermissions,
  +profile: ?UserProfile,
  +recentActivity: ?Array<RecentActivity>,
  +redirectOnSuccess: ?string,
  +subscriptions: ?UserSubscriptions,
  +token: ?string
}

export type ManagerStates = {
  languages: LanguagesState,
  projects: ProjectsState,
  status: StatusState,
  ui: UiState,
  user: ManagerUserState
}

/**
 * ----------------------------
 * Signs Reducers
 * ----------------------------
 */

export type ActiveSign = {
  active: null | Sign
}

export type SignsFilter = {
  filter: string,
  searchText: any
}

export type SignsReducerState = {
  all: Array<Sign>,
  counts: any,
  entities: Array<any>, // TODO: use more exact type
  fetched: boolean,
  filter: SignsFilter,
  isFetching: boolean
}

export type SignsState = ActiveSign & SignsReducerState

/**
 * ----------------------------
 * All Reducers
 * ----------------------------
 */

export type AppState = {
  admin: AdminState,
  alerts: AlertsState,
  editor: EditorState,
  gtfs: GtfsState,
  routing: any, // react-router state
  signs: SignsState
} & ManagerStates & GtfsPlusStates

export type RouterLocation = {
  action: string,
  hash: string,
  key: string,
  pathname: string,
  query: Object,
  search: string
}

export type RouteParams = {
  activeComponent?: string,
  activeEntityId?: string,
  activeSubSubEntity?: string,
  alertId?: string,
  deploymentId?: string,
  feedSourceId?: string,
  feedVersionId?: string,
  feedVersionIndex?: string,
  projectId?: string,
  signId?: string,
  subComponent?: string,
  subEntityId?: string,
  subSubComponent?: string,
  subpage?: string,
  subsubpage?: string
}

export type RouterProps = {
  location: RouterLocation,
  routeParams: RouteParams
}

/**
 * ----------------------------
 * Redux helpers
 * ----------------------------
 */

export type dispatchFn = any => Promise<any>
export type getStateFn = () => AppState
export type ThunkAction = (dispatch: dispatchFn, getState: getStateFn) => any
