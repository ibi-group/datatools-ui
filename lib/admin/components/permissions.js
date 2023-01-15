// @flow

import type {Permission} from '../../common/user/UserPermissions'

const permissions: Array<Permission> = [
  {
    type: 'manage-feed',
    name: 'Administrar configuración del Feed',
    feedSpecific: true
  },
  {
    type: 'edit-gtfs',
    name: 'Editar Feeds GTFS',
    feedSpecific: true
  },
  {
    type: 'approve-gtfs',
    name: 'Aprovar Feeds GTFS',
    feedSpecific: true
  },
  {
    type: 'edit-alert',
    name: 'Editar alertas GTFS-RT',
    feedSpecific: true,
    module: 'alerts'
  },
  {
    type: 'approve-alert',
    name: 'Aprobar alertas GTFS-RT',
    feedSpecific: true,
    module: 'alerts'
  }
]

export default permissions
