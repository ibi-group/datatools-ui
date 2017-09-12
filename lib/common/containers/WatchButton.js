import React, { PropTypes, Component } from 'react'
import { Button, Glyphicon, MenuItem } from 'react-bootstrap'
import { updateTargetForSubscription } from '../../manager/actions/user'
import { connect } from 'react-redux'

import { getComponentMessages, getMessage, getConfigProperty } from '../util/config'

class WatchButton extends Component {
  static propTypes = {
    componentClass: PropTypes.string,
    isWatching: PropTypes.bool,
    subscriptionType: PropTypes.string,
    target: PropTypes.string,
    user: PropTypes.object,
    updateTarget: PropTypes.func
  }

  _onToggleWatch = () => {
    const {updateTarget, user, target, subscriptionType} = this.props
    updateTarget(user.profile, target, subscriptionType)
  }

  render () {
    const {isWatching} = this.props
    const messages = getComponentMessages('WatchButton')
    const title = isWatching
      ? <span><Glyphicon glyph='eye-close' /> {getMessage(messages, 'unwatch')}</span>
      : <span><Glyphicon glyph='eye-open' /> {getMessage(messages, 'watch')}</span>
    if (!getConfigProperty('application.notifications_enabled')) {
      return null
    }
    if (this.props.componentClass === 'menuItem') {
      return (
        <MenuItem
          onClick={this._onToggleWatch}>
          {title}
        </MenuItem>
      )
    } else {
      // componentClass is presumed to be button
      return (
        <Button
          onClick={this._onToggleWatch}>
          {title}
        </Button>
      )
    }
  }
}

const mapDispatchToProps = {
  updateTarget: updateTargetForSubscription
}

const mapStateToProps = (state, ownProps) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WatchButton)
