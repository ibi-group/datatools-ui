import React, {PropTypes, Component} from 'react'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'

class ProtectedButton extends Component {
  static propTypes = {
    user: PropTypes.object
  }
  render () {
    // const {user} = this.props
    // const disabled = user.permissions
    return (
      <Button {...this.props}>
        {this.props.title || ''}
      </Button>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user
  }
}

const mapDispatchToProps = {}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProtectedButton)
