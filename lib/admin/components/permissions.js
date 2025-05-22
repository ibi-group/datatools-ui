// @flow

import type {Permission} from '../../common/user/UserPermissions'
import {getComponentMessages} from '../../common/util/config'

const messages = getComponentMessages('Permissions')

const permissions: Array<Permission> = [
  {
    type: 'manage-feed',
    name: messages('manage-feed'),
    feedSpecific: true
  },
  {
    type: 'edit-gtfs',
    name: messages('edit-gtfs'),
    feedSpecific: true
  },
  {
    type: 'approve-gtfs',
    name: messages('approve-gtfs'),
    feedSpecific: true
  },
  {
    type: 'edit-alert',
    name: messages('edit-alert'),
    feedSpecific: true,
    module: 'alerts'
  },
  {
    type: 'approve-alert',
    name: messages('approve-alert'),
    feedSpecific: true,
    module: 'alerts'
  }
]

export default permissions
