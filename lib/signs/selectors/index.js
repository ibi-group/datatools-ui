import { createSelector } from 'reselect'

import {filterSignsByCategory} from '../util'

export const getVisibleSigns = createSelector(
  [state => state.signs.all, state => state.signs.filter],
  (signs, visibilityFilter) => {
    if (!signs) return []
    const visibleSigns = signs.filter(sign =>
      sign.title.toLowerCase().indexOf((visibilityFilter.searchText || '').toLowerCase()) !== -1)
    return filterSignsByCategory(visibleSigns, visibilityFilter.filter)
  }
)
