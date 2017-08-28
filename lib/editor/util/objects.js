// @flow

import type {
  Agency,
  Calendar,
  Entity,
  Fare,
  GtfsAgency,
  GtfsCalendar,
  GtfsFare,
  GtfsRoute,
  GtfsStop,
  Route,
  Stop
} from '../../types'

export function isNew (entity: Entity): boolean {
  return entity.id === 'new' || typeof entity.id === 'undefined'
}

export function stopToGtfs (s: ?Stop): ?GtfsStop {
  if (!s) {
    return null
  }

  return {
    // datatools props
    id: s.id,
    feedId: s.feedId,
    pickupType: s.pickupType,
    dropOffType: s.dropOffType,

    // gtfs spec props
    stop_code: s.stopCode,
    stop_name: s.stopName,
    stop_desc: s.stopDesc,
    stop_lat: s.lat,
    stop_lon: s.lon,
    zone_id: s.zoneId,
    stop_url: s.stopUrl,
    location_type: s.locationType,
    parent_station: s.parentStation,
    stop_timezone: s.stopTimezone,
    wheelchair_boarding: s.wheelchairBoarding,
    stop_id: s.gtfsStopId
  }
}

export function stopFromGtfs (stop: GtfsStop): Stop {
  return {
    dropOffType: stop.dropOffType,
    feedId: stop.feedId,
    gtfsStopId: stop.stop_id,
    id: isNew(stop) ? null : stop.id,
    lat: stop.stop_lat,
    locationType: stop.location_type,
    lon: stop.stop_lon,
    parentStation: stop.parent_station,
    pickupType: stop.pickupType,
    stopCode: stop.stop_code,
    stopDesc: stop.stop_desc,
    stopName: stop.stop_name,
    stopTimezone: stop.stop_timezone,
    stopUrl: stop.stop_url,
    wheelchairBoarding: stop.wheelchair_boarding,
    zoneId: stop.zone_id
  }
}

export function routeToGtfs (route: Route): GtfsRoute {
  return {
    // datatools props
    id: route.id,
    feedId: route.feedId,
    route_branding_url: route.routeBrandingUrl,
    publiclyVisible: route.publiclyVisible,
    status: route.status,
    numberOfTrips: (route.numberOfTrips || 0),

    // gtfs spec props
    agency_id: route.agencyId,
    route_short_name: route.routeShortName,
    route_long_name: route.routeLongName,
    route_desc: route.routeDesc,
    route_type: route.gtfsRouteType,
    route_url: route.routeUrl,
    route_color: route.routeColor,
    route_text_color: route.routeTextColor,
    route_id: route.gtfsRouteId,
    wheelchair_boarding: route.wheelchairBoarding
  }
}

export function routeFromGtfs (route: GtfsRoute): Route {
  return {
    agencyId: route.agency_id,
    feedId: route.feedId,
    gtfsRouteId: route.route_id,
    gtfsRouteType: route.route_type,
    id: isNew(route) ? null : route.id,
    publiclyVisible: route.publiclyVisible,
    routeBrandingUrl: route.route_branding_url,
    routeColor: route.route_color,
    routeDesc: route.route_desc,
    routeLongName: route.route_long_name,
    routeShortName: route.route_short_name,
    routeTextColor: route.route_text_color,
    routeUrl: route.route_url,
    status: route.status,
    wheelchairBoarding: route.wheelchair_boarding
  }
}

export function agencyToGtfs (agency: Agency): GtfsAgency {
  return {
    // datatools props
    id: agency.id,
    feedId: agency.feedId,
    agency_branding_url: agency.agencyBrandingUrl,

    // gtfs spec props
    agency_id: agency.agencyId,
    agency_name: agency.name,
    agency_url: agency.url,
    agency_timezone: agency.timezone,
    agency_lang: agency.lang,
    agency_phone: agency.phone,
    agency_fare_url: agency.agencyFareUrl,
    agency_email: agency.email
  }
}

export function calendarToGtfs (cal: Calendar): GtfsCalendar {
  return {
    // datatools props
    id: cal.id,
    feedId: cal.feedId,
    description: cal.description,
    routes: cal.routes,
    numberOfTrips: cal.numberOfTrips,

    // gtfs spec props
    service_id: cal.gtfsServiceId,
    monday: cal.monday ? 1 : 0,
    tuesday: cal.tuesday ? 1 : 0,
    wednesday: cal.wednesday ? 1 : 0,
    thursday: cal.thursday ? 1 : 0,
    friday: cal.friday ? 1 : 0,
    saturday: cal.saturday ? 1 : 0,
    sunday: cal.sunday ? 1 : 0,
    start_date: cal.startDate,
    end_date: cal.endDate
  }
}

export function fareToGtfs (fare: Fare): GtfsFare {
  return {
    // datatools props
    id: fare.id,
    feedId: fare.feedId,
    description: fare.description,
    fareRules: fare.fareRules,

    // gtfs spec props
    fare_id: fare.gtfsFareId,
    price: fare.price,
    currency_type: fare.currencyType,
    payment_method: fare.paymentMethod,
    transfers: fare.transfers,
    transfer_duration: fare.transferDuration
  }
}
