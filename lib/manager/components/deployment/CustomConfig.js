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
        <h5>{label} configuration</h5>
        <FormGroup>
          <Radio
            checked={!useCustom}
            name={name}
            onChange={this._toggleCustomConfig}
            inline>
            Project default
          </Radio>
          <Radio
            checked={useCustom}
            name={name}
            onChange={this._toggleCustomConfig}
            inline>
            Custom
          </Radio>
        </FormGroup>
        <p>
          {useCustom
            ? `Use custom JSON defined below for ${label} configuration.`
            : `Use the ${label} configuration defined in the project deployment settings.`
          }
          <span>{' '}
            {useCustom
              ? <Button
                style={{marginLeft: '15px'}}
                bsSize='xsmall'
                disabled={!this.state[name] || !validJSON}
                onClick={this._onSaveConfig}>Save</Button>
              : <LinkContainer
                to={`/project/${deployment.projectId}/settings/deployment`}>
                <Button bsSize='xsmall'>
                  <Icon type='pencil' /> Edit
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
            {!validJSON && <HelpBlock>Must provide valid JSON string.</HelpBlock>}
          </FormGroup>
        }
      </div>
    )
  }
}
