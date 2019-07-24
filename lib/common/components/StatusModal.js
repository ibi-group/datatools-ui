// @flow

import React, {Component} from 'react'
import {Modal, Button} from 'react-bootstrap'

import Login from '../containers/Login'
import * as statusActions from '../../manager/actions/status'
import * as editorActions from '../../editor/actions/editor'

import type {Props as ContainerProps} from '../containers/CurrentStatusModal'
import type {ModalStatus} from '../../types/reducers'

type Props = ContainerProps & $Shape<ModalStatus> & {
  clearStatusModal: typeof statusActions.clearStatusModal,
  removeEditorLock: typeof editorActions.removeEditorLock
}

type State = {
  action?: string,
  body: string,
  // put in here to make general destructuring just work
  clearStatusModal?: typeof statusActions.clearStatusModal,
  detail?: string,
  disabled?: boolean,
  // put in here to make general destructuring just work
  removeEditorLock?: typeof editorActions.removeEditorLock,
  showLogin: boolean,
  showModal: boolean,
  title: string
}

export default class StatusModal extends Component<Props, State> {
  componentWillMount () {
    // Set initial state.
    this.setState({
      body: '',
      showLogin: false,
      showModal: false,
      title: ''
    })
  }

  componentWillReceiveProps (newProps: Props) {
    if (newProps.title) {
      this.setState({
        showModal: true,
        ...newProps
      })
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
        showLogin: false,
        title: ''
      })
    }, 500)
  }

  _handleReLock = () => {
    // Calling removeEditorLock with null feedId will use current editor
    // feedSourceId found in store.
    this.props.removeEditorLock(null, true)
      .then((success) => {
        if (success) {
          this.setState({
            action: 'RELOAD',
            title: 'Success!',
            body: 'Reload page to begin editing.'
          })
        } else {
          this.setState({
            title: 'Attempt to take over editing failed!',
            disabled: true,
            body: this.state.body + '\n\n' +
              'Re-locking feed is only permitted if another editing session is in progress for you (not another user). You can try again later or contact the current editor to request that they wrap up their session.'
          })
        }
      }, failure => {
        console.log(failure)
      })
  }

  _handleReload = () => window.location.reload()

  _onLoginClick = () => {
    this.setState({
      showLogin: true,
      showModal: false
    })
  }

  _onLoginHide = () => {
    this.setState({ showLogin: false })
  }

  open (props: Props) {
    this.setState({
      showModal: true,
      ...props
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
          Log in
        </Button>
      case 'RE_LOCK':
        return <Button
          bsStyle='danger'
          disabled={disabled}
          onClick={this._handleReLock}>
          Re-lock feed
        </Button>
      case 'RELOAD':
        return <Button
          bsStyle='success'
          disabled={disabled}
          onClick={this._handleReload}>
          Reload page
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
            Close
          </Button>
        </Footer>
        {/*
          FIXME: This may need to be fixed. Instead of setting state, push to
          '/login' on log in button click above.
        */}
        {this.state.showLogin &&
          <Login
            onHide={this._onLoginHide}
            // Ensure redirect occurs after login.
            redirectOnSuccess={window.location.path} />
        }
      </Modal>
    )
  }
}
