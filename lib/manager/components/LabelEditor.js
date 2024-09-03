// @flow

import React from 'react'
import {
  Button,
  Col,
  Checkbox,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  ListGroup,
  ListGroupItem,
  Modal,
  Panel,
  Row
} from 'react-bootstrap'
import update from 'react-addons-update'
import { connect } from 'react-redux'
import tinycolor from 'tinycolor2'

import { createLabel, updateLabel } from '../../manager/actions/labels'
import { validationState } from '../util'
import type { ManagerUserState } from '../../types/reducers'
import type { Label } from '../../types'

type Props = {
  createLabel: Function,
  label: Label,
  onDone?: Function,
  projectId: string,
  updateLabel: Function,
  user: ManagerUserState
}

type State = {
  labelIsNew?: boolean,
  newLabel: Label,
  validation: {
    description: boolean,
    name: boolean
  }
}

/**
 * Component to edit a label. If a label is specified, that label will be pre-filled. If a new label
 * is to be created, a blank object and project id must be passed in.
 */
class LabelEditor extends React.Component<Props, State> {
    state = {
      validation: {
        name: true,
        description: true
      },
      newLabel: {
        color: tinycolor.random().toHexString(),
        ...this.props.label
      },
      labelIsNew: false
    }

    componentDidMount = () => {
      // If we didn't get a label passed in, declare the label to be new
      if (Object.keys(this.props.label).length === 0) {
        this.setState({
          labelIsNew: true
        })
      }
    }

  _onFormChange = ({target}: {target: HTMLInputElement}) => {
    const {checked, name, value: targetValue, type} = target

    let valid = targetValue && targetValue.length > 0

    // Some fields may be blank
    if (target.name === 'description' || target.name === 'adminOnly') {
      valid = true
    }

    // Checkboxes store value in checked not "value"
    const value = type === 'checkbox' ? checked : targetValue

    this.setState(
      update(this.state, {
        newLabel: { $merge: {[name]: value} },
        validation: { [name]: { $set: valid } }
      })
    )
  }

  /**
   * Compares the dirty label from the old one to determine which keys changed
   * @returns Object with all changes
   */
  _getChanges = () => {
    const newLabel = this.state.newLabel
    const oldLabel = this.props.label

    const changes: any = {}
    Object.keys(newLabel).forEach(k => {
      if (newLabel[k] !== oldLabel[k]) {
        changes[k] = newLabel[k]
      }
    })
    return changes
  }

  _settingsAreUnedited = () => Object.keys(this._getChanges()).length === 0

  _formIsValid = () => {
    const {validation, newLabel} = this.state

    return (
      Object.keys(validation).every((k) => validation[k]) &&
      // Resolve edge case when creating a new label
      newLabel.name &&
      newLabel.name !== ''
    )
  }

  _onSaveSettings = (e: SyntheticInputEvent<HTMLInputElement>) => {
    // Prevent form submission query params from attaching to the URL
    e.preventDefault()
    const {labelIsNew, newLabel: label} = this.state
    const {createLabel, updateLabel} = this.props

    if (labelIsNew) {
      // Insert project ID
      label.projectId = this.props.projectId
      createLabel(label)
    } else {
      updateLabel(label)
    }

    // This passed method will close the editor
    this.props.onDone && this.props.onDone()
  }

  render () {
    const { newLabel, validation } = this.state
    const { user, projectId } = this.props
    const isProjectAdmin = user && user.permissions && user.permissions.isProjectAdmin(projectId)

    return (
      <Form onChange={(e) => this._onFormChange(e)}>
        <Panel>
          <ListGroup>
            <ListGroupItem>
              <FormGroup validationState={validationState(validation.name)}>
                <ControlLabel>Name</ControlLabel>
                <FormControl
                  maxLength={25}
                  name={'name'}
                  value={newLabel.name}
                />
                <FormControl.Feedback />
                <HelpBlock>Requis.</HelpBlock>
              </FormGroup>
              <FormGroup>
                <ControlLabel>Description</ControlLabel>
                <FormControl
                  maxLength={50}
                  name={'description'}
                  value={newLabel.description}
                />
                <FormControl.Feedback />
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <Row>
                <Col xs={3}>
                  <FormGroup>
                    <ControlLabel>Color</ControlLabel>
                    <FormControl
                      value={newLabel.color}
                      name={'color'}
                      type='color'
                    />
                    <FormControl.Feedback />
                  </FormGroup>
                </Col>
                {isProjectAdmin && (
                  <Col xs={9}>
                    <Checkbox
                      checked={newLabel.adminOnly}
                      name='adminOnly'
                      type='checkbox'
                      style={{ margin: 0 }}
                    >
                      <strong>Visible pour les administrateurs seulement ?</strong>
                    </Checkbox>
                    <div style={{marginTop: 5}}>
                      Si l'option est choisie, l'étiquette sera visible seulement pour les administrateurs du projet et de l'application.
                    </div>
                  </Col>
                )}
              </Row>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Modal.Footer>
          {/* Cancel button */}
          <Button onClick={this.props.onDone} style={{ marginRight: 10 }}>Cancel</Button>
          {/* Save button */}
          <Button
            bsStyle='primary'
            disabled={this._settingsAreUnedited() || !this._formIsValid()}
            type='submit'
            onClick={this._onSaveSettings}
          >
            Save
          </Button>
        </Modal.Footer>
      </Form>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    newLabel: state.newLabel,
    user: state.user
  }
}

const mapDispatchToProps = {
  createLabel, updateLabel
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LabelEditor)
