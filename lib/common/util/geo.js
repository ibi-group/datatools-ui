// @flow

import type {Bounds, Feed, FeedWithValidation} from '../../types'

export function getFeedsBounds (feeds: Array<Feed>): ?Bounds {
  const feedsWithBounds: Array<FeedWithValidation> = ((feeds.filter(
    (feed: Feed) => feed.latestValidation && feed.latestValidation.bounds
  ): any): Array<FeedWithValidation>)
  if (feedsWithBounds.length === 1) {
    return feedsWithBounds[0].latestValidation.bounds
  } else if (feedsWithBounds.length === 0) {
    return null
  } else {
    const bounds: Bounds = feedsWithBounds[0].latestValidation.bounds
    feedsWithBounds.forEach((feed: FeedWithValidation) => {
      const curFeedBounds: Bounds = feed.latestValidation.bounds
      if (curFeedBounds.east > bounds.east) {
        bounds.east = curFeedBounds.east
      }
      if (curFeedBounds.north > bounds.north) {
        bounds.north = curFeedBounds.north
      }
      if (curFeedBounds.south < bounds.south) {
        bounds.south = curFeedBounds.south
      }
      if (curFeedBounds.west < bounds.west) {
        bounds.west = curFeedBounds.west
      }
    })
    return bounds
  }
}

export function convertToArrayBounds (bounds: ?Bounds) {
  if (!bounds) throw new Error('Des limites valides doivent être définies ({north, south, east, west})')
  else return [[bounds.north, bounds.east], [bounds.south, bounds.west]]
}
