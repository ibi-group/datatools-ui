import { secureFetch } from '../../common/actions'

export function requestingUsers () {
  return {
    type: 'REQUESTING_USERS'
  }
}

export function receiveUsers (users, totalUserCount) {
  return {
    type: 'RECEIVE_USERS',
    users,
    totalUserCount
  }
}

export function fetchUsers () {
  return function (dispatch, getState) {
    dispatch(requestingUsers())
    const queryString = getState().admin.users.userQueryString

    let countUrl = '/api/manager/secure/usercount'
    if (queryString) countUrl += `?queryString=${queryString}`
    const getCount = dispatch(secureFetch(countUrl))
      .then(response => response.json())

    let usersUrl = `/api/manager/secure/user?page=${getState().admin.users.page}`
    if (queryString) usersUrl += `&queryString=${queryString}`
    const getUsers = dispatch(secureFetch(usersUrl))
      .then(response => response.json())

    Promise.all([getCount, getUsers]).then((results) => {
      return dispatch(receiveUsers(results[1], results[0]))
    })
  }
}

export function fetchUserCount () {
  return function (dispatch, getState) {
    dispatch(requestingUsers())
    const url = '/api/manager/secure/user/count'
    return dispatch(secureFetch(url))
      .then(response => response.json())
      .then(data => {
        console.log(data)
        // const users = JSON.parse(data)
        // return dispatch(receiveUsers(users))
      })
  }
}

export function creatingUser () {
  return {
    type: 'CREATING_USER'
  }
}

export function createdUser (profile) {
  return {
    type: 'CREATED_USER',
    profile
  }
}

// server call
export function createUser (credentials) {
  return function (dispatch, getState) {
    dispatch(creatingUser())
    console.log(credentials)
    const url = '/api/manager/secure/user'
    return dispatch(secureFetch(url, 'post', credentials))
      .then(response => response.json())
      .then(profile => {
        dispatch(createdUser(profile))
        return dispatch(fetchUsers())
      })
  }
}

export function deletingUser (user) {
  return {
    type: 'DELETING_USER',
    user
  }
}

export function deletedUser (user) {
  return {
    type: 'DELETED_USER',
    user
  }
}

// server call
export function deleteUser (user) {
  return function (dispatch, getState) {
    dispatch(deletingUser(user))
    const url = `/api/manager/secure/user/${user.user_id}`
    return dispatch(secureFetch(url, 'delete'))
      .then(response => response.json())
      .then(result => {
        dispatch(deletedUser(user))
        return dispatch(fetchUsers())
      })
  }
}

export function setUserPage (page) {
  return {
    type: 'SET_USER_PAGE',
    page
  }
}

export function setUserQueryString (queryString) {
  return {
    type: 'SET_USER_QUERY_STRING',
    queryString
  }
}
