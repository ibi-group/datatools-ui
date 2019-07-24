// @flow

import moment from 'moment'
import {createAction, type ActionType} from 'redux-actions'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {isExtensionEnabled} from '../../common/util/config'
import {fetchDeployment} from './deployments'
import {fetchFeedSource} from './feeds'
import {downloadMergedFeedViaToken} from './projects'
import {downloadSnapshotViaCredentials} from '../../editor/actions/snapshots'

import type {ServerJob} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

type ErrorMessage = {
  action?: string,
  detail?: any,
  message: string,
  title?: string
}

export const clearStatusModal = createVoidPayloadAction('CLEAR_STATUS_MODAL')
const handlingFinishedJob = createAction(
  'HANDLING_FINISHED_JOB',
  (payload: ServerJob) => payload
)
export const receiveJobs = createAction(
  'RECEIVE_JOBS',
  (payload: Array<ServerJob>) => payload
)
export const removeRetiredJob = createAction(
  'REMOVE_RETIRED_JOB',
  (payload: ServerJob) => payload
)
export const setErrorMessage = createAction(
  'SET_ERROR_MESSAGE',
  (payload: ErrorMessage | Promise<ErrorMessage>) => payload
)
export const setJobMonitorTimer = createAction(
  'SET_JOBMONITOR_TIMER',
  (payload: ?IntervalID) => payload
)
export const setJobMonitorVisible = createAction(
  'SET_JOBMONITOR_VISIBLE',
  (payload: boolean) => payload
)
const setAppInfo = createAction(
  'SET_APP_INFO',
  (payload: {
    commit: string,
    repoUrl: string
  }) => payload
)

const setStatusModal = createAction(
  'SET_STATUS_MODAL',
  (payload: {
    action?: any,
    body: string,
    detail?: any,
    title: string
  }) => payload
)

export type StatusActions = ActionType<typeof clearStatusModal> |
  ActionType<typeof handlingFinishedJob> |
  ActionType<typeof receiveJobs> |
  ActionType<typeof removeRetiredJob> |
  ActionType<typeof setJobMonitorTimer> |
  ActionType<typeof setJobMonitorVisible> |
  ActionType<typeof setErrorMessage> |
  ActionType<typeof setAppInfo>

/**
 * Check status of user's jobs. Handle any finished jobs and if there are no
 * remaining active jobs, stop job monitor.
 */
export function checkJobStatus () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`/api/manager/secure/status/jobs`))
      .then(response => response.json())
      .then(jobs => {
        // Check for any just-finished jobs
        const completedJobs = jobs
          .filter(job => job.status.completed || job.status.error)
        completedJobs
          // Retire any completed or errored jobs.
          .forEach(job => dispatch(handleFinishedJob(job)))

        const remainingJobs = jobs
          .filter(job => !job.status.completed && !job.status.error)
        if (remainingJobs.length === 0) {
          // If there are no remaining jobs, stop the timer.
          dispatch(stopJobMonitor())
        }
        // Add remaining jobs to set of active jobs. Note, this may be an empty
        // array if finished jobs have been handled, but that is the expected
        // behavior because these finished jobs will appear in a "retired" state.
        dispatch(receiveJobs(remainingJobs))
        return jobs
      })
  }
}

export function fetchAppInfo () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // only fetch if we don't yet have server info
    if (!getState().status.appInfo) {
      // fetch info.  If an error occurs or response json doesn't match, set
      // server info to value indicating an unknown commit and repoUrl
      return dispatch(secureFetch('/api/manager/public/appinfo'))
        .then(response => response.json())
        .then(info => {
          if (info.commit && info.repoUrl) {
            info.repoUrl = info.repoUrl.replace('.git', '')
            dispatch(setAppInfo(info))
          } else {
            throw new Error('unable to interpret app info')
          }
        })
        .catch(() => {
          dispatch(setAppInfo({
            commit: 'unknown',
            repoUrl: '?'
          }))
        })
    }
  }
}

