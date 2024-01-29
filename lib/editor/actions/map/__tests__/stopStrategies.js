import clone from 'lodash/cloneDeep'

import { updateShapeDistTraveled } from '../stopStrategies'

const loopControlPoints = require('./fixtures/loop-ctrl-points.json')
const loopPatternSegments = require('./fixtures/loop-pattern-segments.json')
const loopPatternStops = require('./fixtures/loop-pattern-stops.json')

describe('editor > actions > stopStrategies', () => {
  describe('updateShapeDistTraveled', () => {
    it('should populate distance traveled in a loop pattern', () => {
      const clonedPatternStops = clone(loopPatternStops)
      updateShapeDistTraveled(loopControlPoints, loopPatternSegments, clonedPatternStops)

      expect(clonedPatternStops[0].shapeDistTraveled).toBe(0)

      // Traveled distance should be in strict ascending order.
      for (let i = 1; i < clonedPatternStops.length; i++) {
        expect(clonedPatternStops[i].shapeDistTraveled).toBeGreaterThan(clonedPatternStops[i - 1].shapeDistTraveled)
      }

      // The pattern contains a loop, so the total distance traveled from pattern start
      // should be populated as opposed to the distance when hitting a repeated stop the first time.
      expect(clonedPatternStops[23].stopId).toBe(clonedPatternStops[0].stopId)
      expect(clonedPatternStops[23].shapeDistTraveled).toBe(184921.39475283914)

      expect(clonedPatternStops[21].stopId).toBe(clonedPatternStops[2].stopId)
      expect(clonedPatternStops[2].shapeDistTraveled).toBe(1621.2549997010212)
      expect(clonedPatternStops[21].shapeDistTraveled).toBe(183802.09138428463)

      // See other individual computed traveled distances in snapshot.
      expect(clonedPatternStops).toMatchSnapshot()
    })
  })
})
