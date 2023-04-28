// @flow

import moment from 'moment'
import numeral from 'numeral'

import { isExtensionEnabled } from '../../common/util/config'
import type {
  Deployment,
  Feed,
  FeedVersion,
  FeedVersionSummary,
  Project,
  SummarizedFeedVersion,
  ValidationResult,
  ValidationResultErrorCount,
  ValidationSummary
} from '../../types'
import type {FeedSourceTableComparisonColumns} from '../../types/reducers'

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
export function getFeedNames (
  versions: Array<SummarizedFeedVersion>
): string {
  return versions.map(version => version.feedSource.name).join(', ')
}

export function versionHasExpired (
  version: SummarizedFeedVersion
): boolean {
  return moment(version.validationResult.endDate).isBefore(moment())
}

export function versionHasNotBegun (
  version: SummarizedFeedVersion
): boolean {
  return moment(version.validationResult.startDate).isAfter(moment())
}

/**
 * Returns true if the given version is in the list of pinned versions for the
 * given deployment.
 */
export function versionIsPinnedInDeployment (
  deployment: Deployment,
  version: SummarizedFeedVersion
) {
  return deployment.pinnedfeedVersionIds.some(
    pinnedId => version.id === pinnedId
  )
}

// Error types that should prevent publishing a feed version to MTC. These types
// must correspond to those found at:
// https://github.com/conveyal/gtfs-lib/blob/dev/src/main/java/com/conveyal/gtfs/error/NewGTFSErrorType.java
export const BLOCKING_ERROR_TYPES = [
  'ILLEGAL_FIELD_VALUE',
  'MISSING_COLUMN',
  'REFERENTIAL_INTEGRITY',
  'SERVICE_WITHOUT_DAYS_OF_WEEK',
  'TABLE_MISSING_COLUMN_HEADERS',
  'TABLE_IN_SUBDIRECTORY',
  'WRONG_NUMBER_OF_FIELDS'
]

export function isErrorBlocking (category: ValidationResultErrorCount) {
  return isExtensionEnabled('mtc') &&
    BLOCKING_ERROR_TYPES.indexOf(category.type) !== -1
}

/**
 * A lookup of the sort value for the error severity of a validation error.
 */
export const errorPriorityLevels = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
  UNKNOWN: 3
}

/**
 * If available, sorts and returns the validation error counts according to
 * error severity and then alphabetically as a secondary sorting criteria
 */
export function getValidationResultErrorCounts (
  validationResult?: ValidationResult
): ?Array<ValidationResultErrorCount> {
  if (
    validationResult &&
      validationResult.error_counts &&
      validationResult.error_counts.length
  ) {
    validationResult.error_counts.sort((a, b) => {
      // sort on mtc blocking issues
      const aIsBlocking = isErrorBlocking(a)
      const bIsBlocking = isErrorBlocking(b)
      if (aIsBlocking) {
        // a is blocking, but b is not. Prioritize a.
        if (!bIsBlocking) return -1
      } else if (bIsBlocking) {
        // b is not blocking, but a is. Prioritize b.
        return 1
      }

      // sort on priority level if different
      if (a.priority !== b.priority) {
        return errorPriorityLevels[a.priority] - errorPriorityLevels[b.priority]
      }
      // sort on error type string if same priority level
      if (a.type < b.type) return -1
      if (a.type > b.type) return 1
      return 0
    })
    return validationResult.error_counts
  }
}

export const validationErrorIconLookup = {
  HIGH: 'times-circle',
  MEDIUM: 'exclamation-triangle',
  LOW: 'info-circle',
  UNKNOWN: 'question-circle'
}

export const mobilityDataValidationErrorMapping = {
  ERROR: 'HIGH',
  WARNING: 'MEDIUM',
  INFO: 'LOW',
  SYSTEM_ERROR: 'UNKNOWN'
}

/**
 * Get the appropriate comparison feed version or summarized feed version
 * summary given a project, the feed source within the project and a comparison
 * column.
 */
// eslint-disable-next-line complexity
export function getVersionValidationSummaryByFilterStrategy (
  project: Project,
  feedSource: Feed,
  comparisonColumn: FeedSourceTableComparisonColumns
): ?ValidationSummary {
  if (comparisonColumn === 'DEPLOYED') {
    const comparisonDeployment = project.deployments
      ? (
        (
          project.pinnedDeploymentId &&
            project.deployments.find(
              deployment => deployment.id === project.pinnedDeploymentId
            )
        ) || (
          project.deployments && project.deployments.length > 0
            ? project.deployments[0]
            : null
        )
      )
      : null

    if (comparisonDeployment && comparisonDeployment.feedVersions) {
      const comparisonVersion = comparisonDeployment.feedVersions.find(
        version => version && version.feedSource && version.feedSource.id === feedSource.id
      )
      if (!comparisonVersion && feedSource.deployedFeedVersionId) {
        // In the case that we have a feed source summary but no deployment object we must create a fake summary
        return {
          errorCount: -1,
          feedVersionId: feedSource.deployedFeedVersionId,
          startDate: feedSource.deployedFeedVersionStartDate || '1970-01-01',
          // TODO: is this sensible
          endDate: feedSource.deployedFeedVersionEndDate || '2036-12-31'
        }
      }
      return comparisonVersion && comparisonVersion.validationResult
    }
  } else if (comparisonColumn === 'PUBLISHED') {
    return feedSource.publishedValidationSummary
  }
}

export const versionsLastUpdatedComparator = (a: FeedVersionSummary, b: FeedVersionSummary) => {
  return a && b ? a.updated - b.updated : 0
}

/**
 * Formats a difference with a leading + sign, or as '=' if the difference is zero,
 * and converts large numbers into nearest thousands unit (e.g. 25000 => 25k).
 */
export function formatDelta (
  delta: number
): string {
  return delta === 0
    ? '—'
    : ((delta > 0 ? '+' : '') + numeral(delta).format('0a'))
}
