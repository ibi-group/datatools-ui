import React, { Component, PropTypes } from 'react'
import { Modal, Button, Checkbox, Carousel } from 'react-bootstrap'

export default class EditorHelpModal extends Component {
  static propTypes = {
    show: PropTypes.bool
  }

  state = {
    showModal: this.props.show,
    hideTutorial: this.props.hideTutorial
  }

  _onToggleTutorial = () => this.setState({hideTutorial: !this.state.hideTutorial})

  close = () => {
    if (this.state.hideTutorial !== this.props.hideTutorial) {
      this.props.setTutorialHidden(!this.props.hideTutorial)
    }
    this.setState({ showModal: false })
  }

  open () {
    this.setState({ showModal: true })
  }

  render () {
    if (!this.props.show) {
      return null
    }
    const {Body, Footer, Header, Title} = Modal
    const {Caption, Item} = Carousel
    return (
      <Modal
        show={this.state.showModal}
        onHide={this.close}
        bsSize='large'>
        <Header closeButton>
          <Title>Welcome to the GTFS Editor</Title>
        </Header>
        <Body>
          <Carousel>
            <Item>
              <img width={900} height={500} alt='900x500' src='https://react-bootstrap.github.io/assets/carousel.png' />
              <Caption>
                <h3>First slide label</h3>
                <p>Nulla vitae elit libero, a pharetra augue mollis interdum.</p>
              </Caption>
            </Item>
            <Item>
              <img width={900} height={500} alt='900x500' src='https://react-bootstrap.github.io/assets/carousel.png' />
              <Caption>
                <h3>Second slide label</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </Caption>
            </Item>
            <Item>
              <img width={900} height={500} alt='900x500' src='https://react-bootstrap.github.io/assets/carousel.png' />
              <Caption>
                <h3>Third slide label</h3>
                <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur.</p>
              </Caption>
            </Item>
          </Carousel>
        </Body>
        <Footer>
          <small className='pull-left'>
            <Checkbox
              checked={this.state.hideTutorial}
              onChange={this._onToggleTutorial}>
              Do not show when editor opens
            </Checkbox>
          </small>
          <Button onClick={this.close}>Close</Button>
        </Footer>
      </Modal>
    )
  }
}
