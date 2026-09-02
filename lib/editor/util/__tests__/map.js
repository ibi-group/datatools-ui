/* globals describe, expect, it */

import nock from 'nock'
import randomColor from 'randomcolor'
import featurecollection from 'turf-featurecollection'
import lineString from 'turf-linestring'

import { recalculateShape } from '../map'

const fixtureControlPoints = require('./fixtures/test-control-points.json')
const followStreets = true
const patternCoordinates = require('./fixtures/test-pattern-shape.json')

describe('editor > util > map >', () => {
  describe('recalculateShape >', () => {
    /**
     * Create geojson.io link for controlPoints/pattern segments.
     */
    function geojsonio (controlPoints, segments) {
      // Feature collection used for debug logging to geojson.io
      const features = featurecollection([
        ...segments.map((ps, i) => {
          const lineSegment = lineString(ps)
          lineSegment.properties.stroke = randomColor()
          lineSegment.properties.index = i
          return lineSegment
        }),
        ...controlPoints.map((cp, i) => {
          cp.point.properties.index = i
          return cp.point
        })
      ])
      const encodedString = encodeURIComponent(JSON.stringify(features))
      return `http://geojson.io/#data=data:application/json,${encodedString}`
    }

    console.log('original state: ' + geojsonio(fixtureControlPoints, patternCoordinates))

    function makeTestCase ({
      controlPoints = fixtureControlPoints,
      editType,
      index,
      graphHopperResponseFile,
      newPoint,
      resultCoordsCanBeNull = false,
      title
    }) {
      return it(
        title,
        async () => {
          // setup nock
          if (graphHopperResponseFile) {
            nock('https://graphhopper.com')
              .get(/\/api\/1\/*/)
              .reply(200, require(graphHopperResponseFile))
          }
          const result = await recalculateShape({
            controlPoints,
            editType,
            index,
            followStreets,
            newPoint,
            patternCoordinates
          })

          expect(result).toMatchSnapshot()
          // Coordinates is an array of segments, each of which is an array of
          // coordinate pairs.
          const { coordinates, updatedControlPoints } = result
          if (!resultCoordsCanBeNull) {
            console.log(`${title}: ${geojsonio(updatedControlPoints, coordinates)}`)
            expect(coordinates.length).toBeGreaterThan(0)
            coordinates.forEach(segment => {
              segment.forEach(coord => {
                // Expect each item to be a coordinate pair (lon, lat).
                expect(coord.length).toBe(2)
                expect(Math.abs(coord[0])).toBeLessThanOrEqual(180)
                expect(Math.abs(coord[1])).toBeLessThanOrEqual(90)
              })
            })
          }
        }
      )
    }

    describe('updating >', () => {
      makeTestCase({
        editType: 'update',
        index: 0,
        graphHopperResponseFile: './fixtures/graphhopper-response-update-first-stop.json',
        newPoint: [-77.92553, 42.08666],
        title: 'should update the first stop'
      })

      makeTestCase({
        editType: 'update',
        index: 4,
        graphHopperResponseFile: './fixtures/graphhopper-response-update-last-stop.json',
        newPoint: [-77.92262, 42.09828],
        title: 'should update the last stop'
      })

      makeTestCase({
        editType: 'update',
        index: 3,
        graphHopperResponseFile: './fixtures/graphhopper-response-update-middle-control-point.json',
        newPoint: [-77.92382, 42.09182],
        title: 'should update a point in the middle of the control points'
      })
    })

    describe('deleting >', () => {
      makeTestCase({
        editType: 'delete',
        index: 0,
        title: 'should delete the first stop'
      })

      makeTestCase({
        editType: 'delete',
        index: 4,
        title: 'should delete the last stop'
      })

      makeTestCase({
        controlPoints: require('./fixtures/test-control-points-with-extra-point-at-end.json'),
        editType: 'delete',
        index: 2,
        resultCoordsCanBeNull: true,
        title: 'should delete the last stop when there are control points after the last stop'
      })

      makeTestCase({
        editType: 'delete',
        index: 3,
        graphHopperResponseFile: './fixtures/graphhopper-response-delete-middle-control-point.json',
        title: 'should delete a point in the middle of the control points'
      })
    })
  })
})
