// @flow

import moment from 'moment'
import {get} from 'object-path'

import type {
  Bounds,
  Feed,
  FeedVersion,
  Project,
  ValidationSummary
} from '../../types'
import type {
  FeedSourceTableFilterCountStrategies,
  FeedSourceTableSortStrategiesWithOrders,
  ManagerUserState,
  ProjectFilter,
  ProjectsState
} from '../../types/reducers'

import {getVersionValidationSummaryByFilterStrategy} from './version'

/**
 * Sort function that compares a field that might be datetimes. If ascending is
 * set to false, the entities will be sorting in descending order. Empty entries
 * are always sent to the bottom.
 */
function momentSort (field: string, ascending: boolean = true) {
  return (a, b) => {
    const aVal = get(a, field)
    const bVal = get(b, field)
    if (!aVal && !bVal) return 0
    if (!bVal) return -1
    if (!aVal) return 1
    const aMoment = moment(aVal)
    const bMoment = moment(bVal)
    if (!aMoment.isValid() && !bMoment.isValid()) return 0
    if (!bMoment.isValid()) return -1
    if (!aMoment.isValid()) return 1
    return ascending
      ? aMoment.unix() - bMoment.unix()
      : bMoment.unix() - aMoment.unix()
  }
}

/**
 * Sort by a numeric field, but always have empty values be at the bottom.
 */
function numericSort (field: string, ascending: boolean = true) {
  return (a, b) => {
    const aVal = get(a, field)
    const bVal = get(b, field)
    if (!aVal && !bVal) return 0
    if (!bVal) return -1
    if (!aVal) return 1
    return ascending ? aVal - bVal : bVal - aVal
  }
}

/**
 * An enumration of feed sort options and their respective sorting strategy
 */
export const feedSortOptions: {
  [FeedSourceTableSortStrategiesWithOrders]: (Feed, Feed) => number
} = {
  'alphabetically-asc': (a, b) => a.name.localeCompare(b.name),
  'alphabetically-desc': (a, b) => b.name.localeCompare(a.name),
  'endDate-asc': momentSort('latestValidation.endDate'),
  'endDate-desc': momentSort('latestValidation.endDate', false),
  'startDate-asc': momentSort('latestValidation.startDate'),
  'startDate-desc': momentSort('latestValidation.startDate', false),
  'lastUpdated-asc': momentSort('lastUpdated'),
  'lastUpdated-desc': momentSort('lastUpdated', false),
  'numErrors-asc': numericSort('latestValidation.errorCount'),
  'numErrors-desc': numericSort('latestValidation.errorCount', false)
}

/**
 * A lookup of functions to verify if a version validation summary meets the
 * requirments of a particular status.
 */
export const versionStatusFilters: {
  [string]: (
    ?ValidationSummary
  ) => boolean
} = {
  'all': () => true,
  'active': (data) => !!data &&
    moment(data.startDate).isSameOrBefore(moment()) &&
    moment(data.endDate).isSameOrAfter(moment()),
  'expiring': (data) => !!data &&
    moment(data.endDate).subtract(20, 'days').isSameOrBefore(moment()) &&
    moment(data.endDate).subtract(5, 'days').isAfter(moment()),
  'expired': (data) => !!data &&
    moment(data.endDate).isSameOrBefore(moment()),
  'future': (data) => !!data &&
    moment(data.startDate).isAfter(moment())
}

export function findProjectByFeedSource (
  allProjects: ?Array<Project>,
  feedSourceId: ?string
): ?Project {
  return allProjects
    ? allProjects.find(p => {
      if (!p.feedSources) {
        return false
      }
      return p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1
    })
    : null
}

/**
 * A filter function to detemine if a feed meets the criteria of a specified
 * filter option based on the current filter count strategy.
 */
export function filterFeedByFilterCountStrategy (
  feed: Feed,
  filterCountStrategy: FeedSourceTableFilterCountStrategies,
  filterOption: string,
  project: Project
): boolean {
  let data
  switch (filterCountStrategy) {
    case 'LATEST':
      data = feed.latestValidation
      break
    case 'DEPLOYED':
    case 'PUBLISHED':
      const validationSummary = getVersionValidationSummaryByFilterStrategy(
        project,
        feed,
        filterCountStrategy
      )
      if (validationSummary) {
        data = validationSummary
      } else {
        return false
      }
      break
    default:
      return false
  }
  return versionStatusFilters[filterOption](data)
}

