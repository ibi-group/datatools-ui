import { createSelector } from 'reselect'

import {getFeedsForPermission} from '../../common/util/permissions'
import {getActiveProject} from '../../manager/selectors'

const getPermissionFilter = (state) => state.gtfs.filter.permissionFilter

export const getAllFeeds = createSelector(
  [ state => state.user, getPermissionFilter, getActiveProject ],
  (user, filter, project) => {
    return getFeedsForPermission(project, user, filter)
  }
)

export const getActiveFeeds = createSelector(
  [ getAllFeeds, state => state.gtfs.filter.activeFeeds ],
  (all, active) => {
    return all.filter((feed, index) => active && active[feed.id])
  }
)

export const getActiveAndLoadedFeeds = createSelector(
  [ getActiveFeeds, state => state.gtfs.filter.loadedFeeds ],
  (active, loaded) => {
    return active.filter(f => f && loaded.findIndex(feed => feed.id === f.id) !== -1)
  }
)
