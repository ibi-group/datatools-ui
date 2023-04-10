// @flow

import Icon from '@conveyal/woonerf/components/icon'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import {
  Button,
  ButtonGroup,
  ButtonToolbar,
  ListGroup,
  ListGroupItem,
  Panel
} from 'react-bootstrap'

import SelectFileModal from '../../../common/components/SelectFileModal'
import ConfirmModal from '../../../common/components/ConfirmModal'
import { updateDeployment, uploadPeliasWebhookCsvFile, updatePelias } from '../../actions/deployments'
import { setErrorMessage } from '../../actions/status'
import type { Deployment, Project } from '../../../types'

type Props = {
  deployment: Deployment,
  project: Project,
  setErrorMessage: typeof setErrorMessage,
  updateDeployment: typeof updateDeployment,
  updatePelias: typeof updatePelias,
  uploadPeliasWebhookCsvFile: typeof uploadPeliasWebhookCsvFile
}

type State = {
  fileToDeleteOnSuccesfulUpload: string | null,
}

class PeliasPanel extends Component<Props, State> {
  state = {
    fileToDeleteOnSuccesfulUpload: null
  };

  /**
   * Method fired when Pelias *Update* button is pressed
   */
  _onClickPeliasUpdate = () => {
    const {deployment, updatePelias} = this.props
    updatePelias(deployment)
  }
  /**
   * Method fired when Pelias *Reset* button is pressed. The true
   * flag tells the webhook to wipe the Pelias database before updating.
   */
  _onClickPeliasReset = () => {
    const {deployment, updatePelias} = this.props
    updatePelias(deployment, true)
  }

