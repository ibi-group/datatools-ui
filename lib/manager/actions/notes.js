import { secureFetch } from '../../common/actions'

export function requestingNotes () {
  return {
    type: 'REQUESTING_NOTES'
  }
}

export function receiveNotesForFeedSource (feedSource, notes) {
  return {
    type: 'RECEIVE_NOTES_FOR_FEEDSOURCE',
    feedSource,
    notes
  }
}

export function fetchNotesForFeedSource (feedSource) {
  return function (dispatch, getState) {
    dispatch(requestingNotes())
    const url = `/api/manager/secure/note?type=FEED_SOURCE&objectId=${feedSource.id}`
    dispatch(secureFetch(url))
    .then(response => response.json())
    .then(notes => {
      dispatch(receiveNotesForFeedSource(feedSource, notes))
    })
  }
}

export function postNoteForFeedSource (feedSource, note) {
  return function (dispatch, getState) {
    const url = `/api/manager/secure/note?type=FEED_SOURCE&objectId=${feedSource.id}`
    dispatch(secureFetch(url, 'post', note))
    .then(response => response.json())
    .then(note => {
      dispatch(fetchNotesForFeedSource(feedSource))
    })
  }
}

export function receiveNotesForFeedVersion (feedVersion, notes) {
  return {
    type: 'RECEIVE_NOTES_FOR_FEEDVERSION',
    feedVersion,
    notes
  }
}

export function fetchNotesForFeedVersion (feedVersion) {
  return function (dispatch, getState) {
    dispatch(requestingNotes())
    const url = `/api/manager/secure/note?type=FEED_VERSION&objectId=${feedVersion.id}`
    dispatch(secureFetch(url))
    .then(response => response.json())
    .then(notes => {
      dispatch(receiveNotesForFeedVersion(feedVersion, notes))
    })
  }
}

export function postNoteForFeedVersion (feedVersion, note) {
  return function (dispatch, getState) {
    const url = `/api/manager/secure/note?type=FEED_VERSION&objectId=${feedVersion.id}`
    dispatch(secureFetch(url, 'post', note))
    .then(response => response.json())
    .then(note => {
      dispatch(fetchNotesForFeedVersion(feedVersion))
    })
  }
}
