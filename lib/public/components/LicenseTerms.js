// @flow

import type { Auth0ContextInterface } from '@auth0/auth0-react'
import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Button, Checkbox, Modal } from 'react-bootstrap'

import * as userActions from '../../manager/actions/user'
import type { ManagerUserState } from '../../types/reducers'

type Props = {
  acceptAccountTerms: typeof userActions.acceptAccountTerms,
  auth0: Auth0ContextInterface,
  logout: typeof userActions.logout,
  returnTo: ?string,
  termsUrl: string,
  user: ManagerUserState
}

type State = {
  submitted: boolean,
  termsAccepted: boolean
}

/**
 * This component prompts the user to accept (or reject) the specified license terms,
 * and redirects to the specified URL after acceptance.
 */
export default class LicenseTerms extends Component<Props, State> {
  state = {
    submitted: false,
    termsAccepted: false
  }

  handleLogout = () => {
    this.props.logout(this.props.auth0)
  }

  handleTermsAccepted = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({ termsAccepted: evt.target.checked })
  }

  handleContinue = async () => {
    const { acceptAccountTerms, auth0, returnTo = '/home', user } = this.props
    this.setState({ submitted: true })
    if (user.profile) {
      await acceptAccountTerms(user.profile)
    }

    // Call auth0 login to refresh the cached content so that the license page is not shown again.
    // (The user will not be asked to re-enter their password.)
    auth0.loginWithRedirect({
      appState: {
        returnTo
      }
    })
  }

  render () {
    const { termsUrl } = this.props
    const { submitted, termsAccepted } = this.state
    return (
      <Modal show>
        <Modal.Header>
          <Modal.Title>License Terms</Modal.Title>
        </Modal.Header>

        {/* Skipping <Modal.Body> here because it will introduce unnecessary padding. */}
        <iframe
          src={termsUrl}
          style={{ border: 'none', height: '400px', width: '100%' }}
          title='Termes de la licence'
        />

        <Modal.Footer>
          <Checkbox onClick={this.handleTermsAccepted} style={{ textAlign: 'left' }}>
            I accept the above terms.
          </Checkbox>
          <Button onClick={this.handleLogout}>
            <Icon type='times' /> Close and Logout
          </Button>
          <Button bsStyle='primary' disabled={submitted || !termsAccepted} onClick={this.handleContinue}>
            {submitted
              ? <Icon className='fa-spin' type='refresh' />
              : <Icon type='arrow-circle-right' />
            }
            {' '}
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
