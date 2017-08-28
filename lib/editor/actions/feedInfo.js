import { secureFetch } from '../../common/actions'

export function requestingFeedInfo (feedId) {
  return {
    type: 'REQUESTING_FEED_INFO',
    feedId
  }
}

export function receiveFeedInfo (feedInfo) {
  return {
    type: 'RECEIVE_FEED_INFO',
    feedInfo
  }
}

export function savingFeedInfo (feedId, feedInfo) {
  return {
    type: 'SAVING_FEED_INFO',
    feedId,
    feedInfo
  }
}

export function fetchFeedInfo (feedId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedInfo(feedId))
    const url = `/api/editor/secure/feedinfo/${feedId}`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(feedInfo => {
        dispatch(receiveFeedInfo(feedInfo))
        // TODO: should we force users to create feed info?
        // probably not because it's not a required table
        // if (!feedInfo) {
        //   dispatch(setActiveGtfsEntity(feedId, 'feedinfo'))
        // }
      })
  }
}

// Create new feed info
export function createFeedInfo (feedId) {
  return function (dispatch, getState) {
    dispatch(savingFeedInfo(feedId))
    const data = {
      // datatools props
      id: feedId
      // color: feedInfo.color,
      // defaultLat: feedInfo.defaultLat,
      // defaultLon: feedInfo.defaultLon,
      // routeTypeId: feedInfo.routeTypeId,
      //
      // // gtfs spec props
      // feedEndDate: feedInfo.feed_end_date,
      // feedStartDate: feedInfo.feed_start_date,
      // feedLang: feedInfo.feed_lang,
      // feedPublisherName: feedInfo.feed_publisher_name,
      // feedPublisherUrl: feedInfo.feed_publisher_url,
      // feedVersion: feedInfo.feed_version,
    }
    const url = `/api/editor/secure/feedinfo/${feedId}`
    return dispatch(secureFetch(url, 'post', data))
      .then((res) => {
        return dispatch(fetchFeedInfo(feedId))
      })
  }
}

export function saveFeedInfo (feedId, feedInfo) {
  return function (dispatch, getState) {
    dispatch(savingFeedInfo(feedId, feedInfo))
    const data = {
      // datatools props
      id: feedId,
      color: feedInfo.color,
      defaultLat: feedInfo.defaultLat,
      defaultLon: feedInfo.defaultLon,
      defaultRouteType: feedInfo.defaultRouteType,

      // gtfs spec props
      feedEndDate: feedInfo.feed_end_date,
      feedStartDate: feedInfo.feed_start_date,
      feedLang: feedInfo.feed_lang,
      feedPublisherName: feedInfo.feed_publisher_name,
      feedPublisherUrl: feedInfo.feed_publisher_url,
      feedVersion: feedInfo.feed_version
    }
    const url = `/api/editor/secure/feedinfo/${feedId}`
    const method = getState().editor.data.tables.feedinfo ? 'put' : 'post'
    return dispatch(secureFetch(url, method, data))
      .then((res) => {
        return dispatch(fetchFeedInfo(feedId))
      })
  }
}

export function updateFeedInfo (feedInfo, changes) {
  return function (dispatch, getState) {
    dispatch(savingFeedInfo(feedInfo.id))
    const url = `/api/editor/secure/feedinfo/${feedInfo.id}`
    return dispatch(secureFetch(url, 'put', changes))
      .then(res => res.json())
      .then(feedInfo => {
        dispatch(receiveFeedInfo(feedInfo))
      })
  }
}
