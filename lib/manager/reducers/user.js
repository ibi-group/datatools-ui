import update from 'react-addons-update'

import Auth0Manager from '../../common/user/Auth0Manager'
import UserPermissions from '../../common/user/UserPermissions'
import UserSubscriptions from '../../common/user/UserSubscriptions'

const user = (state = {
  auth0: new Auth0Manager({
    client_id: process.env.AUTH0_CLIENT_ID,
    domain: process.env.AUTH0_DOMAIN
  }),
  isCheckingLogin: true,
  token: null,
  profile: null,
  permissions: null,
  recentActivity: null,
  subscriptions: null
}, action) => {
  switch (action.type) {
    case 'CHECKING_EXISTING_LOGIN':
      return update(state, { isCheckingLogin: { $set: true } })
    case 'NO_EXISTING_LOGIN':
      return update(state, { isCheckingLogin: { $set: false } })
    case 'USER_LOGGED_IN':
      return update(state, {
        isCheckingLogin: { $set: false },
        token: { $set: action.token },
        profile: { $set: action.profile },
        permissions: { $set: new UserPermissions(action.profile.app_metadata.datatools) },
        subscriptions: { $set: new UserSubscriptions(action.profile.app_metadata.datatools) }
      })
    case 'REVOKE_USER_TOKEN':
      return update(state, {
        token: {$set: null}
      })
    case 'USER_LOGGED_OUT':
      console.log('USER_LOGGED_OUT')
      return update(state, {
        isCheckingLogin: { $set: false },
        token: { $set: null },
        profile: { $set: null },
        permissions: { $set: null },
        subscriptions: { $set: null }
      })
    case 'CREATED_PUBLIC_USER':
      return update(state, {
        profile: { $set: action.profile },
        permissions: { $set: new UserPermissions(action.profile.app_metadata.datatools) },
        subscriptions: { $set: new UserSubscriptions(action.profile.app_metadata.datatools) }
      })
    case 'RECEIVE_USER_RECENT_ACTIVITY':
      return update(state, {
        recentActivity: { $set: action.activity }
      })
    default:
      return state
  }
}

export default user
