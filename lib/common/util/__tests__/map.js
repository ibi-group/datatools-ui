// @flow

import L from 'leaflet'

import { coordIsOutOfBounds } from '../../../editor/util/map'

describe('lib > common > util > map', () => {
  describe('> coordIsOutOfBounds', () => {
    const APPROX_NORTH_AMERICA_BOUNDS = L.latLngBounds([6.315299, -170.15625], [ 83.440326, -46.40625 ])
    const NULL_BOUNDS = L.latLngBounds([0, 0], [0, 0])
    const SOMEWHERE_IN_CANADA = {lat: 60.064840, lng: -99.492188}
    const NULL_ISLAND = {lat: 0, lng: 0}

    it('should correctly determine if a coordinate is outside set bounds', () => {
      expect(coordIsOutOfBounds(SOMEWHERE_IN_CANADA, APPROX_NORTH_AMERICA_BOUNDS)).toEqual(false)
      expect(coordIsOutOfBounds(NULL_ISLAND, APPROX_NORTH_AMERICA_BOUNDS)).toEqual(true)
    })
    it('should correctly determine handle strange bounds', () => {
      expect(coordIsOutOfBounds(SOMEWHERE_IN_CANADA, NULL_BOUNDS)).toEqual(true)
      expect(coordIsOutOfBounds(NULL_ISLAND, NULL_BOUNDS)).toEqual(true)
    })
    it('should correctly handle null/undefined arguments', () => {
      // $FlowFixMe this is a test
      expect(coordIsOutOfBounds(undefined, APPROX_NORTH_AMERICA_BOUNDS)).toEqual(true)
      // $FlowFixMe this is a test
      expect(coordIsOutOfBounds(SOMEWHERE_IN_CANADA, undefined)).toEqual(true)
      // $FlowFixMe this is a test
      expect(coordIsOutOfBounds(undefined, undefined)).toEqual(true)
      // $FlowFixMe this is a test
      expect(coordIsOutOfBounds()).toEqual(true)
    })
  })
})
