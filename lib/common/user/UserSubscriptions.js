// @flow

import { getSettingsForThisClient } from '../util/user'
import type { DatatoolsSettings } from '../../types'

export type Subscription = {
  target: Array<string>,
  type: string
}

export default class UserSubscriptions {
  subscriptionLookup: {[string]: Subscription} = {}

  constructor (datatoolsApps: Array<DatatoolsSettings>) {
    // If missing datatoolsApp, construct an empty subscriptions object.
    if (!datatoolsApps) return
    else if (!Array.isArray(datatoolsApps)) {
      console.warn('L’utilisateur app_metadata est mal-configuré.', datatoolsApps)
      return
    }
    const datatoolsJson = getSettingsForThisClient(datatoolsApps)
    if (datatoolsJson && datatoolsJson.subscriptions) {
      for (const subscription of datatoolsJson.subscriptions) {
        this.subscriptionLookup[subscription.type] = subscription
      }
    }
  }
  hasSubscription (subscriptionType: string) {
    return this.subscriptionLookup[subscriptionType] !== null
  }

  getSubscription (subscriptionType: string) {
    return this.subscriptionLookup[subscriptionType]
  }

  hasProjectSubscription (projectId: string, subscriptionType: string) {
    if (!this.hasSubscription(subscriptionType)) return null
    const subscription = this.getSubscription(subscriptionType)
    return subscription ? subscription.target.indexOf(projectId) !== -1 : false
  }

  hasFeedSubscription (projectId: string, feedId: string, subscriptionType: string) {
    if (!this.hasSubscription(subscriptionType)) return null
    else if (this.hasProjectSubscription(projectId, subscriptionType)) return true
    const subscription = this.getSubscription(subscriptionType)
    return subscription ? subscription.target.indexOf(feedId) !== -1 : false
  }
}
