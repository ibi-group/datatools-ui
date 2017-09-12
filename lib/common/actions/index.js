import fetch from 'isomorphic-fetch'
import { setErrorMessage } from '../../manager/actions/status'

export function secureFetch (url, method = 'get', payload, raw) {
  return function (dispatch, getState) {
    const {user} = getState()
    var opts = {
      method,
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    if (payload) opts.body = JSON.stringify(payload)
    return fetch(url, opts)
      .catch(err => {
        dispatch(setErrorMessage(`Error making request: (${err})`))
      })
      .then(res => {
        // if raw response is requested
        if (raw) return res
        let action, message
        // check for errors
        if (res.status >= 500) {
          action = 'RELOAD'
          message = `Network error!\n\n(${method} request on ${url})`
          dispatch(setErrorMessage(message, action))
          return null
        } else if (res.status >= 400) {
          action = res.status === 401 ? 'LOG_IN' : null
          res.json().then(json => {
            const message = json.message || `Unknown (${res.status}) error occurred while making request`
            dispatch(setErrorMessage(message, action))
          })
          return null
        } else {
          return res
        }
      })
  }
}
