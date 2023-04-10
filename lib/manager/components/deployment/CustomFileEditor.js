// @flow

import React, {Component} from 'react'
import {
  Button,
  ButtonToolbar,
  Checkbox,
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock
} from 'react-bootstrap'

import type {
  CustomFile
} from '../../../types'

type Props = {
  customFile: CustomFile,
  customFileEditIdx: null | number,
  idx: number,
  onCancelEditing: () => void,
  onDelete: (number) => void,
  onEdit: (number) => void,
  onSave: (number, CustomFile) => void
}

export default class CustomFileEditor extends Component<Props, {
  fileSource: 'raw' | 'uri',
  model: CustomFile
}> {
  constructor (props: Props) {
    super(props)
    const { customFile } = props
    this.state = {
      fileSource: customFile.contents ? 'raw' : 'uri',
      model: props.customFile
    }
  }

  _canEdit = () => this.props.customFileEditIdx === null

  /**
   * Makes sure that the filename is valid. The filename is optional when a uri
   * is provided, but is required when entering raw input.
   */
  _fileNameValid = (): boolean => {
    const {fileSource, model: customFile} = this.state
    return fileSource === 'uri' || Boolean(customFile.filename)
  }

  /**
   * Makes sure that a uri or some raw input has been added
   */
  _hasContents = (): boolean => {
    const {model: customFile} = this.state
    return Boolean(customFile.contents) || Boolean(customFile.uri)
  }

  /**
   * Makes sure that the file is used during either graph building, serving or
   * both.
   */
  _hasSomeUsage = (): boolean => {
    const {model: customFile} = this.state
    return customFile.useDuringBuild || customFile.useDuringServe
  }

  _isEditing= () => this.props.idx === this.props.customFileEditIdx

  _isValidOverall = (): boolean => {
    return this._fileNameValid() && this._hasSomeUsage() && this._hasContents()
  }

  _onChangeBuildUse = () => {
    const { model } = this.state
    this.setState({
      model: {
        ...model,
        useDuringBuild: !model.useDuringBuild
      }
    })
  }

  _onChangeContents = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      model: {
        ...this.state.model,
        contents: evt.target.value
      }
    })
  }

  _onChangeFilename = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      model: {
        ...this.state.model,
        filename: evt.target.value
      }
    })
  }

  _onChangeServeUse = () => {
    const { model } = this.state
    this.setState({
      model: {
        ...model,
        useDuringServe: !model.useDuringServe
      }
    })
  }

  _onChangeSource = (evt: SyntheticInputEvent<HTMLSelectElement>) => {
    const model = {...this.state.model}
    // set variable to make flow happy
    let newSource
    if (evt.target.value === 'raw') {
      model.uri = null
      newSource = 'raw'
    } else {
      model.contents = null
      newSource = 'uri'
    }
    this.setState({
      fileSource: newSource,
      model
    })
  }

  _onChangeUri = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({
      model: {
        ...this.state.model,
        uri: evt.target.value
      }
    })
  }

  _onCancelEditing = () => {
    const { customFile, onCancelEditing } = this.props
    this.setState({
      fileSource: customFile.contents ? 'raw' : 'uri',
      model: customFile
    })
    onCancelEditing()
  }

  _onDelete = () => {
    const { idx, onDelete } = this.props
    onDelete(idx)
  }

  _onEdit = () => {
    const { idx, onEdit } = this.props
    onEdit(idx)
  }

  _onSave = () => {
    const { idx, onSave } = this.props
    onSave(idx, this.state.model)
  }

  _renderToolbar = () => {
    const { customFile } = this.props
    const isEditing = this._isEditing()
    const canEdit = this._canEdit()
    const isNewFile = Object.keys(customFile).every(key => !customFile[key])
    return (
      <ButtonToolbar>
        {canEdit &&
          <Button
            bsSize='xsmall'
            onClick={this._onEdit}
          >
            Editar
          </Button>
        }
        {isEditing && !isNewFile &&
          <Button
            bsSize='xsmall'
            onClick={this._onCancelEditing}
          >
            Cancelar
          </Button>
        }
        {isEditing &&
          <Button
            bsSize='xsmall'
            disabled={!this._isValidOverall()}
            onClick={this._onSave}
          >
            Guardar
          </Button>
        }
        <Button
          bsSize='xsmall'
          bsStyle='danger'
          className='pull-right'
          disabled={!canEdit && !isEditing}
          onClick={this._onDelete}
        >
          Eliminar
        </Button>
      </ButtonToolbar>
    )
  }

  render () {
    const {
      fileSource,
      model: customFile
    } = this.state
    const filenameValid = this._fileNameValid()
    const hasSomeUsage = this._hasSomeUsage()
    const hasContents = this._hasContents()
    const isEditing = this._isEditing()
    return (
      <div className='custom-file'>
        {this._renderToolbar()}
        <div className='margin-top-15'>
          {isEditing
            ? <FormGroup validationState={filenameValid ? null : 'error'}>
              <FormControl
                onChange={this._onChangeFilename}
                placeholder='Introduce el nombre del archivo'
                type='text'
                value={customFile.filename}
              />
              {!filenameValid && (
                <HelpBlock>
                  El nombre de archivo debe establecerse al proporcionar una entrada sin formato!
                </HelpBlock>
              )}
            </FormGroup>
            : <span>
              Nombre del archivo:{' '}
              <span style={{fontFamily: 'monospace'}}>
                {fileSource === 'raw'
                  ? customFile.filename
                  : customFile.filename || '[el valor predeterminado es el nombre de archivo al final de la URI]'}
              </span>
            </span>
          }
        </div>
        <FormGroup validationState={hasSomeUsage ? null : 'error'}>
          <Checkbox
            checked={customFile.useDuringBuild}
            disabled={!isEditing}
            onChange={this._onChangeBuildUse}
          >
            Usar durante la creación del grafo
          </Checkbox>
          <Checkbox
            checked={customFile.useDuringServe}
            disabled={!isEditing}
            onChange={this._onChangeServeUse}
          >
            Usar mientras se ejecuta el servidor
          </Checkbox>
          {!hasSomeUsage && (
            <HelpBlock>
              El archivo debe usarse durante la creación de grafos o la ejecución del servidor (o ambos)!
            </HelpBlock>
          )}
        </FormGroup>
        <FormGroup validationState={hasContents ? null : 'error'}>
          <ControlLabel>Origen del archivo</ControlLabel>
          <FormControl
            componentClass='select'
            disabled={!isEditing}
            onChange={this._onChangeSource}
            placeholder='select type'
            style={{ marginBottom: 5 }}
            value={fileSource}
          >
            <option value='raw'>De entrada sin procesar</option>
            <option value='uri'>Descargar desde URI</option>
          </FormControl>
          {!hasContents && <HelpBlock>Por favor, establezca el contenido o URI!</HelpBlock>}
          {fileSource === 'raw' && (
            <FormControl
              componentClass='textarea'
              disabled={!isEditing}
              style={{height: '125px'}}
              placeholder='{"blah": true}'
              onChange={this._onChangeContents}
              value={customFile.contents}
            />
          )}
          {fileSource === 'uri' && (
            <span>
              <FormControl
                disabled={!isEditing}
                placeholder='https://www.examle.com/file.json'
                onChange={this._onChangeUri}
                type='text'
                value={customFile.uri}
              />
              {!customFile.uri && (
                <HelpBlock>Ingrese una URL HTTP(S) o un URI de AWS S3</HelpBlock>
              )}
            </span>
          )}
        </FormGroup>
      </div>
    )
  }
}
