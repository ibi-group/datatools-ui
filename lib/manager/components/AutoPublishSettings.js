// @flow

import React, { Component } from 'react'
import {
  Checkbox,
  Col,
  FormGroup,
  ListGroup,
  ListGroupItem,
  Panel
} from 'react-bootstrap'

import * as feedsActions from '../actions/feeds'
import type { Feed } from '../../types'

type Props = {
  disabled: ?boolean,
  feedSource: Feed,
  updateFeedSource: typeof feedsActions.updateFeedSource
}

/**
 * This component displays auto-publish settings for a feed.
 * Auto-publish settings are kept in a separate section per MTC request.
 */
export default class AutoPublishSettings extends Component<Props> {
  _onToggleAutoPublish = () => {
    const {feedSource, updateFeedSource} = this.props
    updateFeedSource(feedSource, {autoPublish: !feedSource.autoPublish})
  }

  render () {
    const {
      disabled,
      feedSource
    } = this.props
    // Do not allow users without manage-feed permission to modify auto-publish settings.
    if (disabled) {
      return (
        <p className='lead'>
          El usuario no está autorizado para modificar la configuración de publicación automática.
        </p>
      )
    }
    return (
      <Col xs={7}>
        {/* Settings */}
        <Panel header={<h3>Configuración de publicación automática</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  checked={feedSource.autoPublish}
                  disabled={disabled}
                  onChange={this._onToggleAutoPublish}
                >
                  <strong>Publicar automáticamente este feed después de la recuperación automática</strong>
                </Checkbox>
                <small>
                  Configurar esta Feed source para que se publique automáticamente
                  cuando se obtiene automáticamente una nueva versión.
                </small>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
      </Col>
    )
  }
}
