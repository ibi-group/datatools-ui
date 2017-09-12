import objectPath from 'object-path'

import { getConfigProperty } from './config'

export const getFeed = (feeds, id) => {
  // console.log(feeds, id)
  // TODO: move use_extension to extension enabled??
  const useMtc = getConfigProperty('modules.gtfsapi.use_extension') === 'mtc'
  const feed = feeds
    ? feeds.find(f => useMtc ? objectPath.get(f, 'externalProperties.MTC.AgencyId') === id : f.id === id)
    : null
  return feed
}

export const getFeedId = (feed) => {
  const useMtc = getConfigProperty('modules.gtfsapi.use_extension') === 'mtc'
  return !feed
    ? null
    : useMtc
    ? objectPath.get(feed, 'externalProperties.MTC.AgencyId')
    : feed.id
}

export const getAlertsUrl = () => {
  return getConfigProperty('modules.alerts.use_extension') === 'mtc' ? getConfigProperty('extensions.mtc.rtd_api') + '/ServiceAlert' : '/api/manager/secure/alerts'
}

export const getSignConfigUrl = () => {
  return getConfigProperty('modules.sign_config.use_extension') === 'mtc' ? getConfigProperty('extensions.mtc.rtd_api') + '/DisplayConfiguration' : '/api/manager/secure/displays'
}

export const getDisplaysUrl = () => {
  return getConfigProperty('modules.sign_config.use_extension') === 'mtc' ? getConfigProperty('extensions.mtc.rtd_api') + '/Display' : '/api/manager/secure/displays'
}
