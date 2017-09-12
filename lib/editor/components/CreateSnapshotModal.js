import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import { Modal, Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'

export default class CreateSnapshotModal extends Component {
  static propTypes = {
    onOkClicked: PropTypes.func
  }

  state = {
    showModal: false
  }

  close = () => {
    this.setState({
      showModal: false
    })
  }

  open () {
    this.setState({
      showModal: true
    })
  }

  ok = () => {
    const name = ReactDOM.findDOMNode(this.refs.name).value
    const comment = ReactDOM.findDOMNode(this.refs.comment).value
    this.props.onOkClicked(name, comment)
    this.close()
  }

  render () {
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Modal.Header>
          <Modal.Title>Create Snapshot</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <FormGroup>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              type='text'
              placeholder='Snapshot name (required)'
              ref='name' />
          </FormGroup>

          <FormGroup>
            <ControlLabel>Comment</ControlLabel>
            <FormControl
              componentClass='textarea'
              placeholder='Additional information (optional)'
              ref='comment' />
          </FormGroup>
        </Modal.Body>

        <Modal.Footer>
          <Button
            bsStyle='primary'
            onClick={this.ok}>
            OK
          </Button>
          <Button
            onClick={this.close}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
