import update from 'react-addons-update'
import moment from 'moment'

const defaultState = {
  project: null,
  activeFeeds: {},
  loadedFeeds: [],
  typeFilter: ['stops', 'routes'],
  map: {
    bounds: [],
    zoom: null
  },
  permissionFilter: 'view-feed',
  version: null,
  dateTimeFilter: {
    date: moment().format('YYYY-MM-DD'),
    from: 60 * 60 * 6, // 6 AM
    to: 60 * 60 * 9 // 9 AM
  }
}
const setAllFeeds = (feeds, value) => {
  const activeFeeds = Object.assign({}, feeds)
  for (const feedId in activeFeeds) {
    if (activeFeeds.hasOwnProperty(feedId)) {
      activeFeeds[feedId] = value
    }
  }
  return activeFeeds
}
const gtfsFilter = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_ACTIVE_PROJECT':
      return update(state, { project: { $set: action.project ? action.project.id : null } })
    case 'SET_ACTIVE_FEEDVERSION':
      return update(state, {version: {$set: action.feedVersion ? action.feedVersion.id : null}})
    case 'UPDATE_GTFS_MAP_STATE':
      return update(state, {map: {$set: action.props}})
    case 'UPDATE_GTFS_PERMISSION_FILTER':
      return update(state, {permissionFilter: {$set: action.permission}})
    case 'UPDATE_GTFS_DATETIME_FILTER':
      const dateTimeFilter = {...state.dateTimeFilter}
      for (const key in action.props) {
        dateTimeFilter[key] = action.props[key]
      }
      return update(state, {dateTimeFilter: {$set: dateTimeFilter}})
    case 'RECEIVE_FEEDSOURCES':
      const activeFeeds = {}
      action.feedSources && action.feedSources.forEach(fs => { activeFeeds[fs.id] = true })
      return update(state, {activeFeeds: {$set: activeFeeds}})
    case 'UPDATE_LOADED_FEEDS':
      return update(state, {loadedFeeds: {$set: action.loadedFeeds}})
    case 'ADD_ACTIVE_FEED':
      return update(state, {activeFeeds: {[action.feed.id]: {$set: true}}})
    case 'REMOVE_ACTIVE_FEED':
      return update(state, {activeFeeds: {[action.feed.id]: {$set: false}}})
    case 'ADD_ALL_ACTIVE_FEEDS':
      return update(state, {activeFeeds: {$set: setAllFeeds(state.activeFeeds, true)}})
    case 'REMOVE_ALL_ACTIVE_FEEDS':
      return update(state, {activeFeeds: {$set: setAllFeeds(state.activeFeeds, false)}})
    default:
      return state
  }
}

export default gtfsFilter
