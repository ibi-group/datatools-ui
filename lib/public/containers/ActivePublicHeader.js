// @flow

import { withAuth0 } from '@auth0/auth0-react'
import { connect } from 'react-redux'

import PublicHeader from '../components/PublicHeader'
import * as userActions from '../../manager/actions/user'
import { getConfigProperty } from '../../common/util/config'
import type { AppState } from '../../types/reducers'

export type Props = {}

const mapStateToProps = (state: AppState, ownProps: Props) => {
  return {
    title: getConfigProperty('application.title'),
    username: state.user.profile ? state.user.profile.email : null,
    userPicture: state.user.profile ? state.user.profile.picture : null
  }
}

const mapDispatchToProps = {
  logout: userActions.logout
}

export default withAuth0(connect(
  mapStateToProps,
  mapDispatchToProps
)(PublicHeader)
)
