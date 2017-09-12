export function isNew (entity) {
  return entity.id === 'new' || typeof entity.id === 'undefined'
}

export function stopToGtfs (s) {
  if (!s) {
    return null
  }
  return {
    // datatools props
    id: s.id,
    feedId: s.feedId,
    bikeParking: s.bikeParking,
    carParking: s.carParking,
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

export function stopFromGtfs (stop) {
  return {
    gtfsStopId: stop.stop_id,
    stopCode: stop.stop_code,
    stopName: stop.stop_name,
    stopDesc: stop.stop_desc,
    lat: stop.stop_lat,
    lon: stop.stop_lon,
    zoneId: stop.zone_id,
    stopUrl: stop.stop_url,
    locationType: stop.location_type,
    parentStation: stop.parent_station,
    stopTimezone: stop.stop_timezone,
    wheelchairBoarding: stop.wheelchair_boarding,
    bikeParking: stop.bikeParking,
    carParking: stop.carParking,
    pickupType: stop.pickupType,
    dropOffType: stop.dropOffType,
    feedId: stop.feedId,
    id: isNew(stop) ? null : stop.id
  }
}

export function routeToGtfs (route) {
  return {
    // datatools props
    id: route.id,
    feedId: route.feedId,
    route_branding_url: route.routeBrandingUrl,
    publiclyVisible: route.publiclyVisible,
    status: route.status,
    numberOfTrips: route.numberOfTrips,

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

export function routeFromGtfs (route) {
  return {
    gtfsRouteId: route.route_id,
    agencyId: route.agency_id,
    feedId: route.feedId,
    routeBrandingUrl: route.route_branding_url,
    publiclyVisible: route.publiclyVisible,
    status: route.status,

    routeShortName: route.route_short_name,
    routeLongName: route.route_long_name,
    routeDesc: route.route_desc,
    gtfsRouteType: route.route_type,
    routeUrl: route.route_url,
    routeColor: route.route_color,
    routeTextColor: route.route_text_color,
    wheelchairBoarding: route.wheelchair_boarding,
    id: isNew(route) ? null : route.id
  }
}

export function agencyToGtfs (agency) {
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

export function calendarToGtfs (cal) {
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

export function fareToGtfs (fare) {
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
