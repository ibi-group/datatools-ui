// @flow

import React, { Component } from 'react'
import { Modal, Button, FormControl } from 'react-bootstrap'
import ReactDOM from 'react-dom'

import {getComponentMessages} from '../util/config'

type Props = {
  body?: string,
  errorMessage?: string,
  onClose?: () => void,
  onConfirm?: (any) => Promise<boolean> | boolean,
  title?: string
}

type State = {
  body?: string,
  disabled?: boolean,
  errorMessage?: string,
  onClose?: () => void,
  onConfirm?: (any) => Promise<boolean> | boolean,
  showModal: boolean,
  title?: string
}

export default class SelectFileModal extends Component<Props, State> {
  messages = getComponentMessages('SelectFileModal')

  state = {
    disabled: false,
    errorMessage: '',
    onConfirm: (args: any) => false,
    showModal: false
  }

  close = () => {
    if (this.props.onClose) this.props.onClose()
    this.setState({
      showModal: false
    })
  }

  open (props: Props) {
    if (props) {
      this.setState({
        body: props.body,
        disabled: false,
        errorMessage: props.errorMessage,
        onClose: props.onClose,
        onConfirm: props.onConfirm,
        showModal: true,
        title: props.title
      })
    } else {
      this.setState({ disabled: false, showModal: true })
    }
  }

  ok = async () => {
    const {errorMessage: propsErrorMessage, onConfirm: propsConfirm} = this.props
    const {errorMessage: stateErrorMessage, onConfirm: stateConfirm} = this.state

    // disable buttons while "loading" response
    this.setState({disabled: true})

    if (!propsConfirm && !stateConfirm) {
      return this.close()
    }

    const node: any = ReactDOM.findDOMNode(this.refs.fileInput)
    const files = (node && node.files) ? node.files : []

    if (propsConfirm) {
      if (await propsConfirm(files)) {
        this.close()
      } else {
        this.setState({disabled: false, errorMessage: propsErrorMessage || stateErrorMessage})
      }
    } else if (stateConfirm) {
      if (stateConfirm(files)) {
        this.close()
      } else {
        this.setState({disabled: false, errorMessage: propsErrorMessage || stateErrorMessage})
      }
    }
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    const {disabled, errorMessage} = this.state
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Header>
          <Title>{this.props.title || this.state.title || ''}</Title>
        </Header>

        <Body>
          <p>{this.props.body || this.state.body || ''}</p>
          {errorMessage
            ? <p>{errorMessage}</p>
            : null
          }
          <FormControl ref='fileInput' type='file' />
        </Body>

        <Footer>
          <Button disabled={disabled} onClick={this.ok}>{this.messages('ok')}</Button>
          <Button disabled={disabled} onClick={this.close}>{this.messages('cancel')}</Button>
        </Footer>
      </Modal>
    )
  }
}
