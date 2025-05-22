// @flow

import React, {Component} from 'react'
import { Auth0ContextInterface } from '@auth0/auth0-react'
import {Modal, Button} from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import * as statusActions from '../../manager/actions/status'
import * as editorActions from '../../editor/actions/editor'
import type {Props as ContainerProps} from '../containers/CurrentStatusModal'
import type {ModalStatus} from '../../types/reducers'

type Props = ContainerProps & ModalStatus & {
  clearStatusModal: typeof statusActions.clearStatusModal,
  itemToLock?: string,
  removeEditorLock: typeof editorActions.removeEditorLock
}

type State = ModalStatus & {
  auth0: typeof Auth0ContextInterface,
  disabled?: boolean,
  // put in here to make general destructuring just work
  removeEditorLock?: typeof editorActions.removeEditorLock,
  showLogin: boolean,
  showModal: boolean
}

export default class StatusModal extends Component<Props, State> {
  messages = getComponentMessages('StatusModal')

  componentWillMount () {
    // Set initial state.
    this.setState({
      body: '',
      showModal: false,
      title: ''
    })
  }

  componentWillReceiveProps (newProps: Props) {
    if (newProps.title) {
      this.open(newProps)
    }
  }

  close = () => {
    this.setState({showModal: false})
    this.props.clearStatusModal()
    // Slightly delay clearing out the previous state, so that the text does not
    // disappear before the modal fades out.
    window.setTimeout(() => {
      this.setState({
        body: '',
        detail: '',
        title: ''
      })
    }, 500)
  }

  _handleReLock = () => {
    // Close modal before executing actions.
    this.close()
    // Calling removeEditorLock with null feedId will use current editor
    // feedSourceId found in store or in the url.
    const { itemToLock, removeEditorLock } = this.props
    if (itemToLock) {
      removeEditorLock(itemToLock, null, true)
        .then((success) => {
          if (!success) {
            this.setState({
              body: this.state.body + '\n\n' +
                this.messages('relockingFailed.body'),
              disabled: true,
              title: this.messages('relockingFailed.title')
            })
          }
        }, console.log)
    }
  }

  _handleReload = () => window.location.reload()

  _onLoginClick = () => {
    this.props.auth0.loginWithRedirect({
      appState: {
        returnTo: window.location.path
      }
    })
  }

  open (props: Props) {
    const { clearStatusModal, itemToLock, removeEditorLock, ...stateVars } = props
    this.setState({
      showModal: true,
      ...stateVars
    })
  }

  ok () {
    this.close()
  }

  _renderAction = (action: ?string, disabled: ?boolean) => {
    switch (action) {
      case 'LOG_IN':
        return <Button
          bsStyle='primary'
          disabled={disabled}
          onClick={this._onLoginClick}>
          {this.messages('login')}
        </Button>
      case 'RE_LOCK':
        return <Button
          bsStyle='danger'
          disabled={disabled}
          onClick={this._handleReLock}>
          {this.messages('relock')}
        </Button>
      case 'RELOAD':
        return <Button
          bsStyle='success'
          disabled={disabled}
          onClick={this._handleReload}>
          {this.messages('reload')}
        </Button>
      default:
        return null
    }
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    const {title, body, action, detail, disabled} = this.state
    return (
      <Modal
        show={this.state.showModal}
        onHide={this.close}>
        <Header>
          <Title>{title}</Title>
        </Header>
        <Body>
          <p style={{whiteSpace: 'pre-wrap'}}>{body}</p>
          <small style={{whiteSpace: 'pre-wrap'}}>{detail}</small>
        </Body>
        <Footer>
          {this._renderAction(action, disabled)}
          <Button
            data-test-id='status-modal-close-button'
            onClick={this.close}
          >
            {this.messages('close')}
          </Button>
        </Footer>
      </Modal>
    )
  }
}
