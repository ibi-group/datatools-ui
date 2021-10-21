// @flow

import clone from 'lodash/cloneDeep'

import UserPermissions from '../../../lib/common/user/UserPermissions'
import UserSubscriptions from '../../../lib/common/user/UserSubscriptions'
import type {
  Deployment,
  FeedVersion,
  Project,
  SummarizedFeedVersion
} from '../../../lib/types'

let COUNTER = 0

/**
 * Make a mock deployment given a project and some FeedVersions. This is a
 * function so that circular references can be defined.
 */
export function makeMockDeployment (
  project: Project,
  feedVersions: Array<FeedVersion> = []
): Deployment {
  return {
    customBuildConfig: null,
    customRouterConfig: null,
    dateCreated: 1553292345720,
    deployedTo: null,
    deployJobSummaries: [],
    ec2Instances: [],
    feedSourceId: null,
    // need to map FeedVersion to SummarizedFeedVersion
    feedVersions: (feedVersions.map(
      (version: FeedVersion): SummarizedFeedVersion => (
        {
          feedSource: version.feedSource,
          id: version.id,
          nextVersionId: version.nextVersionId,
          previousVersionId: version.previousVersionId,
          updated: version.updated,
          validationResult: version.validationSummary,
          version: version.version
        }
      )
    ): Array<SummarizedFeedVersion>),
    // Use counter in ID to avoid duplicate key warnings.
    id: `mock-deployment-id-${COUNTER++}`,
    invalidFeedSources: [],
    lastDeployed: null,
    lastUpdated: 1553292345726,
    latest: null,
    name: 'mock-deployment',
    organizationId: null,
    osmExtractUrl: null,
    otpCommit: null,
    otpVersion: null,
    pinnedfeedVersionIds: [],
    projectId: project.id,
    projectBounds: {east: 0, west: 0, north: 0, south: 0},
    routerId: null,
    skipOsmExtract: false,
    tripPlannerVersion: 'OTP_1',
    peliasUpdate: null,
    peliasResetDb: null,
    peliasWebhookUrl: null,
    peliasCsvFiles: [],
    user: null
  }
}

// a mock project without any feeds or deployments
export const mockProject = {
  autoFetchFeeds: true,
  autoFetchHour: 0,
  autoFetchMinute: 0,
  autoDeploy: false,
  autoDeployTypes: [],
  autoDeployWithCriticalErrors: false,
  bounds: null,
  buildConfig: {
    fares: null,
    fetchElevationUS: null,
    stationTransfers: null,
    subwayAccessTime: null
  },
  dateCreated: 1526305321824,
  defaultTimeZone: null,
  deployments: [],
  feedSources: [],
  id: 'mock-project-id',
  lastUpdated: 1553236399556,
  labels: [],
  name: 'mock-project',
  organizationId: null,
  otpServers: [],
  pinnedDeploymentId: null,
  routerConfig: {
    carDropoffTime: null,
    numItineraries: null,
    requestLogFile: null,
    stairsReluctance: null,
    updaters: null,
    walkSpeed: null
  },
  useCustomOsmBounds: false,
  user: null
}

// a mock feed with a version
export const mockFeedWithVersion = {
  dateCreated: 1536195264564,
  deployable: false,
  editorNamespace: 'gzek_ztquwiwjmselpeswgbsrre',
  externalProperties: {},
  id: 'mock-feed-with-version-id',
  isPublic: false,
  lastFetched: 1543389038810,
  lastUpdated: 1543389038810,
  latestValidation: {
    agencies: null,
    agencyCount: 1,
    avgDailyRevenueTime: 0,
    bounds: {
      north: 39.0486949672717,
      south: 38.92884,
      east: -76.481211,
      west: -76.5673055566884
    },
    endDate: '20190801',
    errorCount: 78,
    feedVersionId: 'mock-feed-version-id',
    loadFailureReason: null,
    loadStatus: 'SUCCESS',
    routeCount: 10,
    startDate: '20180801',
    stopCount: 237,
    stopTimesCount: 11170,
    tripCount: 415
  },
  latestVersionId: 'mock-feed-version-id',
  labelIds: [],
  name: 'test feed with a version',
  noteCount: 0,
  organizationId: null,
  projectId: mockProject.id,
  publishedVersionId: null,
  retrievalMethod: 'MANUALLY_UPLOADED',
  s3Url: null,
  snapshotVersion: null,
  transformRules: [],
  url: 'http://mdtrip.org/googletransit/AnnapolisTransit/google_transit.zip',
  user: null,
  versionCount: 1
}

