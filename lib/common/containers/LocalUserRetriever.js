// @flow
// $FlowFixMe useEffect not recognized by flow.
import { useEffect } from 'react'
import { connect } from 'react-redux'

import * as userActions from '../../manager/actions/user'
import { AUTH0_CLIENT_ID } from '../constants'

type Props = {
  receiveTokenAndProfile: typeof userActions.receiveTokenAndProfile
}

const profile = {
  app_metadata: {
    'datatools': [
      {
        'permissions': [
          {
            'type': 'administer-application'
          }
        ],
        'projects': [],
        'client_id': AUTH0_CLIENT_ID,
        'subscriptions': []
      }
    ],
    'roles': [
      'user'
    ]
  },
  // FIXME: pick a better email address for both backend and frontend.
  email: 'operateur@sibr.fr',
  name: 'localuser',
  nickname: 'Opérateur SIBR',
  picture: 'https://d2tyb7byn1fef9.cloudfront.net/ibi_group_black-512x512.png',
  sub: 'localuser',
  user_id: 'localuser',
  user_metadata: {}
}

const token = 'local-user-token'

/**
 * This component provides a user profile for configs without authentication.
 */
const LocalUserRetriever = ({ receiveTokenAndProfile }: Props) => {
  // Update the user info in the redux state on initialization.
  useEffect(() => {
    receiveTokenAndProfile({ profile, token })
  }, [])

  // Component renders nothing.
  return null
}

const mapDispatchToProps = {
  receiveTokenAndProfile: userActions.receiveTokenAndProfile
}

export default connect(null, mapDispatchToProps)(LocalUserRetriever)
