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
          L'utilisateur n'est pas autorisé à modifier les paramètres d'auto-publication.
        </p>
      )
    }
    return (
      <Col xs={7}>
        {/* Settings */}
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h3'>Paramètres d'auto-publication</Panel.Title></Panel.Heading>
          <ListGroup>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  checked={feedSource.autoPublish}
                  disabled={disabled}
                  onChange={this._onToggleAutoPublish}
                >
                  <strong>Auto-publier ce flux après l'auto-récupération</strong>
                </Checkbox>
                <small>
                  Régler ce flux pour qu'il soit automatiquement
                  publié quand une nouvelle version est récupérée
                  automatiquement.
                </small>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
      </Col>
    )
  }
}
