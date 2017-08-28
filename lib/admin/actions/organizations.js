import { secureFetch } from '../../common/actions'
import { fetchProjects } from '../../manager/actions/projects'
function requestingOrganizations () {
  return {
    type: 'REQUESTING_ORGANIZATIONS'
  }
}

function receiveOrganizations (organizations) {
  return {
    type: 'RECEIVE_ORGANIZATIONS',
    organizations
  }
}

export function fetchOrganizations () {
  return function (dispatch, getState) {
    dispatch(requestingOrganizations())
    return dispatch(secureFetch('/api/manager/secure/organization'))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(organizations => {
        dispatch(receiveOrganizations(organizations))
        return organizations
      })
  }
}

// Single Organization Actions

function requestingOrganization () {
  return {
    type: 'REQUESTING_ORGANIZATION'
  }
}

export function receiveOrganization (organization) {
  return {
    type: 'RECEIVE_ORGANIZATION',
    organization
  }
}

export function fetchOrganization (organizationId, unsecure) {
  return function (dispatch, getState) {
    dispatch(requestingOrganization())
    const apiRoot = unsecure ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/organization/${organizationId}`
    return dispatch(secureFetch(url))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(organization => {
        dispatch(receiveOrganization(organization))
        return organization
        // if (!unsecure)
        //   return dispatch(fetchOrganizationsFeeds(organization.id))
      })
  }
}

function deletingOrganization () {
  return {
    type: 'DELETING_ORGANIZATION'
  }
}

export function deletedOrganization (organization) {
  return {
    type: 'DELETED_ORGANIZATION',
    organization
  }
}

export function deleteOrganization (organization) {
  return function (dispatch, getState) {
    dispatch(deletingOrganization())
    const url = `/api/manager/secure/organization/${organization.id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      // .catch(err => console.log(err))
      .then(organization => {
        dispatch(deletedOrganization(organization))
        return dispatch(fetchOrganizations())
      })
  }
}

function savingOrganization (organization, changes = null) {
  return {
    type: 'SAVING_ORGANIZATION',
    organization,
    changes
  }
}

export function updateOrganization (organization, changes, fetchFeeds = false) {
  return function (dispatch, getState) {
    dispatch(savingOrganization(organization, changes))
    const url = `/api/manager/secure/organization/${organization.id}`
    return dispatch(secureFetch(url, 'put', changes))
      .then((res) => {
        // fetch projects because a project may have been (re)assigned to an org
        dispatch(fetchProjects())
        return dispatch(fetchOrganizations())
      })
  }
}

export function creatingOrganization (organization) {
  return {
    type: 'CREATING_ORGANIZATION',
    organization
  }
}

export function createdOrganization (organization) {
  return {
    type: 'CREATED_ORGANIZATION',
    organization
  }
}

// server call
export function createOrganization (organization) {
  return function (dispatch, getState) {
    dispatch(creatingOrganization(organization))
    console.log(organization)
    const url = '/api/manager/secure/organization'
    return dispatch(secureFetch(url, 'post', organization))
      .then(response => response.json())
      .then(org => {
        dispatch(createdOrganization(org))
        // fetch projects because a project may have been (re)assigned to an org
        dispatch(fetchProjects())
        return dispatch(fetchOrganizations())
      })
  }
}
