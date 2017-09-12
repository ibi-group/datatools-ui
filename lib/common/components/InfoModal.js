import React from 'react'
import { Modal, Button } from 'react-bootstrap'

export default class InfoModal extends React.Component {
  state = {
    showModal: false
  }

  close () {
    this.setState({
      showModal: false
    })
  }

  open (props) {
    this.setState({
      showModal: true,
      title: props.title,
      body: props.body
    })
  }

  ok = () => {
    this.close()
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Header>
          <Title>{this.state.title}</Title>
        </Header>

        <Body>
          <p>{this.state.body}</p>
        </Body>

        <Footer>
          <Button
            onClick={this.ok}>
            OK
          </Button>
        </Footer>
      </Modal>
    )
  }
}
