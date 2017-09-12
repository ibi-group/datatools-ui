import React, {Component, PropTypes} from 'react'

import { Panel, Row, Col, ButtonGroup, Button, Glyphicon, Label } from 'react-bootstrap'
import { checkEntitiesForFeeds } from '../../common/util/permissions'

export default class SignPreview extends Component {
  static propTypes = {
    onEditClick: PropTypes.func,
    sign: PropTypes.object
  }

  _onClickDelete = (evt) => {
    const r = window.confirm('Are you sure you want to delete this sign configuration?')
    if (r) {
      this.props.onDeleteClick(this.props.sign)
    } else {

    }
    // this.props.showConfirmModal({
    //   title: 'Delete Configuration #' + this.props.sign.id + '?',
    //   body: <p>Are you sure you want to delete <strong>Sign Configuration {this.props.sign.id}</strong>?</p>,
    //   onConfirm: () => {
    //     this.props.onDeleteClick(this.props.sign)
    //   }
    // })
  }

  _onClickEdit = () => this.props.onEditClick(this.props.sign)

  render () {
    const {
      sign,
      publishableFeeds,
      editableFeeds
    } = this.props
    const canPublish = checkEntitiesForFeeds(sign.affectedEntities, publishableFeeds)
    const canEdit = checkEntitiesForFeeds(sign.affectedEntities, editableFeeds)

    const editingIsDisabled = sign.published && !canPublish ? true : !canEdit

    // if user has edit rights and sign is unpublished, user can delete sign, else check if they have publish rights
    const deleteIsDisabled = !editingIsDisabled && !sign.published ? false : !canPublish
    const deleteButtonMessage = sign.published && deleteIsDisabled ? 'Cannot delete because sign is published'
      : !canEdit ? 'Cannot alter signs for other agencies' : 'Delete sign'

    const editButtonMessage = sign.published && deleteIsDisabled ? 'Cannot edit because sign is published'
      : !canEdit ? 'Cannot alter signs for other agencies' : 'Edit sign'
    const publishedLabel = sign.published
      ? <Label title='Published' bsStyle='success'><Glyphicon glyph='ok' /></Label>
      : <Label title='Draft' bsStyle='warning'><Glyphicon glyph='pencil' /></Label>
    const displaysLabel = sign.displays
      ? <Label title={`${sign.displays.length} associated display(s)`} bsStyle='default'><Glyphicon glyph='modal-window' /> {sign.displays.length}</Label>
      : <Label title={`0 associated display(s)`} bsStyle='default'><Glyphicon glyph='modal-window' /> 0</Label>
    return (
      <Panel collapsible header={
        <Row>
          <Col xs={8}>
            <p style={{margin: 0}}>
              <strong>{sign.title}</strong>
            </p>
            <p style={{margin: 0}}>
              ID: #{sign.id} <span>{publishedLabel} {displaysLabel}</span>
            </p>
          </Col>
          <Col xs={4}>
            <ButtonGroup className='pull-right'>
              <Button
                title={editButtonMessage}
                disabled={editingIsDisabled}
                onClick={this._onClickEdit}>
                <Glyphicon glyph='pencil' />
              </Button>
              <Button
                title={deleteButtonMessage}
                disabled={deleteIsDisabled}
                onClick={this._onClickDelete}>
                <Glyphicon glyph='remove' />
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
      }>
        <p>
          <span className='pull-right'>
            {publishedLabel} {sign.published ? 'Published' : 'Draft'}
          </span>
        </p>
        <p>Stops:&nbsp;
          {sign.affectedEntities
            ? sign.affectedEntities.map((e, index) => {
              return e.stop
                ? <span key={index}>
                  {e.stop.stop_name} <Label bsStyle='primary'>{e.route.length} routes</Label>
                </span>
                : e.stop_id
            })
            : ''
          }
        </p>
        <p>
          <span className='pull-right'>{displaysLabel} associated display(s)</span>
        </p>
      </Panel>
    )
  }
}
