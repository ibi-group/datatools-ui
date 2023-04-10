// @flow

import Icon from '@conveyal/woonerf/components/icon'
import fetch from 'isomorphic-fetch'
import React, {Component} from 'react'
import {
  Checkbox,
  ControlLabel,
  ListGroup,
  ListGroupItem,
  Button,
  Panel,
  Glyphicon
} from 'react-bootstrap'
import Select from 'react-select'
import validator from 'validator'

import * as deploymentActions from '../../actions/deployments'
import {getConfigProperty} from '../../../common/util/config'
import CustomConfig from './CustomConfig'
import CustomFileEditor from './CustomFileEditor'

import type {
  CustomFile,
  Deployment,
  ReactSelectOption
} from '../../../types'

const TRIP_PLANNER_VERSIONS = [
  { label: 'OTP 1.X', value: 'OTP_1' },
  { label: 'OTP 2.X', value: 'OTP_2' }
]

function calculateCustomFileKey (customFile: CustomFile, idx: number): string {
  const {contents, filename, uri} = customFile
  return `${filename || ''}-${contents || ''}-${uri || ''}-${idx}`
}

export default class DeploymentConfigurationsPanel extends Component<{
  deployment: Deployment,
  updateDeployment: typeof deploymentActions.updateDeployment
}, {
  customFileEditIdx: null | number,
  otp: Array<ReactSelectOption>,
}> {
  state = {
    customFileEditIdx: null,
    otp: []
  }
  componentDidMount () {
    // Fetch the available OTP versions from S3.
    this._loadOptions()
  }

  /**
   * Parse .jar options from an S3 text XML response.
   * @param  {string} text text response from s3
   * @param  {string} key  state key under which to store options
   */
  _parseOptionsFromXml = (text: string) => {
    const parser = new window.DOMParser()
    const doc = parser.parseFromString(text, 'application/xml')

    const all = Array.from(doc.querySelectorAll('Contents'))
      .map(item => item.querySelector('Key').childNodes[0].nodeValue) // get just key
      .filter(item => item !== 'index.html') // don't include the main page
      .map(item => item.replace(/.jar$/, '')) // and remove .jar
    this.setState({otp: all})
  }

  _loadAndParseOptionsFromXml = (url: string) => {
    fetch(url)
      .then(res => res.text())
      .then(text => this._parseOptionsFromXml(text))
  }

  /**
   * Load .jar options from OTP and R5 S3 buckets.
   */
  _loadOptions = () => {
    const otpUrl = getConfigProperty('modules.deployment.otp_download_url') || 'https://opentripplanner-builds.s3.amazonaws.com'
    this._loadAndParseOptionsFromXml(otpUrl)
  }

  _onAddCustomFile = () => {
    const { deployment } = this.props
    const customFiles = deployment.customFiles
      ? [...deployment.customFiles, {}]
      : [{}]
    this._updateDeployment({ customFiles })
    this.setState({ customFileEditIdx: customFiles.length - 1 })
  }

  _onChangeBuildGraphOnly = () => this._updateDeployment({buildGraphOnly: !this.props.deployment.buildGraphOnly})

  _onChangeSkipOsmExtract = () => {
    const {skipOsmExtract} = this.props.deployment
    if (!skipOsmExtract) {
      // If changing from including OSM to skipping OSM, verify that this is
      // intentional.
      if (!window.confirm('¿Está seguro de que desea excluir un extracto de OSM de la creación del grafo? Esto evitará el uso de la red de calles OSM en los resultados de enrutamiento.')) {
        return
      }
    }
    this._updateDeployment({skipOsmExtract: !skipOsmExtract})
  }

  _onCancelEditingCustomFile = () => {
    this.setState({ customFileEditIdx: null })
  }

  _onEditCustomFile = (idx: number) => {
    this.setState({ customFileEditIdx: idx })
  }

  _onDeleteCustomFile = (idx: number) => {
    const { deployment } = this.props
    const customFiles = [...deployment.customFiles || []]
    customFiles.splice(idx, 1)
    this._updateDeployment({ customFiles })
    this.setState({ customFileEditIdx: null })
  }

  _onSaveCustomFile = (idx: number, data: CustomFile) => {
    const { deployment } = this.props
    const customFiles = [...deployment.customFiles || []]
    customFiles[idx] = data
    this._updateDeployment({ customFiles })
    this.setState({ customFileEditIdx: null })
  }

  _setOsmUrl = () => {
    const currentUrl = this.props.deployment.osmExtractUrl || ''
    const osmExtractUrl = window.prompt(
      'Proporcione una URL pública desde la cual descargar un extracto de OSM (.pbf).',
      currentUrl
    )
    if (osmExtractUrl) {
      if (!validator.isURL(osmExtractUrl)) {
        window.alert(`URL ${osmExtractUrl} no es valida!`)
        return
      }
      this._updateDeployment({osmExtractUrl})
    }
  }

  _clearOsmUrl = () => this._updateDeployment({osmExtractUrl: null})

  _onUpdateTripPlannerVersion = (option: ReactSelectOption) => {
    const {deployment, updateDeployment} = this.props
    updateDeployment(deployment, { tripPlannerVersion: option.value })
  }

  _onUpdateVersion = (option: ReactSelectOption) => {
    this._updateDeployment({otpVersion: option.value})
  }

  _updateDeployment = (props: {[string]: any}) => {
    const {deployment, updateDeployment} = this.props
    updateDeployment(deployment, props)
  }

  render () {
    const { deployment, updateDeployment } = this.props
    const { customFileEditIdx, otp: options } = this.state
    return (
      <Panel header={<h3><Icon type='cog' /> OTP Configuración</h3>}>
        <ListGroup fill>
          <ListGroupItem>
            <Checkbox
              checked={deployment.buildGraphOnly}
              onChange={this._onChangeBuildGraphOnly}
            >
              Construir solo grafo
            </Checkbox>
            Trip Planner versión:
            <Select
              clearable={false}
              value={deployment.tripPlannerVersion}
              onChange={this._onUpdateTripPlannerVersion}
              options={TRIP_PLANNER_VERSIONS}
            />
            <div>
              Archivo jar OTP
              <Select
                clearable={false}
                value={deployment.otpVersion}
                onChange={this._onUpdateVersion}
                options={options ? options.map(v => ({value: v, label: v})) : []}
              />
            </div>
          </ListGroupItem>
          <ListGroupItem>
            Desplegando al{' '}
            <small><em>{deployment.routerId || 'por defecto'}</em></small>{' '}
            enrutador OpenTripPlanner.
          </ListGroupItem>
          <ListGroupItem>
            Configuración de OpenStreetMap
            <Checkbox
              checked={!deployment.skipOsmExtract}
              onChange={this._onChangeSkipOsmExtract}>
              Construir grafo con extracto de OSM
            </Checkbox>
            {/* Hide URL/auto-extract if skipping OSM extract. */}
            {deployment.skipOsmExtract
              ? null
              : deployment.osmExtractUrl
                ? <div>
                  <ControlLabel className='unselectable buffer-right'>
                    URL:
                  </ControlLabel>
                  <span
                    className='overflow'
                    style={{
                      marginBottom: '5px',
                      width: '240px',
                      verticalAlign: 'middle'
                    }}
                    title={deployment.osmExtractUrl}>
                    {deployment.osmExtractUrl}
                  </span>
                  <Button
                    bsSize='xsmall'
                    style={{marginLeft: '5px'}}
                    onClick={this._setOsmUrl}>Cambiar</Button>
                  <Button
                    bsSize='xsmall'
                    style={{marginLeft: '5px'}}
                    onClick={this._clearOsmUrl}>Limpiar</Button>
                </div>
                : <div>
                  Auto-extracción de OSM (solo Norteamérica)
                  <Button
                    bsSize='xsmall'
                    style={{marginLeft: '5px'}}
                    onClick={this._setOsmUrl}>Sobrescribir</Button>
                </div>
            }
          </ListGroupItem>
          <ListGroupItem>
            <CustomConfig
              name='customBuildConfig'
              label='Build'
              updateDeployment={updateDeployment}
              deployment={deployment} />
          </ListGroupItem>
          <ListGroupItem>
            <CustomConfig
              name='customRouterConfig'
              label='Router'
              updateDeployment={updateDeployment}
              deployment={deployment} />
          </ListGroupItem>
          <ListGroupItem>
            <h5>Archivos personalizados</h5>
            {deployment.customFiles && deployment.customFiles.map(
              (customFile, idx) => (
                <CustomFileEditor
                  customFile={customFile}
                  customFileEditIdx={customFileEditIdx}
                  deployment={deployment}
                  idx={idx}
                  // create a custom key to make sure a new component is created
                  // so that previously deleted files are not used
                  key={calculateCustomFileKey(customFile, idx)}
                  onCancelEditing={this._onCancelEditingCustomFile}
                  onDelete={this._onDeleteCustomFile}
                  onEdit={this._onEditCustomFile}
                  onSave={this._onSaveCustomFile}
                />
              )
            )}
            <Button
              disabled={customFileEditIdx !== null}
              onClick={this._onAddCustomFile}
            >
              <Glyphicon glyph='plus' />{' '}
              Agregar archivo personalizado
            </Button>
          </ListGroupItem>
        </ListGroup>
      </Panel>
    )
  }
}
