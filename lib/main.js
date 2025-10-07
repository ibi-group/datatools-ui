// @flow

import mount from '@conveyal/woonerf/mount'

import admin from './admin/reducers'
import alerts from './alerts/reducers'
import App from './common/containers/App'
import editor from './editor/reducers'
import gtfs from './gtfs/reducers'
import gtfsPlusReducers from './gtfsplus/reducers'
import managerReducers from './manager/reducers'

mount({
  app: App,
  reducers: {
    ...managerReducers,
    admin,
    alerts,
    ...gtfsPlusReducers,
    editor,
    gtfs
  }
})
