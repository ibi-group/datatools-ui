// @flow

import update from 'react-addons-update'

import type {Action} from '../../types/actions'
import type {StatusState} from '../../types/reducers'
import {getComponentMessages} from '../../common/util/config'

export const defaultState = {
  message: null,
  modal: null,
  saving: false,
  appInfo: null,
  applicationJobs: [],
  applicationRequests: [],
  jobMonitor: {
    timer: null,
    visible: false,
    jobs: [],
    retired: []
  }
}

const messages = getComponentMessages('Status')

/* eslint-disable complexity */
const config = (state: StatusState = defaultState, action: Action): StatusState => {
  switch (action.type) {
    // Status Messages
    case 'REQUESTING_PROJECTS':
    case 'REQUESTING_PROJECT':
    case 'REQUESTING_FEEDSOURCES':
    case 'REQUESTING_FEEDSOURCE':
    case 'SAVING_PROJECT':
    case 'SAVING_FEEDSOURCE':
    case 'DELETING_FEEDSOURCE':
    case 'RUNNING_FETCH_FEED':
    case 'REQUESTING_FEEDVERSIONS':
    case 'DELETING_FEEDVERSION':
    case 'UPLOADING_FEED':
    case 'REQUESTING_SYNC':
    case 'RUNNING_FETCH_FEED_FOR_PROJECT':
    case 'REQUESTING_PUBLIC_FEEDS':
    case 'REQUESTING_VALIDATION_ISSUE_COUNT':
    case 'REQUESTING_NOTES':
    case 'REQUESTING_GTFSPLUS_CONTENT':
    case 'UPLOADING_GTFSPLUS_FEED':
    case 'PUBLISHING_GTFSPLUS_FEED':
    case 'VALIDATING_GTFSPLUS_FEED':
    case 'REQUESTING_FEEDVERSION_ISOCHRONES':
    case 'REQUESTING_DEPLOYMENTS':
    case 'REQUESTING_DEPLOYMENT':
    case 'REQUESTING_USERS':
    case 'UPDATING_USER_DATA':
    case 'SAVING_DEPLOYMENT':
    case 'REQUESTING_GTFSEDITOR_SNAPSHOTS':
    case 'SAVING_AGENCY':
    case 'SAVING_STOP':
    case 'SAVING_ROUTE':
    case 'REQUESTING_AGENCIES':
    case 'REQUESTING_STOPS':
    case 'REQUESTING_ROUTES':
    case 'REQUESTING_TRIPS_FOR_CALENDAR':
    case 'CREATING_SNAPSHOT':
    case 'DELETING_SNAPSHOT':
    case 'DELETING_AGENCY':
    case 'DELETING_TRIPS_FOR_CALENDAR':
    case 'RESTORING_SNAPSHOT':
    case 'RENAMING_FEEDVERSION':
    case 'LOADING_FEEDVERSION_FOR_EDITING':
    case 'REQUESTING_ORGANIZATIONS':
    case 'UPDATING_SERVER':
    case 'FETCHING_ALL_JOBS':
    case 'REQUEST_RTD_ALERTS':
      return {...state, message: messages(action.type)}

    // STATUS MODAL UPDATES (TYPICALLY SET ON JOB COMPLETION)
    case 'SET_ERROR_MESSAGE':
      const {action: actionType, message: body, detail, title} = action.payload
      return update(state, {
        modal: {$set: {
          title: title || 'Attention!',
          body,
          action: actionType,
          detail
        }},
        message: {$set: null}
      })
    case 'CLEAR_STATUS_MODAL':
      return update(state, {modal: {$set: null}})
    case 'CREATED_SNAPSHOT':
      return update(state, {
        modal: {$set: {
          title: messages('CREATED_SNAPSHOT.title'),
          body: messages('CREATED_SNAPSHOT.body').replace('%payload%', action.payload)
        }},
        message: {$set: null}
      })
    case 'SET_STATUS_MODAL':
      return update(state, {
        modal: {$set: action.payload},
        message: {$set: null}
      })

    // Job Monitor
    case 'SET_JOBMONITOR_TIMER':
      return update(state, {jobMonitor: {$merge: {timer: action.payload}}})
    case 'SET_JOBMONITOR_VISIBLE':
      return update(state, {jobMonitor: {$merge: {visible: action.payload}}})
    case 'HANDLING_FINISHED_JOB':
      return update(state, {jobMonitor: {retired: {$push: [action.payload]}}})
    case 'REMOVE_RETIRED_JOB':
      const {jobId} = action.payload
      const jobIndex = state.jobMonitor.retired
        .findIndex(job => job.jobId === jobId)
      if (jobIndex === -1) {
        // If somehow the job does not exist in the state, ignore the action.
        console.warn(`Job with ID ${jobId} does not exist in retired jobs list.`)
        return state
      }
      return update(state, {jobMonitor: {retired: {$splice: [[jobIndex, 1]]}}})
    case 'RECEIVE_JOBS':
      const updatedJobs = action.payload || []
      return update(state, {jobMonitor: {jobs: {$set: updatedJobs}}})
    case 'RECEIVE_ALL_REQUESTS':
      return update(state, {applicationRequests: {$set: action.payload}, message: {$set: null}})
    case 'RECEIVE_ALL_JOBS':
      return update(state, {applicationJobs: {$set: action.payload}, message: {$set: null}})
    // ***** The following actions simply blank out the status message ******
    case 'RECEIVE_PROJECTS':
    case 'RECEIVE_PROJECT':
    case 'RECEIVE_SYNC':
    case 'RECEIVE_FEEDSOURCES':
    case 'RECEIVE_FEEDSOURCE':
    case 'RECEIVE_FEEDVERSIONS':
    case 'RECEIVE_FEEDVERSION':
    case 'RECEIVED_FETCH_FEED':
    case 'RECEIVE_FETCH_FEED_FOR_PROJECT':
    case 'RECEIVE_PUBLIC_FEEDS':
    case 'RECEIVE_VALIDATION_ISSUE_COUNT':
    case 'RECEIVE_NOTES_FOR_FEEDVERSION':
    case 'RECEIVE_NOTES_FOR_FEEDSOURCE':
    case 'RECEIVE_GTFSPLUS_CONTENT':
    case 'UPLOADED_GTFSPLUS_FEED':
    case 'RECEIVE_GTFSPLUS_VALIDATION':
    case 'RECEIVE_FEEDVERSION_ISOCHRONES':
    case 'RECEIVE_DEPLOYMENTS':
    case 'RECEIVE_DEPLOYMENT':
    case 'RECEIVE_USERS':
    case 'USER_PROFILE_UPDATED':
    case 'RECEIVE_AGENCY':
    case 'RECEIVE_AGENCIES':
    case 'RECEIVE_STOP':
    case 'RECEIVE_STOPS':
    case 'RECEIVE_ROUTE':
    case 'RECEIVE_ROUTES':
    case 'DELETED_TRIPS_FOR_CALENDAR':
    case 'RECEIVE_TRIPS_FOR_CALENDAR':
    case 'RECEIVE_GTFSEDITOR_SNAPSHOTS':
    case 'RECEIVED_RTD_SIGNS':
    case 'RECEIVED_RTD_ALERTS':
    case 'RECEIVE_ORGANIZATIONS':
    case 'RECEIVE_SERVER':
    case 'RECEIVE_SERVERS':
      return update(state, {message: {$set: null}})
    case 'SET_APP_INFO':
      // If config was found in the app info response, overwrite whatever was
      // found in the UI config with the server values. This will ensure that
      // fields/properties shared between the server and UI will stay in sync
      // and that UI-only fields like `messages` will stay intact.
      // Some application properties might be overwritten unnecessarily, but
      // these should be added to the server config moving forward.
      if (action.payload.config) {
        window.DT_CONFIG = {
          ...window.DT_CONFIG,
          ...action.payload.config
        }
      }
      return update(state, {appInfo: {$set: action.payload}})
    default:
      return state
  }
}

export default config
