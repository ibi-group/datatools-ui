// @flow

import React, {Component} from 'react'
import {Button, Glyphicon, MenuItem} from 'react-bootstrap'
import {connect} from 'react-redux'

import * as userActions from '../../manager/actions/user'
import * as statusActions from '../../manager/actions/status'
import {getComponentMessages, getConfigProperty} from '../util/config'
import type {AppState, ManagerUserState} from '../../types/reducers'
import { AUTH0_DISABLED } from '../constants'

type ContainerProps = {
  componentClass?: string,
  isWatching: ?boolean,
  subscriptionType: string,
  target: string,
  user: ManagerUserState
}

type Props = ContainerProps & {
  resendEmailConfirmation: typeof userActions.resendEmailConfirmation,
  setErrorMessage: typeof statusActions.setErrorMessage,
  updateTarget: typeof userActions.updateTargetForSubscription
}

class WatchButton extends Component<Props> {
  messages = getComponentMessages('WatchButton')

  _onToggleWatch = () => {
    const {
      isWatching,
      resendEmailConfirmation,
      setErrorMessage,
      subscriptionType,
      target,
      updateTarget,
      user
    } = this.props
    if (user.profile) {
      if (!isWatching && !user.profile.email_verified) {
        if (confirm(this.messages('emailVerificationConfirm'))) {
          resendEmailConfirmation(user)
            .then((result: boolean) => {
              if (result) {
                // success. Display a dialog that asks user to reload
                // $FlowFixMe error doesn't make sense
                setErrorMessage({
                  action: 'RELOAD',
                  message: this.messages('verificationSent'),
                  title: 'Success!'
                })
              } else {
                // Response from server indicates error, display error message
                setErrorMessage({
                  message: this.messages('verificationSendError')
                })
              }
            })
            .catch(err => {
              // An error got thrown, display error message with error detail
              setErrorMessage({
                detail: err,
                message: this.messages('verificationSendError')
              })
            })
        }
      } else {
        updateTarget(user.profile, target, subscriptionType)
      }
    } else {
      console.warn('Utilisateur non trouvé. Impossible de mettre à jour les abonnements', user)
    }
  }

  _getLabel = () => {
    const {isWatching} = this.props
    return (
      <span>
        <Glyphicon glyph={`eye-${isWatching ? 'close' : 'open'}`} />{' '}
        {this.messages(isWatching ? 'unwatch' : 'watch')}
      </span>
    )
  }

  render () {
    // Do not render watch button if notifications are not enabled or if auth is disabled.
    // (Notifications require an email address verified with Auth0.)
    if (AUTH0_DISABLED || !getConfigProperty('application.notifications_enabled')) {
      return null
    }
    const {componentClass} = this.props
    switch (componentClass) {
      case 'menuItem':
        return (
          <MenuItem
            onClick={this._onToggleWatch}>
            {this._getLabel()}
          </MenuItem>
        )
      default:
        return (
          <Button
            onClick={this._onToggleWatch}>
            {this._getLabel()}
          </Button>
        )
    }
  }
}

const mapDispatchToProps = {
  resendEmailConfirmation: userActions.resendEmailConfirmation,
  setErrorMessage: statusActions.setErrorMessage,
  updateTarget: userActions.updateTargetForSubscription
}

const mapStateToProps = (state: AppState, ownProps: ContainerProps) => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WatchButton)
