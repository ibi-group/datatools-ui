// @flow

import objectPath from 'object-path'

import {getConfigProperty} from './config'

import type {Feed} from '../../types'

export function getFeed (feeds: ?Array<Feed>, id: string): ?Feed {
  // console.log(feeds, id)
  // TODO: move use_extension to extension enabled??
  const useMtc: boolean =
    getConfigProperty('modules.gtfsapi.use_extension') === 'mtc'
  const feed = feeds
    ? feeds.find(
        (feed: Feed): boolean =>
          useMtc
            ? objectPath.get(feed, 'externalProperties.MTC.AgencyId') === id
            : feed.id === id
      )
    : null
  return feed
}

export function getFeedId (feed: ?Feed): ?string {
  const useMtc: boolean =
    getConfigProperty('modules.gtfsapi.use_extension') === 'mtc'
  return !feed
    ? null
    : useMtc ? objectPath.get(feed, 'externalProperties.MTC.AgencyId') : feed.id
}

export function getAlertsUrl (): string {
  return getConfigProperty('modules.alerts.use_extension') === 'mtc'
    ? getConfigProperty('extensions.mtc.rtd_api') + '/ServiceAlert'
    : '/api/manager/secure/alerts'
}

export function getSignConfigUrl (): string {
  return getConfigProperty('modules.sign_config.use_extension') === 'mtc'
    ? getConfigProperty('extensions.mtc.rtd_api') + '/DisplayConfiguration'
    : '/api/manager/secure/displays'
}

export function getDisplaysUrl (): string {
  return getConfigProperty('modules.sign_config.use_extension') === 'mtc'
    ? getConfigProperty('extensions.mtc.rtd_api') + '/Display'
    : '/api/manager/secure/displays'
}
