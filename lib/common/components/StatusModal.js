import React, {Component, PropTypes} from 'react'
import {Modal, Button} from 'react-bootstrap'

export default class StatusModal extends Component {
  static propTypes = {
    title: PropTypes.string,
    body: PropTypes.string,
    action: PropTypes.string,
    onConfirm: PropTypes.func
  }

  state = {
    showModal: false
  }

  componentWillReceiveProps (newProps) {
    if (newProps.title) {
      this.setState({
        showModal: true,
        ...newProps
      })
    }
  }

  close = () => {
    this.setState({
      showModal: false
    })
    this.props.clearStatusModal()
  }

  handleLogin = () => {
    this.props.login()
    .then((success) => {
      if (success) {
        this.close()
      }
    }, failure => {
      console.log(failure)
    })
  }

  open (props) {
    this.setState({
      showModal: true,
      ...props
    })
  }

  ok () {
    if (this.state.onConfirm) this.state.onConfirm()
    this.close()
  }

  _renderAction = (action) => {
    switch (action) {
      case 'LOG_IN':
        return <Button bsStyle='primary' onClick={this.handleLogin}>Log in</Button>
      default:
        return null
    }
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    const {title, body, action} = this.state
    return (
      <Modal
        show={this.state.showModal}
        onHide={this.close}>
        <Header>
          <Title>{title}</Title>
        </Header>
        <Body>
          <p style={{whiteSpace: 'pre-wrap'}}>{body}</p>
        </Body>
        <Footer>
          {this._renderAction(action)}
          <Button onClick={this.close}>Close</Button>
        </Footer>
      </Modal>
    )
  }
}
