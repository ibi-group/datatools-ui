// @flow

import moment from 'moment'

import type {FeedVersion, ValidationResult} from '../../types'

export function getTableFatalExceptions (version: FeedVersion): Array<any> {
  const tableFatalExceptions = []
  for (const key in version.feedLoadResult) {
    if (version.feedLoadResult.hasOwnProperty(key)) {
      const loadItem = version.feedLoadResult[key]
      if (loadItem && loadItem.fatalException) {
        tableFatalExceptions.push({
          tableName: key,
          ...loadItem
        })
        break
      }
    }
  }
  return tableFatalExceptions
}

/** Checks whether error count has been fetched for feed version. */
export function isErrorCountFetched (result: ValidationResult) {
  return !!(result && result.error_counts)
}

/**
 * Get string containing comma-separated feed source names from versions list.
 */
export function getFeedNames (versions: Array<FeedVersion>): string {
  return versions.map(version => version.feedSource.name).join(', ')
}

export function versionHasExpired (version: FeedVersion): boolean {
  return moment(version.validationResult.endDate).isBefore(moment())
}

export function versionHasNotBegun (version: FeedVersion): boolean {
  return moment(version.validationResult.startDate).isAfter(moment())
}

// Error types that should prevent publishing a feed version to MTC. These types
// must correspond to those found at:
// https://github.com/conveyal/gtfs-lib/blob/dev/src/main/java/com/conveyal/gtfs/error/NewGTFSErrorType.java
export const BLOCKING_ERROR_TYPES = [
  'ILLEGAL_FIELD_VALUE',
  'TABLE_IN_SUBDIRECTORY',
  'WRONG_NUMBER_OF_FIELDS',
  'MISSING_COLUMN',
  'TABLE_MISSING_COLUMN_HEADERS',
  'REFERENTIAL_INTEGRITY'
]

export const versionsLastUpdatedComparator = (a: FeedVersion, b: FeedVersion) => {
  if (a.updated < b.updated) return -1
  if (a.updated > b.updated) return 1
  return 0
}
