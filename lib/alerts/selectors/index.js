import { createSelector } from 'reselect'

import { getFeedId } from '../../common/util/modules'
import { filterAlertsByCategory } from '../util'

export const getVisibleAlerts = createSelector(
  [state => state.alerts.all, state => state.alerts.filter],
  (alerts, visibilityFilter) => {
    if (!alerts) return []
    let visibleAlerts = alerts.filter(alert =>
      alert.title.toLowerCase().indexOf((visibilityFilter.searchText || '').toLowerCase()) !== -1)

    if (visibilityFilter.feedId && visibilityFilter.feedId !== 'ALL') {
      // console.log('filtering alerts by feedId' + visibilityFilter.feedId)
      visibleAlerts = visibleAlerts.filter(alert => alert.affectedEntities.findIndex(ent => getFeedId(ent.agency) === visibilityFilter.feedId) !== -1)
    }

    if (visibilityFilter.sort) {
      // console.log('sorting alerts by ' + visibilityFilter.sort.type + ' direction: ' + visibilityFilter.sort.direction)
      visibleAlerts = visibleAlerts.sort((a, b) => {
        var aValue = visibilityFilter.sort.type === 'title' ? a[visibilityFilter.sort.type].toUpperCase() : a[visibilityFilter.sort.type]
        var bValue = visibilityFilter.sort.type === 'title' ? b[visibilityFilter.sort.type].toUpperCase() : b[visibilityFilter.sort.type]
        if (aValue < bValue) return visibilityFilter.sort.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return visibilityFilter.sort.direction === 'asc' ? 1 : -1
        return 0
      })
    } else {
      // sort by id
      visibleAlerts.sort((a, b) => a.id - b.id)
    }
    return filterAlertsByCategory(visibleAlerts, visibilityFilter.filter)
  }
)
