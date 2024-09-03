// @flow

import {createAction, type ActionType} from 'redux-actions'
import qs from 'qs'

import {createVoidPayloadAction, secureFetch} from '../../common/actions'
import {setErrorMessage} from '../../manager/actions/status'

import type {OtpServer, ServerJob, UserProfile} from '../../types'
import type {dispatchFn, getStateFn} from '../../types/reducers'

const SERVER_URL = `/api/manager/secure/servers`

// Private actions.
const createdUser = createAction(
  'CREATED_USER',
  (payload: UserProfile) => payload
)
const receiveUsers = createAction(
  'RECEIVE_USERS',
  (payload: {
    totalUserCount: number,
    users: Array<UserProfile>
  }) => payload
)
const receiveAllJobs = createAction(
  'RECEIVE_ALL_JOBS',
  (payload: Array<ServerJob>) => payload
)
const receiveAllRequests = createAction(
  'RECEIVE_ALL_REQUESTS',
  (payload: Array<any>) => payload
)
const fetchingApplicationStatus = createVoidPayloadAction('FETCHING_ALL_JOBS')
const updatingServer = createAction('UPDATING_SERVER', (payload: OtpServer) => payload)
const receiveServer = createAction(
  'RECEIVE_SERVER',
  (payload: OtpServer) => payload
)
const receiveServers = createAction(
  'RECEIVE_SERVERS',
  (payload: Array<OtpServer>) => payload
)
const requestingUsers = createVoidPayloadAction('REQUESTING_USERS')

// Public actions.
export const setUserPage = createAction(
  'SET_USER_PAGE',
  (payload: number) => payload
)
export const setUserPerPage = createAction(
  'SET_USER_PER_PAGE',
  (payload: number) => payload
)
export const setUserQueryString = createAction(
  'SET_USER_QUERY_STRING',
  (payload: string) => payload
)

export type AdminActions = ActionType<typeof createdUser> |
  ActionType<typeof receiveUsers> |
  ActionType<typeof requestingUsers> |
  ActionType<typeof setUserPage> |
  ActionType<typeof setUserPerPage> |
  ActionType<typeof setUserQueryString> |
  ActionType<typeof deleteServer> |
  ActionType<typeof fetchServers> |
  ActionType<typeof updateServer>

export function fetchUsers () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    dispatch(requestingUsers())
    const {page, perPage, userQueryString: queryString} = getState().admin.users
    let countUrl = '/api/manager/secure/usercount'
    if (queryString) countUrl += `?${qs.stringify({queryString})}`
    const getCount = dispatch(secureFetch(countUrl))
      .then(res => res.json())
    const params = queryString ? {page, perPage, queryString} : {page, perPage}
    const usersUrl = `/api/manager/secure/user?${qs.stringify(params)}`
    const getUsers = dispatch(secureFetch(usersUrl))
      .then(res => res.json())

    Promise.all([getCount, getUsers]).then((results) => {
      if (Array.isArray(results[1])) {
        return dispatch(receiveUsers({
          totalUserCount: results[0],
          users: results[1]
        }))
      } else if (results[1].message) {
        return dispatch(setErrorMessage({
          message: results[1].message
        }))
      } else {
        return dispatch(setErrorMessage({
          message: 'Réponse inattendue'
        }))
      }
    })
  }
}

/**
 * Fetch application status, which consists of all active server jobs for the
 * application in addition to the latest HTTP requests per user.
 *
 * NOTE: The endpoints used in this action are available to application admin
 * users only.
 */
export function fetchApplicationStatus () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // Dispatch void action to trigger 'fetching' status in UI.
    dispatch(fetchingApplicationStatus())
    // Get all jobs for application.
    dispatch(secureFetch('/api/manager/secure/status/jobs/all'))
      .then(response => response.json())
      .then(jobs => dispatch(receiveAllJobs(jobs)))
    // Get latest requests.
    dispatch(secureFetch('/api/manager/secure/status/requests'))
      .then(response => response.json())
      .then(requests => dispatch(receiveAllRequests(requests)))
  }
}

// server call
export function createUser (credentials: any) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = '/api/manager/secure/user'
    return dispatch(secureFetch(url, 'post', credentials))
      .then(response => response.json())
      .then(profile => {
        dispatch(createdUser(profile))
        return dispatch(fetchUsers())
      })
  }
}

// server call
export function deleteUser (profile: UserProfile) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const url = `/api/manager/secure/user/${profile.user_id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      .then(result => dispatch(fetchUsers()))
  }
}

/**
 * Fetch all OTP/R5 server targets.
 */
export function fetchServers () {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`${SERVER_URL}`))
      .then(res => res.json())
      .then(servers => dispatch(receiveServers(servers)))
  }
}

/**
 * Fetch an OTP/R5 server target.
 */
export function fetchServer (serverId: string) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    return dispatch(secureFetch(`${SERVER_URL}/${serverId}`))
      .then(res => res.json())
      .then(server => dispatch(receiveServer(server)))
  }
}

/**
 * Update or create OTP/R5 server target.
 */
export function updateServer (server: OtpServer) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = server
    const url = id ? `${SERVER_URL}/${id}` : SERVER_URL
    const method = id ? 'put' : 'post'
    dispatch(updatingServer(server))
    dispatch(secureFetch(url, method, server))
      .then(res => res.json())
      .then(server => dispatch(receiveServer(server)))
  }
}

/**
 * Delete OTP/R5 server target.
 */
export function deleteServer (server: OtpServer) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = server
    return dispatch(secureFetch(`${SERVER_URL}/${id}`, 'delete'))
      .then(res => res.json())
      .then(server => dispatch(fetchServers()))
  }
}

/**
 * Terminate EC2 instances associated with OTP server.
 */
export function terminateEC2Instances (server: OtpServer) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {id} = server
    console.log('killing EC2')
    return dispatch(secureFetch(`${SERVER_URL}/${id}/ec2`, 'delete'))
      .then(res => res.json())
      .then(server => dispatch(fetchServers()))
  }
}
