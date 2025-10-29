// @flow

import React from 'react'
import { Modal, Button } from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'

type Props = {
  body?: string,
  confirmButtonStyle?: Object,
  confirmButtonText?: Object,
  onClose?: () => void,
  onConfirm?: () => void,
  title?: string
}

type State = {
  body?: string,
  confirmButtonStyle?: Object,
  confirmButtonText?: Object,
  onClose?: () => void,
  onConfirm?: () => void,
  showModal: boolean,
  title?: string
}

export default class ConfirmModal extends React.Component<Props, State> {
  messages = getComponentMessages('ConfirmModal')

  state = {
    showModal: false
  }

  close = () => {
    if (this.props.onClose) this.props.onClose()
    this.setState({
      showModal: false
    })
  }

  open (props: ?Props) {
    if (props) { // TODO: get rid of this, open should not accepts any props
      this.setState({
        body: props.body,
        confirmButtonStyle: props.confirmButtonStyle,
        confirmButtonText: props.confirmButtonText,
        onClose: props.onClose,
        onConfirm: props.onConfirm,
        showModal: true,
        title: props.title
      })
    } else {
      this.setState({ showModal: true })
    }
  }

  ok = () => {
    if (this.props.onConfirm) this.props.onConfirm()
    else if (this.state.onConfirm) this.state.onConfirm()
    this.close()
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Header>
          <Title>{this.props.title || this.state.title || ''}</Title>
        </Header>
        <Body>
          <p>{this.props.body || this.state.body || ''}</p>
        </Body>
        <Footer>
          <Button
            bsStyle={this.state.confirmButtonStyle ? this.state.confirmButtonStyle : 'default'}
            data-test-id='modal-confirm-ok-button'
            onClick={this.ok}
          >
            {this.state.confirmButtonText ? this.state.confirmButtonText : this.messages('ok')}
          </Button>
          <Button
            onClick={this.close}>
            {this.messages('cancel')}
          </Button>
        </Footer>
      </Modal>
    )
  }
}