  /**
   * Updates state on input changes. Does not persist changes to deployment
   */
  _onChangeTextInput = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const { target } = event
    const { value, id } = target
    this.setState({ [id]: value })
  };
  /**
   * Fires when input field is blurred, and persists state changes to the deployment by
   * making a network request
  */
  _onBlurTextInput = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const { target } = event
    const { value, id } = target
    const { deployment } = this.props

    // Only make a network request if the value differs
    if (deployment[id] !== value) {
      this._updateDeployment({ [id]: value })
    }
  };

  _onCsvActionButtonClick = (event: SyntheticInputEvent<HTMLInputElement>, url: string) => {
    const { id } = event.target

    switch (id) {
      case 'replace':
        // Action is launched via a prop of the modal
        this.refs.uploadModal.open()
        this.setState({fileToDeleteOnSuccesfulUpload: url})
        break
      case 'delete':
        if (confirm('¿Está seguro de que desea eliminar este archivo CSV?')) {
          this._deleteCsvFile(url)
        }
        break
      default:
        console.error('CSV button click handler called from outside valid button')
    }
  }

  /**
   * Takes files submitted via the file uploader modal and sends them to datatools server where they are
   * uploaded to S3
   * @param files Array of files returned by the file upload modal
   * @returns     True or false depending on if the upload was a success
   */
  _onConfirmUpload = async (files: Array<File>) => {
    const { deployment, uploadPeliasWebhookCsvFile } = this.props
    const { fileToDeleteOnSuccesfulUpload } = this.state

    const file = files[0]
    // TODO: more extensive csv validation?
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      return false
    }

    // Extra step is required for flow to be appeased
    const uploadSuccess = await uploadPeliasWebhookCsvFile(deployment, file, fileToDeleteOnSuccesfulUpload)
    return uploadSuccess
  }

  /**
   * Removes a csv file from the list of Pelias csv files associated with a deployment
   * WARNING: DOES NOT REMOVE THE FILE FROM S3!
   * @param url   The URL of the csv file to remove from the deployment
   */
  _deleteCsvFile = async (url: string) => {
    const { deployment } = this.props
    if (!deployment.peliasCsvFiles) return

    const updatedCsvFiles = deployment.peliasCsvFiles.filter(u => u !== url)
    this._updateDeployment({'peliasCsvFiles': updatedCsvFiles})
  }

  /**
   * Persists changes to the deployment object by making a request to the datatools server
   */
  _updateDeployment = (props: { [string]: any }) => {
    const { deployment, updateDeployment } = this.props
    updateDeployment(deployment, props)
  };

  /**
   * Renders a csv link associated with the deployment. Renders the file name (or URI if not added by datatools) and
   * buttons to replace or remove the file
   * @param {*} url     The URL to add to the list of csv files associated with the deployment
   * @param {*} enabled Whether the buttons should be enabled
   * @returns           JSX including the file name and buttons
   */
  renderCsvUrl = (url: string, enabled: boolean) => {
    // Usually, files will be rendered by https://github.com/ibi-group/datatools-server/blob/dev/src/main/java/com/conveyal/datatools/manager/controllers/api/DeploymentController.java
    // so we can take advantage of a predictable filename
    // As a fallback, render the full url
    const fileName = url.split('_').length === 2 ? url.split('_')[1] : url
    return (
      <li key={url}>
        {fileName}{' '}
        <Button
          disabled={!enabled}
          bsSize='xsmall'
          id='replace'
          onClick={(e) => this._onCsvActionButtonClick(e, url)}
        >
          Replace
        </Button>
        <Button
          disabled={!enabled}
          bsSize='xsmall'
          id='delete'
          onClick={(e) => this._onCsvActionButtonClick(e, url)}
        >
          Delete
        </Button>
      </li>
    )
  }

  render () {
    const { deployment, project } = this.props

    // Don't show panel is no webhook url is set
    if (!project.peliasWebhookUrl) {
      return null
    }

    const peliasButtonsDisabled = !deployment || (deployment.ec2Instances && deployment.ec2Instances.length === 0)

    return (
      <Panel
        header={
          <h3>
            <Icon type='map-marker' /> Configuración del índice de lugares locales
          </h3>
        }
      >
        <ListGroup fill>
          <ListGroupItem>
            <ButtonToolbar style={{display: 'flex', flexDirection: 'row'}}>
              <h5>Local Places Index</h5>
              <ButtonGroup title={peliasButtonsDisabled ? 'El índice de lugares locales solo se puede actualizar si hay una instancia de OTP en ejecución' : ''}>
                {/* If there are no deployments don't allow user to update Pelias yet */}
                <Button
                  onClick={this._onClickPeliasUpdate}
                  disabled={peliasButtonsDisabled}
                >
                  Update
                </Button>
                <Button
                  onClick={() => this.refs.reInitPeliasModal.open()}
                  disabled={peliasButtonsDisabled}
                >Reset</Button>
              </ButtonGroup>
            </ButtonToolbar>
            <ConfirmModal
              ref='reInitPeliasModal'
              title='¿Está seguro de que desea reconstruir la base de datos del índice de lugares locales?'
              body='Esto hará que las respuestas del geocodificador personalizado no estén disponibles durante aproximadamente 1 a 5 minutos después del despliegue. Las direcciones regulares y los puntos de referencia seguirán estando disponibles. Las paradas y estaciones de fuentes que no forman parte de esta implementación se eliminarán de las sugerencias.'
              onConfirm={this._onClickPeliasReset}
            />
          </ListGroupItem>
          <ListGroupItem >
            <h5>Archivos CSV de puntos de interés personalizados</h5>
            <p>Estos archivos se envían al Índice de lugares locales cuando se actualiza o restablece</p>
            <SelectFileModal
              ref='uploadModal'
              title='Subir archivo CSV'
              body='Seleccione un archivo CSV de lugares/puntos de interés locales para cargar:'
              onConfirm={async (files) => this._onConfirmUpload(files)}
              onCancel={() =>
                this.setState({ fileToDeleteOnSuccesfulUpload: null })
              }
              errorMessage='El archivo subido debe ser un archivo csv válido (.csv).'
            />
            <ul>
              {deployment.peliasCsvFiles &&
                deployment.peliasCsvFiles.map((url) =>
                  this.renderCsvUrl(url, !peliasButtonsDisabled)
                )}
            </ul>
            <Button
              disabled={peliasButtonsDisabled}
              style={{ marginTop: '5px' }}
              onClick={() => this.refs.uploadModal.open()}
            >
              Upload New CSV File
            </Button>
          </ListGroupItem>
        </ListGroup>
      </Panel>
    )
  }
}

const mapDispatchToProps = {uploadPeliasWebhookCsvFile, setErrorMessage, updatePelias}

export default connect(
  null,
  mapDispatchToProps
)(PeliasPanel)
