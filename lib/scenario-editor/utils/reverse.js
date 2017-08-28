// @flow

import fetch from 'isomorphic-fetch'
import qs from 'qs'

import type {LatLng} from '../../types'

// this is not the complete shape of the object
type ReverseMapzenResponse = {
  geocoding: {
    query: {
      "point.lat": number,
      "point.lon": number
    },
    timestamp: number
  },
  type: "FeatureCollection",
  features: Array<{
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [number, number]
    },
    properties: {
      name: string,
      confidence: number,
      distance: number,
      accuracy: string,
      country: string,
      macroregion: string,
      region: string,
      locality: string,
      neighbourhood: string,
      label: string
    }
  }>
}

type ReverseEsriResponse = {
  address: {
    Match_addr: string,
    LongLabel: string,
    ShortLabel: string,
    Addr_type: string,
    Type: string,
    PlaceName: string,
    AddNum: string,
    Address: string,
    Block: string,
    Sector: string,
    Neighborhood: string,
    District: string,
    City: string,
    MetroArea: string,
    Subregion: string,
    Region: string,
    Territory: string,
    Postal: string,
    PostalExt: string,
    CountryCode: string
  },
  location: {
    x: number,
    y: number,
    spatialReference: {
      wkid: number,
      latestWkid: number
    }
  }
}

export async function reversePelias (point: LatLng): Promise<ReverseMapzenResponse> {
  const location = {lon: point.lng, lat: point.lat}
  const MAPZEN_TURN_BY_TURN_KEY = process.env.MAPZEN_TURN_BY_TURN_KEY
  const params = {
    api_key: MAPZEN_TURN_BY_TURN_KEY,
    ...location
  }
  const url = `https://search.mapzen.com/v1/reverse?${qs.stringify(params)}`
  const response = await fetch(url)
  return await response.json()
}

export async function reverseEsri (point: LatLng): Promise<ReverseEsriResponse> {
  const params = {
    location: `${point.lng},${point.lat}`,
    returnIntersection: true,
    f: 'pjson'
  }
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?${qs.stringify(params)}`
  const response = await fetch(url)
  return await response.json()
}
