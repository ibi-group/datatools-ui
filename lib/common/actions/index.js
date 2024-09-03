// @flow

import fetch from 'isomorphic-fetch'
import React from 'react'

import {GTFS_GRAPHQL_PREFIX} from '../../common/constants'
import {getComponentMessages} from '../../common/util/config'
import { setErrorMessage } from '../../manager/actions/status'
import type {dispatchFn, getStateFn} from '../../types/reducers'

type ErrorResponse = {
  detail: string,
  message?: string
}

const messages = getComponentMessages('Actions')

function getErrorMessage (method: string, url: string, status?: number) {
  let errorMessage = messages('error')
  if (status) {
    errorMessage = status >= 500 ? messages('networkError') : messages('errorWithStatus')
    errorMessage = errorMessage.replace('%status%', status.toString())
  }
  errorMessage = errorMessage.replace('%url%', url).replace('%method%', method)
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
      alert(messages('noFile'))
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
      console.warn('Impossible de récupérer le token.')
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
    // TODO: REMOVE HACK
    // This section (L135 - L146) is a hack to display links to patterns referenced by a stop to delete.
    // This should be replaced with a better solution such as a new endpoint for this information.
    if (json.detail && json.detail.includes('Motifs référencés:')) {
      const patternSplit = json.detail.split(/\[(.*?)\]/) // Match text within square brackets (our comma separated list of patternIds)
      detail = patternSplit[0]
      const patternsMatch = patternSplit[1]
      if (patternsMatch) {
        const patterns = patternsMatch.split(',').map(pattern => {
          pattern = pattern.slice(1, -1) // Remove curly braces
          const [patternId, internalRouteId, routeShortName, routeId] = pattern.split('-')
          return {patternId, internalRouteId, routeShortName, routeId}
        })
        detail = <PatternLinkErrorMessage detail={detail} patterns={patterns} />
      }
    }
    if (json.detail && json.detail.includes('conflits avec un trip_id existant')) {
      action = 'DEFAULT'
    }
  }
  console.error(errorMessage)
  return { action, detail, message: errorMessage }
}

/*
 * This component displays an error message with links to individual patterns that are
 * used by the stop being deleted. Use of this component is a hack itself, so this should
 * be removed when a better solution is put in place.
 * For discussion see original PR: https://github.com/ibi-group/datatools-ui/pull/943
 */
const PatternLinkErrorMessage = (props) => {
  const {detail, patterns} = props
  // $FlowFixMe
  return <div>
    {detail}
    <ul style={{
      background: 'aliceblue',
      border: 'solid',
      borderColor: 'lightgray',
      borderRadius: '5px',
      borderWidth: '2px',
      maxHeight: '150px',
      margin: '10px 0px',
      overflow: 'auto',
      padding: '5px 10px'
    }}>
      {patterns.map((pattern, index) => {
        // The URL path requires the internal ID for the route record rather than the actual GTFS Route ID.
        const patternPath = `../edit/route/${pattern.internalRouteId}/trippattern/${pattern.patternId}`
        return (
          <li style={{listStyle: 'none', margin: '3px 0px'}}>
            <a href={patternPath}>
              {`Route ${pattern.routeShortName || pattern.routeId}, Pattern ${pattern.patternId}`}
            </a>
          </li>
        )
      })}
    </ul>
  </div>
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
            message: errorMessage || messages('errorGraphQL'),
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
