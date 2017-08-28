/* globals describe, expect, it */

import * as stats from '../stats'

describe('gtfs > util > stats', () => {
  it('formatSpeed should work', () => {
    expect(stats.formatSpeed(123)).toEqual('275')
  })
})