/**
 * Count the number of feeds that match each type of filter options based on the
 * current filter count strategy.
 */
export function getFeedFilterCounts (
  project: Project,
  filterCountStrategy: FeedSourceTableFilterCountStrategies
): {
  [string]: number
} {
  const feeds = (project && project.feedSources) || []
  const counts = Object.keys(versionStatusFilters).reduce((obj, filterOption) => {
    obj[filterOption] = feeds.filter(
      feed => filterFeedByFilterCountStrategy(
        feed,
        filterCountStrategy,
        filterOption,
        project
      )
    ).length
    return obj
  }, {})

  return counts
}

/**
 * Returns the filtered and sorted feeds according to the current filter and
 * sorting.
 */
export function getFilteredFeeds (
  feedSources: Array<Feed>,
  filter: ProjectFilter,
  project: Project,
  sort: FeedSourceTableSortStrategiesWithOrders
): Array<Feed> {
  return feedSources
    // filter by name if needed
    .filter(feedSource => {
      // make constant so flow is happy
      const _searchText = filter.searchText
      return _searchText
        ? feedSource.name.toLowerCase().includes(
          _searchText.toLowerCase()
        )
        : true
    })
    .filter(feedSource => filterFeedByFilterCountStrategy(
      feedSource,
      filter.feedSourceTableFilterCountStrategy,
      filter.filter || 'all',
      project
    ))
    // filter by label
    .filter(feedSource => {
      const labels = filter.labels
      // If no label is specified, return all
      if (!labels || labels.length === 0) return feedSource

      function labelVerify (labelToCheck) {
        return feedSource.labelIds.includes(labelToCheck)
      }

      if (filter.labelsFilterMode === 'any') {
        // Do OR by checking for one match and ignoring
        // what happens after
        return labels.find(labelVerify)
      }

      if (filter.labelsFilterMode === 'all') {
        // Do AND by ensuring that every label is found
        return labels.every(labelVerify)
      }
    })
    .sort(feedSortOptions[sort])
}

export function getChartMax (maxValue: number): number {
  return maxValue < 100 ? maxValue : Math.ceil(maxValue / 100) * 100
}

export function getChartPeriod (maxValue: number): number {
  return maxValue > 20000
    ? 5000
    : maxValue > 1000
      ? 1000
      : maxValue > 300
        ? 100
        : maxValue > 100
          ? 30
          : maxValue > 20
            ? 10
            : 3
}

export function isEditingDisabled (
  user: ManagerUserState,
  feedSource: Feed,
  project: ?Project
): boolean {
  return (
    // If any of the args are null...
    !user ||
    !feedSource ||
    !project ||
    // ...or the user does not have permission, editing is disabled.
    !user.permissions ||
    !user.permissions.hasFeedPermission(
      project.organizationId,
      project.id,
      feedSource.id,
      'edit-gtfs'
    )
  )
}

/**
 * Checks if the given value is a valid value for a latitude
 */
function isValidLatitude (n: number): {
  error?: string,
  valid: boolean
} {
  if (n <= 90 && n >= -90) {
    return { valid: true }
  } else {
    return {
      error: `Valeur attendue entre -90 et 90, valeur entrée: ${n}`,
      valid: false
    }
  }
}

/**
 * Checks if the given value is a valid value for a latitude
 */
function isValidLongitude (n: number): {
  error?: string,
  valid: boolean
} {
  if (n <= 180 && n >= -180) {
    return { valid: true }
  } else {
    return {
      error: `Valeur attendue entre -180 et 180, valeur entrée: ${n}`,
      valid: false
    }
  }
}

/**
 * Attempts to parses a string into a bounds object. The success or failure and
 * any errors that were encountered are returned.
 */
