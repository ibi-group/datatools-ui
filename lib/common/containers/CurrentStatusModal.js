// @flow

import { Auth0ContextInterface, withAuth0 } from '@auth0/auth0-react'
import {connect} from 'react-redux'

import StatusModal from '../components/StatusModal'
import {clearStatusModal} from '../../manager/actions/status'
import {removeEditorLock} from '../../editor/actions/editor'
import type {AppState} from '../../types/reducers'

export type Props = {
  auth0: Auth0ContextInterface
}

const mapStateToProps = (state: AppState) => {
  return {
    ...state.status.modal
  }
}
const mapDispatchToProps = {
  clearStatusModal,
  removeEditorLock
}

export default withAuth0(connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusModal))