// a mock feed with no versions
export const mockFeedWithoutVersion = {
  dateCreated: 1544831411569,
  deployable: true,
  editorNamespace: null,
  externalProperties: {},
  id: 'mock-feed-without-version-id',
  isPublic: false,
  lastFetched: null,
  name: 'test feed with no version',
  labelIds: [],
  noteCount: 0,
  organizationId: null,
  projectId: mockProject.id,
  publishedVersionId: null,
  retrievalMethod: 'FETCHED_AUTOMATICALLY',
  s3Url: null,
  snapshotVersion: null,
  transformRules: [],
  url: null,
  user: null,
  versionCount: 0
}

// a mock feedversion that has validation data
export const mockFeedVersion = {
  dateCreated: 1543389038810,
  feedLoadResult: {
    agency: {
      errorCount: 0,
      fatalException: null,
      fileSize: 259,
      rowCount: 1
    },
    calendar: {
      errorCount: 0,
      fatalException: null,
      fileSize: 240,
      rowCount: 4
    },
    calendarDates: {
      errorCount: 0,
      fatalException: null,
      fileSize: 439,
      rowCount: 24
    },
    completionTime: 1543389374849,
    errorCount: 0,
    fareAttributes: {
      errorCount: 0,
      fatalException: null,
      fileSize: 121,
      rowCount: 3
    },
    fareRules: {
      errorCount: 0,
      fatalException: null,
      fileSize: 202,
      rowCount: 10
    },
    fatalException: null,
    feedInfo: {
      errorCount: 0,
      fatalException: null,
      fileSize: 144,
      rowCount: 1
    },
    filename: '/tmp/gtfs-uploads/Annapolis_Transit_-20181127T231038-08-247d501a-3341-43a3-89f5-268a593ff0a3.zip',
    frequencies: {
      errorCount: 0,
      fatalException: null,
      fileSize: 152,
      rowCount: 3
    },
    loadTimeMillis: 335440,
    routes: {
      errorCount: 0,
      fatalException: null,
      fileSize: 651,
      rowCount: 10
    },
    shapes: {
      errorCount: 0,
      fatalException: null,
      fileSize: 337059,
      rowCount: 9470
    },
    stops: {
      errorCount: 0,
      fatalException: null,
      fileSize: 18627,
      rowCount: 237
    },
    stopTimes: {
      errorCount: 0,
      fatalException: null,
      fileSize: 303375,
      rowCount: 11170
    },
    transfers: {
      errorCount: 0,
      fatalException: null,
      fileSize: 0,
      rowCount: 0
    },
    trips: {
      errorCount: 0,
      fatalException: null,
      fileSize: 26391,
      rowCount: 415
    },
    uniqueIdentifier: 'ugez_nbyelwgcecgmjjabppvknj'
  },
  feedSource: mockFeedWithVersion,
  fileSize: 126865,
  fileTimestamp: 1533824462000,
  id: 'mock-feed-version-id',
  lastUpdated: 1543389038810,
  name: '11/27/2018 23:10 Version',
  namespace: 'ugez_nbyelwgcecgmjjabppvknj',
  nextVersionId: null,
  noteCount: 0,
  notes: [],
  previousVersionId: null,
  processedByExternalPublisher: null,
  originNamespace: null,
  retrievalMethod: 'FETCHED_AUTOMATICALLY',
  sentToExternalPublisher: null,
  updated: 1543389038810,
  user: 'mock-user@conveyal.com',
  validationResult: {
    boundsWithoutOutliers: {
      maxLat: 0,
      maxLon: 0,
      minLat: 0,
      minLon: 0
    },
    dailyBusSeconds: [424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 0, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 0, 424020, 424020, 424020, 233040, 121680, 424020, 0, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 121680, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 545700, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 0, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020],
    dailyMetroSeconds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    dailyRailSeconds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    dailyTotalSeconds: [424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 0, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 0, 424020, 424020, 424020, 233040, 121680, 424020, 0, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 121680, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 121680, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 545700, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 0, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020, 424020, 233040, 121680, 424020, 424020, 424020, 424020],
    dailyTramSeconds: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    dailyTripCounts: [250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 55, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 55, 250, 250, 250, 250, 123, 55, 250, 250, 250, 0, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 0, 250, 250, 250, 123, 55, 250, 0, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 55, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 55, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 55, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 305, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 0, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250, 250, 123, 55, 250, 250, 250, 250],
    declaredEndDate: null,
    declaredStartDate: null,
    errorCount: 78,
    fatalException: null,
    firstCalendarDate: '20180801',
    fullBounds: {
      maxLat: 39.0486949672717,
      maxLon: -76.481211,
      minLat: 38.92884,
      minLon: -76.5673055566884
    },
    lastCalendarDate: '20190801',
    validationTime: 719
  },
  validationSummary: {
    agencies: null,
    agencyCount: 1,
    avgDailyRevenueTime: 0,
    bounds: {
      east: -76.481211,
      north: 39.0486949672717,
      south: 38.92884,
      west: -76.5673055566884
    },
    endDate: '20190801',
    errorCount: 78,
    feedVersionId: 'mock-feed-version-id',
    loadFailureReason: null,
    loadStatus: 'SUCCESS',
    routeCount: 10,
    startDate: '20180801',
    stopCount: 237,
    stopTimesCount: 11170,
    tripCount: 415
  },
  version: 1
}

