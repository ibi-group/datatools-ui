// @flow

import moment from 'moment'

import { getFeedId } from '../../common/util/modules'

import type {Alert, AlertEntity, Project, RtdAlert, RtdEntity} from '../../types'

export const FILTERS = ['ACTIVE', 'FUTURE', 'ARCHIVED', 'DRAFT', 'ALL']

export const CAUSES = [
  'UNKNOWN_CAUSE',
  'TECHNICAL_PROBLEM',
  'STRIKE',
  'DEMONSTRATION',
  'ACCIDENT',
  'HOLIDAY',
  'WEATHER',
  'MAINTENANCE',
  'CONSTRUCTION',
  'POLICE_ACTIVITY',
  'MEDICAL_EMERGENCY',
  'OTHER_CAUSE'
]

export const modes = [
  {gtfsType: 0, name: 'Tram/LRT'},
  {gtfsType: 1, name: 'Subway/Metro'},
  {gtfsType: 2, name: 'Rail'},
  {gtfsType: 3, name: 'Bus'},
  {gtfsType: 4, name: 'Ferry'},
  {gtfsType: 5, name: 'Cable Car'},
  {gtfsType: 6, name: 'Gondola'},
  {gtfsType: 7, name: 'Funicular'}
]

export const SORT_OPTIONS = [
  {value: 'id:asc', label: 'Oldest'},
  {value: 'id:desc', label: 'Newest'},
  {value: 'title:asc', label: 'Title'},
  {value: 'title:desc', label: 'Title (reverse)'},
  {value: 'start:asc', label: 'Starts earliest'},
  {value: 'start:desc', label: 'Starts latest'},
  {value: 'end:asc', label: 'Ends earliest'},
  {value: 'end:desc', label: 'Ends latest'}
]

export const EFFECTS = [
  'UNKNOWN_EFFECT',
  'NO_SERVICE',
  'REDUCED_SERVICE',
  'SIGNIFICANT_DELAYS',
  'DETOUR',
  'ADDITIONAL_SERVICE',
  'MODIFIED_SERVICE',
  'STOP_MOVED',
  'OTHER_EFFECT'
]

export function filterAlertsByCategory (alerts: Array<Alert>, filter: string) {
  const now = moment()
  switch (filter) {
    case 'ALL':
      return alerts
    case 'ACTIVE':
      return alerts.filter((alert: Alert) =>
        moment(alert.start).isBefore(now) &&
        moment(alert.end).isAfter(now) &&
        alert.published
      )
    case 'FUTURE':
      return alerts.filter((alert: Alert) => moment(alert.start).isAfter(now))
    case 'ARCHIVED':
      return alerts.filter((alert: Alert) => moment(alert.end).isBefore(now))
    case 'DRAFT':
      return alerts.filter((alert: Alert) => !alert.published)
    default:
      return alerts
  }
}

export function mapRtdAlert (rtdAlert: RtdAlert, project: Project): Alert {
  const {
    Id: id,
    HeaderText: title,
    DescriptionText: description,
    Cause: cause,
    Effect: effect,
    EditedBy: editedBy,
    EditedDate: editedDate,
    Url: url,
    StartDateTime: start,
    EndDateTime: end,
    Published: published,
    ServiceAlertEntities: entities
  } = rtdAlert
  const alert = {
    id,
    // Alert title and description are fields we expect to have values, i.e. they are required fields.
    // If for some reason they are null, change them to empty strings so as not to upset the application
    // downstream.
    title: title || '',
    // RTD server sends back two-char new lines, which can mess up character limit counts
    // Here, we replace any of those occurrences with a single new line char.
    description: description
      ? description.replace(/(\r\n)/g, '\n')
      : '',
    cause,
    effect,
    editedBy,
    editedDate,
    url,
    start: start * 1000,
    end: end * 1000,
    published: published === 'Yes',
    affectedEntities: entities.map(ent => mapRtdEntity(ent, project))
  }
  return alert
}

function mapRtdEntity (rtdEntity: RtdEntity, project: Project): AlertEntity {
  const {
    Id: id,
    AgencyId,
    StopId,
    RouteId,
    RouteType
  } = rtdEntity
  let agency, type, mode
  // Hierarchically examine RTD entity contents and assign type based on what is
  // found. For example, the type is AGENCY if that is all the entity contains.
  if (AgencyId) {
    if (!project.feedSources) {
      console.warn('could not map Rtd Entity because feedSources is missing from project')
    } else {
      agency = project.feedSources.find(f => getFeedId(f) === AgencyId)
    }
    if (!agency) console.warn('Could not find agency for id', AgencyId)
    type = 'AGENCY'
  }
  // Stop goes ahead of route type and route because it's an optional field in
  // the below
  if (StopId) {
    type = 'STOP'
  }
  if (RouteId) {
    type = 'ROUTE'
  }
  if (RouteType !== null) {
    const defaultMode = modes.find(m => m.gtfsType === 0)
    // Catch any integers outside of 0 -7 range with default mode
    mode = modes.find(m => m.gtfsType === RouteType) || defaultMode
    type = 'MODE'
  }
  return {
    id,
    agency,
    type,
    mode,
    stop_id: StopId,
    route_id: RouteId
  }
}
