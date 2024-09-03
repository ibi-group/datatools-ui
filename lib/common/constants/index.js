// @flow

const SECURE: string = 'secure/'
export const API_PREFIX: string = `/api/manager/`
export const SECURE_API_PREFIX: string = `${API_PREFIX}${SECURE}`
export const GTFS_GRAPHQL_PREFIX: string = `${SECURE_API_PREFIX}gtfs/graphql`
export const EDITOR_PREFIX: string = `/api/editor/`
export const SECURE_EDITOR_PREFIX: string = `${EDITOR_PREFIX}${SECURE}`
export const DEFAULT_DESCRIPTION = 'Outil de gestion, d’édition, de validation et de déploiement de GTFS.'
export const DEFAULT_LOGO = 'https://d2tyb7byn1fef9.cloudfront.net/ibi_group_black-512x512.png'
export const DEFAULT_LOGO_SMALL = 'https://d2tyb7byn1fef9.cloudfront.net/ibi_group-128x128.png'
export const DEFAULT_TITLE = 'DataHub Editor'

export const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || ''
export const AUTH0_CONNECTION_NAME = process.env.AUTH0_CONNECTION_NAME || ''
export const AUTH0_DEFAULT_SCOPE = 'app_metadata profile email openid user_metadata'
export const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || ''
export const AUTH0_DISABLED = Boolean(process.env.DISABLE_AUTH)

export const AUTO_DEPLOY_TYPES = Object.freeze({
  ON_FEED_FETCH: 'ON_FEED_FETCH',
  ON_PROCESS_FEED: 'ON_PROCESS_FEED'
})

export const FETCH_FREQUENCIES = Object.freeze({
  MINUTES: 'MINUTES',
  HOURS: 'HOURS',
  DAYS: 'DAYS'
})

export const FREQUENCY_INTERVALS = Object.freeze({
  [FETCH_FREQUENCIES.MINUTES]: [5, 10, 15, 30],
  [FETCH_FREQUENCIES.HOURS]: [1, 6, 12],
  [FETCH_FREQUENCIES.DAYS]: [1, 2, 7, 14]
})

export const RETRIEVAL_METHODS = Object.freeze({
  MANUALLY_UPLOADED: 'MANUALLY_UPLOADED',
  FETCHED_AUTOMATICALLY: 'FETCHED_AUTOMATICALLY',
  PRODUCED_IN_HOUSE: 'PRODUCED_IN_HOUSE',
  PRODUCED_IN_HOUSE_GTFS_PLUS: 'PRODUCED_IN_HOUSE_GTFS_PLUS',
  SERVICE_PERIOD_MERGE: 'SERVICE_PERIOD_MERGE',
  REGIONAL_MERGE: 'REGIONAL_MERGE',
  VERSION_CLONE: 'VERSION_CLONE'
})

export const FEED_TRANSFORMATION_TYPES = Object.freeze({
  DELETE_RECORDS: 'DeleteRecordsTransformation',
  NORMALIZE_FIELD: 'NormalizeFieldTransformation',
  REPLACE_FILE_FROM_STRING: 'ReplaceFileFromStringTransformation',
  REPLACE_FILE_FROM_VERSION: 'ReplaceFileFromVersionTransformation'
})
