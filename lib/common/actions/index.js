// @flow

import fetch from 'isomorphic-fetch'

import {GTFS_GRAPHQL_PREFIX} from '../../common/constants'
import { setErrorMessage } from '../../manager/actions/status'
import type {dispatchFn, getStateFn} from '../../types/reducers'

type ErrorResponse = {
  detail: string,
  message?: string
}

function getErrorMessage (method: string, url: string, status?: number) {
  let errorMessage = status ? `Error (${status}) making ${method} request to ${url}` : `Error making ${method} request to ${url}`
  if (status && status >= 500) {
    errorMessage = `Network error (${status})!\n\n(${method} request on ${url})`
  }
  return errorMessage
}

export function createVoidPayloadAction (type: string) {
  return () => ({ type })
}

/**
 * Shorthand fetch call to pass a file as formData on a POST request to the
 * specified URL.
 */
export function postFormData (url: string, file: File, customHeaders?: {[string]: string}) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    if (!file) {
      alert('No file to upload!')
      return
    }
    const data = new window.FormData()
    data.append('file', file)
    return dispatch(secureFetch(url, 'post', data, false, false, undefined, customHeaders))
  }
}

export function secureFetch (
  url: string,
  method: string = 'get',
  payload?: any,
  raw: boolean = false,
  isJSON: boolean = true,
  actionOnFail?: string,
  customHeaders?: {[string]: string}
): any {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // if running in a test environment, fetch will complain when using relative
    // urls, so prefix all urls with http://localhost:4000.
    if (process.env.NODE_ENV === 'test') {
      url = `http://localhost:4000${url}`
    }

    let {token} = getState().user
    // FIXME What if authentication is turned off.
    if (!token) {
      console.warn('Cannot fetch without user token.')
      token = 'no_auth'
    }
    const headers: {[string]: string} = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      ...customHeaders
    }
    if (isJSON) {
      headers['Content-Type'] = 'application/json'
    }
    const body = payload && isJSON
      ? JSON.stringify(payload)
      : payload
    return fetch(url, {method, headers, body})
      // Catch basic error during fetch
      .catch(err => {
        const message = getErrorMessage(method, url)
        console.error(message, err)
        return dispatch(setErrorMessage({message}))
      })
      .then(res => dispatch(handleResponse(method, url, res, raw, actionOnFail)))
  }
}

function handleResponse (method, url, res, raw, actionOnFail) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    // if raw response is requested
    if (raw) return res
    const {status} = res
    // Return response with no further action if there are no errors.
    if (status < 400) return res
    // check for errors
    let json
    try {
      json = await res.json()
    } catch (e) {
      console.warn('Could not parse JSON from error response')
    }
    const errorMessage = getErrorMessageFromJson(json, status, method, url, actionOnFail)
    dispatch(setErrorMessage(errorMessage))
    return null
  }
}

function getErrorMessageFromJson (
  json: ?ErrorResponse,
  status,
  method,
  url,
  actionOnFail
) {
  let action = 'RELOAD'
  let detail
  let errorMessage = getErrorMessage(method, url, status)
  if (status < 500) {
    action = status === 401
      ? 'LOG_IN'
      : actionOnFail
  }
  if (json) {
    detail = json.detail
    // if status >= 500 and detail is being overrode, add original network error in small text
    if (status >= 500) {
      detail = detail ? detail + errorMessage : errorMessage
    }
    // re-assign error message after it gets used in the detail.
    errorMessage = json.message || JSON.stringify(json)
  }
  console.error(errorMessage)
  return { action, detail, message: errorMessage }
}

function graphQLErrorsToString (errors: Array<{locations: any, message: string}>): Array<string> {
  return errors.map(e => {
    const locations = e.locations.map(JSON.stringify).join(', ')
    return `- ${e.message} (${locations})\n`
  })
}

export function fetchGraphQL ({
  errorMessage,
  query,
  variables
}: {
  errorMessage?: string,
  query: string,
  variables?: {[key: string]: string | number | Array<string>}
}): any {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const body = {
      query,
      variables
    }
    return dispatch(secureFetch(GTFS_GRAPHQL_PREFIX, 'post', body))
      .then(res => res.json())
      .then(json => {
        if (json.errors && json.errors.length) {
          dispatch(setErrorMessage({
            message: errorMessage || 'Error fetching GTFS entities via GraphQL',
            // action,
            detail: graphQLErrorsToString(json.errors)
          }))
        } else {
          return json.data
        }
      })
      .catch(err => console.log(err))
  }
}
