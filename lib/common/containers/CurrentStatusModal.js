import {connect} from 'react-redux'

import StatusModal from '../components/StatusModal'
import {clearStatusModal} from '../../manager/actions/status'
import {login} from '../../manager/actions/user'

const mapStateToProps = (state, ownProps) => {
  const {action, body, title} = state.status.modal ? state.status.modal : {}
  return {
    title,
    action,
    body
  }
}
const mapDispatchToProps = {
  clearStatusModal,
  login
}
var CurrentStatusModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusModal)

export default CurrentStatusModal
