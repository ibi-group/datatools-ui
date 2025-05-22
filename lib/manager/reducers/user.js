// @flow

import UserPermissions from '../../common/user/UserPermissions'
import UserSubscriptions from '../../common/user/UserSubscriptions'
import type {Action} from '../../types/actions'
import type {ManagerUserState} from '../../types/reducers'

export const defaultState = {
  isCheckingLogin: true,
  token: null,
  profile: null,
  permissions: null,
  recentActivity: null,
  subscriptions: null
}

const user = (state: ManagerUserState = defaultState, action: Action): ManagerUserState => {
  switch (action.type) {
    case 'USER_LOGGED_IN':
      return {
        ...state,
        isCheckingLogin: false,
        token: action.payload.token,
        profile: action.payload.profile,
        permissions: new UserPermissions(action.payload.profile.app_metadata.datatools),
        subscriptions: new UserSubscriptions(action.payload.profile.app_metadata.datatools)
      }
    case 'USER_PROFILE_UPDATED':
      return {
        ...state,
        profile: action.payload,
        permissions: new UserPermissions(action.payload.app_metadata.datatools),
        subscriptions: new UserSubscriptions(action.payload.app_metadata.datatools)
      }
    case 'USER_LOGGED_OUT':
      return {
        ...state,
        isCheckingLogin: false,
        token: null,
        profile: null,
        permissions: null,
        subscriptions: null
      }
    case 'CREATED_PUBLIC_USER':
      return {
        ...state,
        profile: action.payload.profile,
        permissions: new UserPermissions(action.payload.profile.app_metadata.datatools),
        subscriptions: new UserSubscriptions(action.payload.profile.app_metadata.datatools)
      }
    case 'RECEIVE_USER_RECENT_ACTIVITY':
      return {...state, recentActivity: action.payload}
    default:
      return state
  }
}

export default user
