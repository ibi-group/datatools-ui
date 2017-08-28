import { secureFetch } from '../../common/actions'
import { setActiveGtfsEntity } from './active'

export function savingAgency (feedId, agency) {
  return {
    type: 'SAVING_AGENCY',
    feedId,
    agency
  }
}

export function receiveAgency (feedId, agency) {
  return {
    type: 'RECEIVE_AGENCY',
    feedId,
    agency
  }
}

export function saveAgency (feedId, agency) {
  return function (dispatch, getState) {
    dispatch(savingAgency(feedId, agency))
    const data = {
      // datatools props
      id: agency.id === 'new' ? null : agency.id,
      feedId: agency.feedId,

      // gtfs spec
      agencyId: agency.agency_id,
      lang: agency.agency_lang,
      name: agency.agency_name,
      phone: agency.agency_phone,
      email: agency.agency_email,
      timezone: agency.agency_timezone,
      url: agency.agency_url,
      agencyFareUrl: agency.agency_fare_url,
      agencyBrandingUrl: agency.agency_branding_url
    }
    const method = agency.id !== 'new' ? 'put' : 'post'
    const url = agency.id !== 'new'
      ? `/api/editor/secure/agency/${agency.id}?feedId=${feedId}`
      : `/api/editor/secure/agency?feedId=${feedId}`
    return dispatch(secureFetch(url, method, data))
      .then(res => res.json())
      .then(a => {
        // dispatch(receiveAgency(feedId, agency))
        dispatch(fetchAgencies(feedId))
        .then(() => {
          if (agency.id === 'new') {
            dispatch(setActiveGtfsEntity(feedId, 'agency', a.id))
          }
          return a
        })
      })
  }
}

export function requestingAgencies (feedId) {
  return {
    type: 'REQUESTING_AGENCIES',
    feedId
  }
}

export function receiveAgencies (feedId, agencies) {
  return {
    type: 'RECEIVE_AGENCIES',
    feedId,
    agencies
  }
}

export function fetchAgencies (feedId) {
  return function (dispatch, getState) {
    dispatch(requestingAgencies(feedId))
    const url = `/api/editor/secure/agency?feedId=${feedId}`
    return dispatch(secureFetch(url))
      .then(res => res.json())
      .then(agencies => {
        dispatch(receiveAgencies(feedId, agencies))
        return agencies
      })
  }
}

export function deletingAgency (feedId, agency) {
  return {
    type: 'DELETING_AGENCY',
    feedId,
    agency
  }
}

export function deleteAgency (feedId, agency) {
  return function (dispatch, getState) {
    dispatch(deletingAgency(feedId, agency))
    if (agency.id === 'new') {
      return dispatch(fetchAgencies(feedId))
    }
    const url = `/api/editor/secure/agency/${agency.id}?feedId=${feedId}`
    return dispatch(secureFetch(url, 'delete'))
      .then(res => res.json())
      .then(agency => {
        dispatch(fetchAgencies(feedId))
      })
  }
}
