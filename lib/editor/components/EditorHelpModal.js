// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Modal, Button, ButtonToolbar, Checkbox} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'

import * as snapshotActions from '../actions/snapshots'
import {getConfigProperty} from '../../common/util/config'

import type {Feed} from '../../types'
import type {EditorStatus} from '../../types/reducers'

type Props = {
  createSnapshot: typeof snapshotActions.createSnapshot,
  feedSource: Feed,
  hideTutorial: boolean,
  isNewFeed: boolean,
  loadFeedVersionForEditing: typeof snapshotActions.loadFeedVersionForEditing,
  refreshEditor: () => void,
  show: boolean,
  status: EditorStatus
}

type State = {
  hideTutorial: boolean,
  showModal: boolean
}

export default class EditorHelpModal extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      showModal: this.props.show,
      hideTutorial: this.props.hideTutorial
    })
  }

  _onToggleTutorial = () => this.setState({hideTutorial: !this.state.hideTutorial})

  _buildFromScratch = () => {
    const {createSnapshot, feedSource} = this.props
    createSnapshot(feedSource, 'Blank')
  }

  _onClickLoad = () => {
    const {feedSource, loadFeedVersionForEditing} = this.props
    const {latestVersionId: feedVersionId, id: feedSourceId} = feedSource
    if (!feedVersionId) return console.warn('Cannot load null version ID.')
    loadFeedVersionForEditing({feedSourceId, feedVersionId})
  }

  _onClickBeginEditing = () => {
    // To begin editing, the GtfsEditor refreshEditor function is called in order to
    // fetch the base GTFS and perform any other initialization activities (e.g.
    // to create an exclusive lock to edit the feed).
    this.props.refreshEditor()
    this.close()
  }

  close = () => {
    this.setState({ showModal: false })
  }

  open () {
    this.setState({ showModal: true })
  }

  render () {
    const {feedSource, isNewFeed, show, status} = this.props
    if (!show) return null
    const {Body, Footer, Header, Title} = Modal
    const docsUrl: ?string = getConfigProperty('application.docs_url')
    return (
      <Modal
        show={this.state.showModal}
        onHide={this.close}
        // Prevent closure of modal if there is no snapshot yet
        backdrop={isNewFeed ? 'static' : undefined}>
        <Header closeButton={!isNewFeed}>
          <Title>Welcome to the GTFS Editor</Title>
        </Header>
        <Body>
          {isNewFeed
            ? <div>
              {status.snapshotFinished
                ? <p className='text-center'>Snapshot creado correctamente!</p>
                : <p>
                  No hay ningún feed cargado en el editor. Para comenzar a editar, 
                  puede comenzar desde cero o importar una versión existente 
                  (si existe una versión).
                </p>
              }
              {status.snapshotFinished
                ? <Button
                  block
                  bsSize='large'
                  bsStyle='primary'
                  data-test-id='begin-editing-button'
                  onClick={this._onClickBeginEditing} >
                  <Icon type='check' /> Empezar a editar
                </Button>
                : <ButtonToolbar>
                  <Button
                    block
                    bsSize='large'
                    data-test-id='edit-from-scratch-button'
                    disabled={status.creatingSnapshot}
                    onClick={this._buildFromScratch}
                  >
                    <Icon type='file' /> Empezar desde cero
                  </Button>
                  <Button
                    block
                    bsSize='large'
                    data-test-id='import-latest-version-button'
                    disabled={!feedSource.latestVersionId || status.creatingSnapshot}
                    onClick={this._onClickLoad}
                  >
                    <Icon type='upload' /> Importar última versión
                  </Button>
                </ButtonToolbar>
              }
            </div>
            : docsUrl
              ? <p>Para obtener instrucciones sobre el uso del editor, consulte la{' '}
                <a
                  target='_blank'
                  href={`${docsUrl}/en/latest/user/editor/introduction/`} >
                  documentación
                </a>.
              </p>
              : null
          }
        </Body>
        <Footer>
          {!isNewFeed && <small className='pull-left'>
            <Checkbox
              checked={this.state.hideTutorial}
              onChange={this._onToggleTutorial}>
              No mostrar cuando se abre el editor
            </Checkbox>
          </small>}
          {isNewFeed
            ? <LinkContainer to={feedSource ? `/feed/${feedSource.id}` : `/home`}>
              <Button><Icon type='chevron-left' /> Volver al Feed source</Button>
            </LinkContainer>
            : <Button onClick={this.close}>Cerrar</Button>
          }
        </Footer>
      </Modal>
    )
  }
}
