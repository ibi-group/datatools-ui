// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {
  Button,
  FormControl,
  FormGroup,
  HelpBlock,
  Radio
} from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import * as deploymentActions from '../../actions/deployments'
import {isValidJSONC} from '../../../common/util/json'

import type {
  Deployment
} from '../../../types'

const SAMPLE_BUILD_CONFIG = `{
  "subwayAccessTime": 2.5
}`

const SAMPLE_ROUTER_CONFIG = `{
  "routingDefaults": {
    "walkSpeed": 2.0,
    "stairsReluctance": 4.0,
    "carDropoffTime": 240
  }
}`

export default class CustomConfig extends Component<{
  deployment: Deployment,
  label: string,
  name: string,
  updateDeployment: typeof deploymentActions.updateDeployment
}, {[string]: any}> {
  state = {}

  _toggleCustomConfig = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const {deployment, updateDeployment} = this.props
    const {name} = evt.target
    const value = deployment[name]
      ? null
      : name === 'customBuildConfig'
        ? SAMPLE_BUILD_CONFIG
        : SAMPLE_ROUTER_CONFIG
    updateDeployment(deployment, {[name]: value})
  }

  _onChangeConfig = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({[this.props.name]: evt.target.value})

  _onSaveConfig = () => {
    const {deployment, name, updateDeployment} = this.props
    const value = this.state[name]
    if (!isValidJSONC(value)) return window.alert('Must provide valid JSON string.')
    else {
      updateDeployment(deployment, {[name]: value})
      this.setState({[name]: undefined})
    }
  }

  render () {
    const {deployment, name, label} = this.props
    const useCustom = deployment[name] !== null
    const value = this.state[name] || deployment[name]
    const validJSON = isValidJSONC(value)
    return (
      <div>
        <h5>{label} configuración</h5>
        <FormGroup>
          <Radio
            checked={!useCustom}
            name={name}
            onChange={this._toggleCustomConfig}
            inline>
            Proyecto por defecto
          </Radio>
          <Radio
            checked={useCustom}
            name={name}
            onChange={this._toggleCustomConfig}
            inline>
            Personalizado
          </Radio>
        </FormGroup>
        <p>
          {useCustom
            ? `Use JSON personalizado definido a continuación para ${label} configuración.`
            : `Use el ${label} configuración definida en la configuración de despliegue del proyecto.`
          }
          <span>{' '}
            {useCustom
              ? <Button
                style={{marginLeft: '15px'}}
                bsSize='xsmall'
                disabled={!this.state[name] || !validJSON}
                onClick={this._onSaveConfig}>Guardar</Button>
              : <LinkContainer
                to={`/project/${deployment.projectId}/settings/deployment`}>
                <Button bsSize='xsmall'>
                  <Icon type='pencil' /> Editar
                </Button>
              </LinkContainer>
            }
          </span>
        </p>
        {useCustom &&
          <FormGroup validationState={validJSON ? null : 'error'}>
            <FormControl
              componentClass='textarea'
              style={{height: '125px'}}
              placeholder='{"blah": true}'
              onChange={this._onChangeConfig}
              value={value} />
            {!validJSON && <HelpBlock>Debe proporcionar una cadena JSON válida.</HelpBlock>}
          </FormGroup>
        }
      </div>
    )
  }
}
