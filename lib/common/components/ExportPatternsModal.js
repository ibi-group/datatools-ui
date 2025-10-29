// @flow

import React from 'react'
import { Modal, Button } from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import * as versionActions from '../../manager/actions/versions'
import type { Feed, Snapshot } from '../../types'
import type { ItemProps } from '../../editor/components/EditorFeedSourcePanel'

type Props = {
  createFeedVersionFromSnapshot: typeof versionActions.createFeedVersionFromSnapshot,
  feedSource: Feed,
}

type State = {
  showModal: boolean,
  snapshot: ?Snapshot
}

export default class ExportPatternsModal extends React.Component<Props, State> {
  messages = getComponentMessages('ExportPatternsModal')

  state = {
    showModal: false,
    snapshot: null
  }

  publish (publishProprietaryFiles: boolean) {
    const { createFeedVersionFromSnapshot, feedSource } = this.props
    this.state.snapshot && createFeedVersionFromSnapshot(feedSource, this.state.snapshot.id, publishProprietaryFiles)
    this.close()
  }

  close () {
    this.setState({showModal: false})
  }

  // Open is called by the SnapshotItem class
  open (props: ItemProps) {
    this.setState({showModal: true, snapshot: props.snapshot})
  }

  render () {
    const {Body, Title} = Modal
    const buttonStyle = {marginLeft: '10px', width: '50px'}

    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Body style={{display: 'flex'}}>
          <Title>{this.messages('exportPatterns')}</Title>
          <Button
            onClick={() => this.publish(true)}
            style={buttonStyle}
          >
            {this.messages('yes')}
          </Button>
          <Button
            data-test-id='export-patterns-modal-no'
            onClick={() => this.publish(false)}
            style={buttonStyle}
          >
            {this.messages('no')}
          </Button>
        </Body>
      </Modal>
    )
  }
}