export function parseBounds (val: string): {
  bounds?: Bounds,
  errors?: Array<string>,
  valid: boolean
} {
  const errors = []

  function validateVal (val, label, validationFn) {
    const validationResult = validationFn(val)
    if (!validationResult.valid) {
      errors.push(`Valeur ${label} invalide. ${validationResult.error || ''}`)
    }
  }

  const bBox = val.split(',')
    .map(parseFloat)
    // Filter out any bad parsed values
    .filter(parsedValue => !isNaN(parsedValue))

  if (bBox.length !== 4) {
    return {
      errors: [`Nombre de valeurs incorrect. ${bBox.length} valeurs alors que 4 sont attendus.`],
      valid: false
    }
  }

  const [west, south, east, north] = bBox

  // make sure all values are valid
  validateVal(west, 'Ouest', isValidLongitude)
  validateVal(east, 'Est', isValidLongitude)
  validateVal(north, 'Nord', isValidLatitude)
  validateVal(south, 'Sud', isValidLatitude)

  if (errors.length > 0) {
    return {
      errors,
      valid: false
    }
  }

  // valid!
  const bounds = {west, south, east, north}
  return {
    bounds,
    valid: true
  }
}

/**
 * Helper function to get the index of various things from the project state.
 */
export function getIndexesFromFeed ({
  errorType,
  feedSourceId,
  feedVersionId,
  projectId,
  state
}: {
  errorType?: string,
  feedSourceId?: string,
  feedVersionId?: FeedVersion,
  projectId: string,
  state: ProjectsState
}): {
  errorIndex: number,
  projectIndex: number,
  sourceIndex: number,
  versionIndex: number
} {
  const projectIndex = state.all.findIndex(p => p.id === projectId)
  if (!feedSourceId || projectIndex < 0) {
    return { projectIndex, sourceIndex: -2, versionIndex: -2, errorIndex: -2 }
  }
  const project = state.all[projectIndex]
  if (!project.feedSources) {
    return { projectIndex, sourceIndex: -2, versionIndex: -2, errorIndex: -2 }
  }
  const sourceIndex = project.feedSources.findIndex(s => s.id === feedSourceId)
  if (!feedVersionId || sourceIndex < 0 || !project.feedSources) {
    return { projectIndex, sourceIndex, versionIndex: -2, errorIndex: -2 }
  }
  const feedSource = project.feedSources[sourceIndex]
  if (!feedSource.feedVersionSummaries) {
    return { projectIndex, sourceIndex, versionIndex: -2, errorIndex: -2 }
  }
  const versionIndex = feedSource.feedVersionSummaries.findIndex(v => v.id === feedVersionId)
  if (!errorType || !feedSource.feedVersions || versionIndex < 0) {
    return { projectIndex, sourceIndex, versionIndex, errorIndex: -2 }
  }
  const {error_counts: errorCounts} = feedSource.feedVersions[versionIndex].validationResult
  const errorIndex = errorCounts
    ? errorCounts.findIndex(e => e.type === errorType)
    : -2
  return { errorIndex, projectIndex, sourceIndex, versionIndex }
}

/**
 * Check if a project exists and has at least one deployment
 */
export function projectHasAtLeastOneDeployment (project: ?Project): boolean {
  return !!project &&
    !!project.deployments &&
    project.deployments.length > 0
}

/**
 * Check if a project exists and has at least one feed that has a published
 * feed version
 */
export function projectHasAtLeastOneFeedWithAPublishedVersion (project: ?Project): boolean {
  return !!project &&
    !!project.feedSources &&
    project.feedSources.some(feedSource => feedSource.publishedVersionId)
}

export function validationState (val: ?boolean): ?string {
  return val ? undefined : 'error'
}

/**
 * Takes a list of label IDs and returns corresponding label objects from
 * a project, should that label exist in the project
 * @param {*} labelIds  An array of strings representing label IDs
 * @param {*} project   A project containing Label objects
 * @returns
 */
export function deStringifyLabels (labelIds: Array<string>, project: Project) {
  const labels = project.labels.filter(label => labelIds.includes(label.id))
  if (labels.length !== labelIds.length) {
    console.warn('Encountered label IDs that could not be found in project!')
  }
  return labels
}