/* eslint-disable complexity */
export function handleFinishedJob (job: ServerJob) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(handlingFinishedJob(job))
    switch (job.type) {
      case 'VALIDATE_FEED':
        if (!job.feedSourceId) {
          // FIXME use setErrorMessage instead?
          console.warn('No feedSourceId found on job')
          return
        }
        dispatch(fetchFeedSource(job.feedSourceId, true))
        if (isExtensionEnabled('mtc')) {
          const firstDate = job.validationResult && job.validationResult.firstCalendarDate
          const now = moment().startOf('day')
          if (firstDate && moment(firstDate).isAfter(now)) {
            dispatch(setStatusModal({
              title: 'Warning: Feed contains service for future dates only!',
              body: `Use the 'Merge' button to merge with the currently active feed version.`
            }))
          }
        }
        break
      // CREATE_SNAPSHOT accounts for both creating an initial snapshot from GTFS
      // as well as "restoring" a snapshot to the active buffer, which essentially
      // just creates a copy of the snapshot to restore and points at the new
      // snapshot for the new buffer.
      case 'CREATE_SNAPSHOT':
        if (!job.feedSourceId) {
          // FIXME use setErrorMessage instead?
          console.warn('No feedSourceId found on job')
          return
        }
        dispatch(fetchFeedSource(job.feedSourceId, true))
        break
      // case 'PROCESS_SNAPSHOT':
      //   dispatch(fetchSnapshots(job.feedVersion.feedSource))
      //   break
      //
      case 'CREATE_FEEDVERSION_FROM_SNAPSHOT':
        if (!job.feedSourceId) {
          // FIXME use setErrorMessage instead?
          console.warn('No feedSourceId found on job')
          return
        }
        dispatch(fetchFeedSource(job.feedSourceId, true))
        break
      case 'EXPORT_SNAPSHOT_TO_GTFS':
        if (job.parentJobId) {
          console.log('Not downloading snapshot GTFS. Export job part of feed version creation.')
        } else {
          if (job.snapshot) {
            dispatch(downloadSnapshotViaCredentials(job.snapshot, false))
          }
        }
        break
      case 'DEPLOY_TO_OTP':
        return dispatch(fetchDeployment(job.deploymentId))
      case 'MERGE_FEED_VERSIONS':
        if (job.mergeType === 'REGIONAL') {
          // If merging feeds for the project, end result is to download zip.
          if (!job.projectId) {
            // FIXME use setErrorMessage instead?
            console.warn('No project found on job')
            return
          }
          dispatch(downloadMergedFeedViaToken(job.projectId, false))
        } else {
          const result = job.mergeFeedsResult
          const details = []
          if (result) {
            // Do nothing or show merged feed modal? Feed version is be created
            details.push('Remapped ID count: ' + result.remappedReferences)
            if (Object.keys(result.remappedIds).length > 0) {
              const remappedIdStrings = []
              for (let key in result.remappedIds) {
                // Modify key to remove feed name.
                const split = key.split(':')
                const tableAndId = split.splice(1, 1)
                remappedIdStrings.push(`${tableAndId.join(':')} -> ${result.remappedIds[key]}`)
              }
              details.push('Remapped IDs: ' + remappedIdStrings.join(', '))
            }
            if (result.skippedIds.length > 0) {
              const skippedRecordsForTables = {}
              result.skippedIds.forEach(id => {
                const table = id.split(':')[0]
                if (skippedRecordsForTables[table]) {
                  skippedRecordsForTables[table] = skippedRecordsForTables[table] + 1
                } else {
                  skippedRecordsForTables[table] = 1
                }
              })
              const skippedRecordsStrings = []
              for (let key in skippedRecordsForTables) {
                skippedRecordsStrings.push(`${key} - ${skippedRecordsForTables[key]}`)
              }
              details.push('Skipped records: ' + skippedRecordsStrings.join(', '))
            }
            if (result.idConflicts.length > 0) {
              // const conflicts = result.idConflicts
              details.push('ID conflicts: ' + result.idConflicts.join(', '))
            }
            dispatch(setStatusModal({
              title: result.failed
                ? 'Warning: Errors encountered during feed merge!'
                : 'Feed merge was successful!',
              body: result.failed
                ? `Merge failed with ${result.errorCount} errors. ${result.failureReasons.join(', ')}`
                : `Merge was completed successfully. A new version will be processed/validated containing the resulting feed.`,
              detail: details.join('\n')
            }))
          }
        }
        break
      default:
        console.warn(`No completion step defined for job type ${job.type}`)
    }
  }
}

export function handleJobResponse (response: Response, message: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (response.status >= 400) {
      const props = message
        ? {message}
        // If no message specified, use error message supplied by JSON response
        : response.json()
      return dispatch(setErrorMessage(props))
    } else {
      // Resulting JSON contains message and job ID wich which to monitor job.
      const json: {jobId: number, message: string} = (response.json(): any)
      dispatch(startJobMonitor())
      // Return json with job ID in case it is needed upstream
      return json
    }
  }
}

/**
 * Start job monitor. This stops any existing timer function and initializes
 * the fetch user jobs status function on a timer.
 */
export function startJobMonitor (showMonitor: boolean = true) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    stopCurrentTimer(getState())

    // Check job status immediately.
    dispatch(checkJobStatus())
      .then(jobs => {
        // If there are active jobs, set up a check for every two seconds if
        // jobs are still running. Note: when the status endpoint is checked for
        // a user and completed/errored jobs are returned, the server will
        // automatically remove these jobs from the active list.
        if (jobs.length > 0) {
          const timer = setInterval(() => dispatch(checkJobStatus()), 2000)
          dispatch(setJobMonitorTimer(timer))
          if (showMonitor) dispatch(setJobMonitorVisible(true))
        }
      })
      .catch(err => console.warn('Error fetchings jobs', err))
  }
}

/**
 * Stop job time function stored with timer ID stored in state.
 */
function stopCurrentTimer (state) {
  const {timer} = state.status.jobMonitor
  if (timer) clearInterval(timer)
}

/**
 * Stop current job timer function and set job monitor (timer ID) to null.
 */
export function stopJobMonitor () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    stopCurrentTimer(getState())
    dispatch(setJobMonitorTimer(null))
  }
}
