// flow-typed signature: 801d87d0bccd96d1e1a9c0fd6a351c79
// flow-typed version: <<STUB>>/@conveyal/lonlat_v^1.3.0/flow_v0.37.0

declare module '@conveyal/lonlat' {
  declare type coordinatesInput = [number, number]
  declare type objectInput = {
    lat?: number,
    latitude?: number,
    lon?: number,
    lng?: number,
    longitude?: number
  }
  declare type pointInput = {x: number, y: number}
  declare type standardizedLonLat = {
    lat: number,
    lon: number
  }

  declare export default function normalize(mixed): standardizedLonLat

  declare export function isEqual(mixed, mixed, ?number): boolean
  declare export function print(mixed): string
  declare export function toCoordinates(mixed): [number, number]
  declare export function toLeaflet(mixed): {lat: number, lng: number}
}
