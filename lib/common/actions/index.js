// @flow

import fetch from 'isomorphic-fetch'

import {GTFS_GRAPHQL_PREFIX} from '../../common/constants'
import { setErrorMessage } from '../../manager/actions/status'

import type {dispatchFn, getStateFn} from '../../types/reducers'

export function createVoidPayloadAction (type: string) {
  return () => ({ type })
}

export function secureFetch (url: string, method: string = 'get', payload?: any, raw: boolean = false, isJSON: boolean = true, actionOnFail?: string): any {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    function consoleError (message) {
      console.error(`Error making ${method} request to ${url}: `, message)
    }

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
      'Accept': 'application/json'
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
        const message = `Error making request: (${err})`
        consoleError(message)
        return dispatch(setErrorMessage({message}))
      })
      .then(res => {
        // if raw response is requested
        if (raw) return res
        let action
        // check for errors
        const {status} = res
        if (status >= 500) {
          action = 'RELOAD'
          res.json().then(json => {
            const {detail, message} = json
            const unknown = `Network error!\n\n(${method} request on ${url})`
            consoleError(message || JSON.stringify(json) || unknown)
            dispatch(setErrorMessage({
              message: message || JSON.stringify(json) || unknown,
              action,
              detail
            }))
          })
          return null
        } else if (status >= 400) {
          action = status === 401
            ? 'LOG_IN'
            : actionOnFail
          res.json()
            .then(json => {
              const {detail, message} = json
              const unknown = `Unknown (${status}) error occurred while making request`
              consoleError(message || JSON.stringify(json) || unknown)
              dispatch(setErrorMessage({
                message: message || JSON.stringify(json) || unknown,
                action,
                detail
              }))
            })
          return null
        } else {
          return res
        }
      })
  }
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
