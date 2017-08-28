// @flow

import objectPath from 'object-path'

import type {Profile} from '../../types'

export const getUserMetadataProperty = (
  profile: Profile,
  propertyString: string
) => {
  const CLIENT_ID = process.env.AUTH0_CLIENT_ID
  const datatools = objectPath.get(profile, 'user_metadata.datatools')
  const application =
    datatools && datatools.find(d => d.client_id === CLIENT_ID)
  return objectPath.get(application, propertyString)
}
