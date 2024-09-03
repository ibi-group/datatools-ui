// @flow

import objectPath from 'object-path'

import type { AccountTypes, DatatoolsSettings, Profile, UserProfile } from '../../types'
import type { AppState } from '../../types/reducers'

/**
 * Predicate that determines whether a settings object correspond to the configured Auth0 client.
 */
export const isSettingForThisClient = (settings: DatatoolsSettings) => {
  const clientId = process.env.AUTH0_CLIENT_ID
  if (!clientId) throw new Error('L’id Auth0 doit être configurée.')

  return settings.client_id === clientId
}

/**
 * Obtains the entry for the user's app_metadata.datatools (in Auth0) that corresponds to the configured client,
 * or null if no such entry exists.
 */
export const getSettingsForThisClient = (allClientSettings?: ?Array<DatatoolsSettings>): ?DatatoolsSettings =>
  allClientSettings && allClientSettings.find(isSettingForThisClient)

/**
 * Variant of above method that takes in a UserProfile object.
 */
export const getSettingsFromProfile = (profile: ?UserProfile): ?DatatoolsSettings =>
  profile &&
  profile.app_metadata &&
  getSettingsForThisClient(profile.app_metadata.datatools)

export const getUserMetadataProperty = (
  profile: ?Profile,
  propertyString: string
) => {
  const datatools = objectPath.get(profile, 'user_metadata.datatools')
  const application = getSettingsForThisClient(datatools)
  return objectPath.get(application, propertyString)
}

/**
 * Gets the configured account types
 */
export function getAccountTypes (state: AppState): AccountTypes {
  const { appInfo } = state.status
  const { licensing } = (appInfo && appInfo.config.modules) || {}
  return (licensing && licensing.enabled && licensing.account_types) || {}
}
