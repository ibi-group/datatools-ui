// @flow

export type Agency = {
  agencyBrandingUrl: string,
  agencyFareUrl: string,
  agencyId: string,
  email: string,
  feedId: string,
  id: string,
  lang: string,
  name: string,
  phone: string,
  timezone: string,
  url: string
}

export type Alert = {
  end: string,
  published: boolean,
  start: string
}

export type Bounds = {
  east: number,
  north: number,
  south: number,
  west: number
}

export type Route = {
  agencyId: string,
  feedId: string,
  gtfsRouteId: string,
  gtfsRouteType: string,
  id: ?string,
  numberOfTrips?: number,
  publiclyVisible: string,
  routeBrandingUrl: string,
  routeColor: string,
  routeDesc: string,
  routeLongName: ?string,
  routeShortName: ?string,
  routeTextColor: string,
  routeUrl: string,
  status: string,
  wheelchairBoarding: string
}

export type Calendar = {
  description: string,
  endDate: string,
  feedId: string,
  friday: boolean,
  gtfsServiceId: string,
  id: string,
  monday: boolean,
  numberOfTrips: number,
  routes: Array<Route>,
  saturday: boolean,
  startDate: string,
  sunday: boolean,
  thursday: boolean,
  tuesday: boolean,
  wednesday: boolean
}

export type Point = [number, number]

export type ControlPoint = {
  distance: number,
  hidden?: boolean,
  id: string,
  permanent: boolean,
  point: Point
}

type DatatoolsSettings = {
  client_id: string,
  sidebarExpanded: boolean,
  editor: {
    map_id: string
  },
  hideTutorial: boolean
}

export type Fare = {
  currencyType: string,
  description: string,
  fareRules: Array<Object>,
  feedId: string,
  gtfsFareId: string,
  id: string,
  paymentMethod: string,
  price: number,
  transfers: number,
  transferDuration: number
}

export type Feed = {
  id: string,
  latestValidation?: {
    bounds: Bounds
  }
}

type FeedInfo = {
  id: string
}

export type FeedWithValidation = {
  latestValidation: {
    bounds: Bounds
  }
}

export type Field = {
  adminOnly: boolean,
  columnWidth: number,
  datatools: boolean,
  displayName: string,
  inputType: string,
  name: string,
  options?: Array<{text: string, value: string}>,
  required: boolean
}

export type GeoJsonPoint = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: Array<Point>
  }
}

export type StopTime = {
  defaultDwellTime: number,
  defaultTravelTime: number,
  departureTime?: number,
  shapeDistTraveled?: number,
  stopId: string,
  stop_lat?: number,
  stop_lon?: number
}

export type Pattern = {
  patternStops: Array<StopTime>,
  shape: {
    coordinates: Array<Point>
  }
}

export type GtfsAgency = {
  agency_id: string,
  agency_branding_url: string,
  agency_email: string,
  agency_fare_url: string,
  agency_lang: string,
  agency_name: string,
  agency_phone: string,
  agency_timezone: string,
  agency_url: string,
  feedId: string,
  id: string
}

export type GtfsCalendar = {
  description: string,
  end_date: string,
  feedId: string,
  friday: number,
  id: string,
  monday: number,
  numberOfTrips: number,
  routes: Array<Route>,
  saturday: number,
  service_id: string,
  start_date: string,
  sunday: number,
  thursday: number,
  tuesday: number,
  wednesday: number
}

export type GtfsFare = {
  currency_type: string,
  description: string,
  fare_id: string,
  fareRules: Array<Object>,
  feedId: string,
  id: string,
  payment_method: string,
  price: number,
  transfers: number,
  transfer_duration: number
}

export type GtfsRoute = {
  agency?: Agency,
  agency_id: string,
  feedId: string,
  id: ?string,
  numberOfTrips: number,
  publiclyVisible: string,
  route_branding_url: string,
  route_color: string,
  route_desc: string,
  route_id: string,
  route_long_name: ?string,
  route_short_name: ?string,
  route_text_color: string,
  route_type: string,
  route_url: string,
  status: string,
  wheelchair_boarding: string,
  shape?: {
    coordinates: Array<Point>
  },
  tripPatterns?: Array<Pattern>
}

export type GtfsStop = {
  agency?: Agency,
  dropOffType?: ?number,
  feedId: string,
  id?: ?string,
  location_type?: ?string,
  parent_station?: ?string,
  pickupType?: ?number,
  stop_code?: ?string,
  stop_desc?: string,
  stop_id: string,
  stop_lat: number,
  stop_lon: number,
  stop_name: string,
  stop_timezone?: ?string,
  stop_url?: ?string,
  stopId?: string,
  wheelchair_boarding?: ?string,
  zone_id?: ?string
}

export type LatLng = {
  lat: number,
  lng: number
}

export type Profile = {
  user_metadata: {
    datatools: Array<DatatoolsSettings>
  }
}

export type Project = {
  feedSources: Array<Feed>,
  id: string,
  organizationId: string
}

type ReactSelectOption = {
  label: string,
  value: string
}

export type ReactSelectOptions = Array<ReactSelectOption>

export type ScheduleException = {
  dates: Array<string>,
  feedId: string,
  id: string
}

export type EditorTableData = {
  agency: Array<GtfsAgency>,
  feedinfo: FeedInfo,
  route: Array<GtfsRoute>,
  scheduleexception?: Array<ScheduleException>
}

export type ServiceCalendar = {
  id: string,
  description: string,
  service_id: string
}

export type Entity = ScheduleException | GtfsAgency | GtfsRoute | ServiceCalendar | GtfsStop

export type Sign = {
  id: string,
  title: string,
  editedBy: string,
  editedDate: string,
  published: boolean,
  affectedEntities: Array<Entity>
}

export type Stop = {
  dropOffType?: ?number,
  feedId: string,
  gtfsStopId: string,
  id?: ?string,
  lat: number,
  locationType?: ?string,
  lon: number,
  parentStation?: ?string,
  pickupType?: ?number,
  stopCode?: ?string,
  stopDesc?: string,
  stopName: string,
  stopTimezone?: ?string,
  stopUrl?: ?string,
  wheelchairBoarding?: ?string,
  zoneId?: ?string
}

export type TimetableColumn = {
  name?: string,
  width: number,
  key: string,
  type: string,
  placeholder: string
}

export type Trip = {
  stopTimes: Array<StopTime>,
  useFrequency: boolean
}

export type User = {
  permissions: {
    hasFeedPermission: Function
  }
}

type Zones = {
  [zoneId: string]: Array<Stop>
}

export type ZoneInfo = {
  zones: Zones,
  zoneOptions: ReactSelectOptions
}
