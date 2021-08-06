import React from 'react'
import { Modal, Button } from 'react-bootstrap'

// @flow

import LabelAssigner from '../components/LabelAssigner'
import type { FeedSource, Project } from '../../types'

type Props = {
  feedSource: FeedSource,
  project: Project,
};

type State = {
  showModal: boolean,
};

export default class LabelEditorModal extends React.Component<Props, State> {
  state = {
    showModal: false
  };

  close = () => {
    this.setState({
      showModal: false
    })
  };

  // Used in the ref
  open = () => {
    this.setState({
      showModal: true
    })
  };

  // Used in the ref
  ok = () => {
    this.close()
  };

  render () {
    const { Body, Header, Title, Footer } = Modal
    const { feedSource, project } = this.props
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Header>
          <Title>{`Add Labels to ${feedSource.name}`}</Title>
        </Header>

        <Body>
          <LabelAssigner feedSource={feedSource} project={project} />
        </Body>
        <Footer>
          <Button
            data-test-id='label-assigner-done-button'
            onClick={this.close}
          >
            Done
          </Button>
        </Footer>
      </Modal>
    )
  }
}
