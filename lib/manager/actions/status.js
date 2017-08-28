import { secureFetch } from '../../common/actions'
import { fetchFeedSource } from './feeds'
import { fetchSnapshots } from '../../editor/actions/snapshots'

export function setErrorMessage (message, action) {
  return {
    type: 'SET_ERROR_MESSAGE',
    message,
    action
  }
}

export function clearStatusModal () {
  return {
    type: 'CLEAR_STATUS_MODAL'
  }
}

/* function watchingStatus (job) {
  return {
    type: 'WATCHING_STATUS',
    job
  }
}

export function watchStatus (job) {
  return function (dispatch, getState) {
    dispatch(watchingStatus(project))

    // Check every 3 seconds if status is still there.
    // If so, then dispatch a `WATCHING_STATUS`, otherwise stop
    // the status watch.
    const intervalId = setInterval(() => {
      const active = getState().status.popover.active;

      if (active) {
        return dispatch(secureFetch(`/api/manager/secure/${job}/status`))
          .then(response => response.json())
          .then(status =>
            dispatch(receiveProjects(projects))
          )
      } else {
        clearInterval(intervalId);
      }
    }, 1000);
  }
} */

export function removeRetiredJob (job) {
  return {
    type: 'REMOVE_RETIRED_JOB',
    job
  }
}

export function receiveJobs (jobs) {
  return {
    type: 'RECEIVE_JOBS',
    jobs
  }
}

export function checkJobStatus () {
  return function (dispatch, getState) {
    return dispatch(secureFetch(`/api/manager/secure/status/jobs`))
      .then(response => response.json())
      .then(jobs => {
        // check for any just-finished jobs
        const previousJobs = getState().status.jobMonitor.jobs
        previousJobs.filter(j1 => jobs.findIndex(j2 => j1.jobId === j2.jobId) === -1).map(job => {
          dispatch(handleFinishedJob(job))
        })

        // if all jobs have finished, stop the timer
        if (previousJobs.length > 0 && jobs.length === 0) {
          dispatch(stopJobMonitor())
        }

        dispatch(receiveJobs(jobs))
      })
  }
}

export function setJobMonitorTimer (timer) {
  return {
    type: 'SET_JOBMONITOR_TIMER',
    timer
  }
}

function stopCurrentTimer (state) {
  const timer = state.status.jobMonitor.timer
  if (timer) clearInterval(timer)
}

export function startJobMonitor (showMonitor = true) {
  return function (dispatch, getState) {
    stopCurrentTimer(getState())

    const timerFunction = () => {
      dispatch(checkJobStatus())
    }

    timerFunction() // make an initial call right now
    const timer = setInterval(timerFunction, 2000)
    if (showMonitor) {
      console.log('showing monitor')
      dispatch(setJobMonitorVisible(true))
    } else {
      console.log('not showing monitor')
    }
    dispatch(setJobMonitorTimer(timer))
  }
}

export function stopJobMonitor () {
  return function (dispatch, getState) {
    stopCurrentTimer(getState())
    dispatch(setJobMonitorTimer(null))
  }
}

export function setJobMonitorVisible (visible) {
  return {
    type: 'SET_JOBMONITOR_VISIBLE',
    visible
  }
}

export function handlingFinishedJob (job) {
  return {
    type: 'HANDLING_FINISHED_JOB',
    job
  }
}

export function handleFinishedJob (job) {
  return function (dispatch, getState) {
    dispatch(handlingFinishedJob(job))
    switch (job.type) {
      case 'VALIDATE_FEED':
        dispatch(fetchFeedSource(job.feedVersion.feedSource.id, true, true))
        break
      case 'PROCESS_SNAPSHOT':
        dispatch(fetchSnapshots(job.feedVersion.feedSource))
        break
      case 'CREATE_FEEDVERSION_FROM_SNAPSHOT':
        dispatch(fetchFeedSource(job.feedVersion.feedSource.id, true, true))
        break
    }
  }
}

export function handleFetchError (err) {
  return function (dispatch, getState) {
    dispatch(setErrorMessage(err))
  }
}