/**
 * A mock project with a feed source and deployment, but in an unloaded state
 */
export const mockProjectWithDeploymentUnloaded = clone(mockProject)
mockProjectWithDeploymentUnloaded.id = 'mock-project-with-deployments-id'
mockProjectWithDeploymentUnloaded.name = 'mock-project-with-deployments'

/**
 * A mock project with a feed soure and deployment that are already loaded
 */
export const mockProjectWithDeployment = clone(mockProject)
mockProjectWithDeployment.id = 'mock-project-with-deployments-id'
mockProjectWithDeployment.name = 'mock-project-with-deployments'

export const mockDeployment = makeMockDeployment(
  mockProjectWithDeployment,
  [mockFeedVersion]
)
mockProjectWithDeployment.deployments.push(mockDeployment)
mockProjectWithDeployment.feedSources.push(mockFeedWithVersion)

/***************************************************************************
 User helpers
 ***************************************************************************/

/**
 * Creates a mock manager user state based off of a mock auth0 response.
 */
function makeUser (profile) {
  return {
    isCheckingLogin: false,
    token: 'mock-token',
    profile,
    permissions: new UserPermissions(profile.app_metadata.datatools),
    recentActivity: null,
    redirectOnSuccess: null,
    subscriptions: new UserSubscriptions(profile.app_metadata.datatools)
  }
}

// a mock auth0 response for an admin user
const mockAuth0Response = {
  email: 'mock-user@conveyal.com',
  email_verified: true,
  clientID: 'mock-client-id',
  user_id: 'auth0|12345',
  picture: 'https://s.gravatar.com/avatar/f8660ca52d1229e3d55e88f2db4affda?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fmu.png',
  nickname: 'mock-user',
  identities: [{
    user_id: '12345',
    provider: 'auth0',
    connection: 'Username-Password-Authentication',
    isSocial: false
  }],
  updated_at: '2019-03-21T19:05:30.180Z',
  created_at: '2016-03-04T18:59:22.569Z',
  name: 'mock-user@conveyal.com',
  user_metadata: {
    lang: 'en',
    datatools: [{
      client_id: 'mock-client-id',
      sidebarExpanded: false,
      hideTutorial: true,
      editor: {
        map_id: 'mapbox.streets'
      }
    }]
  },
  last_password_reset: '2017-07-13T13:58:01.021Z',
  jti: 'gibberish',
  app_metadata: {
    datatools: [{
      permissions: [{
        type: 'administer-application'
      }],
      projects: [],
      client_id: 'mock-client-id',
      subscriptions: [],
      organizations: []
    }]
  },
  persistent: {},
  sub: 'auth0|12345'
}

// a mock manager user state with an admin user
export const mockAdminUser = makeUser(mockAuth0Response)
