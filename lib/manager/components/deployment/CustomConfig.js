/* eslint-disable complexity */
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
import validator from 'validator'

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

const CONFIG_OPTIONS = {
  custom: 'custom',
  url: 'url'
}

export default class CustomConfig extends Component<{
  deployment: Deployment,
  label: string,
  name: string,
  updateDeployment: typeof deploymentActions.updateDeployment
}, {[string]: any}> {
  state = {}

  getName = (option?: string) => {
    let {name} = this.props
    if (option === CONFIG_OPTIONS.url) {
      name += 'Url'
    }
    return name
  }

  _toggleCustomConfig = (evt: SyntheticInputEvent<HTMLInputElement>, option?: string) => {
    const {deployment, name, updateDeployment} = this.props
    let value = 'https://'
    if (name === 'customBuildConfig' && option === CONFIG_OPTIONS.custom) value = deployment[name] || SAMPLE_BUILD_CONFIG
    if (name === 'customRouterConfig' && option === CONFIG_OPTIONS.custom) value = deployment[name] || SAMPLE_ROUTER_CONFIG

    // If no option, clear everything
    if (!option) {
      updateDeployment(deployment, {[name + 'Url']: null, [name]: null})
    }

    // If custom content, clear URL
    if (option === CONFIG_OPTIONS.custom) {
      updateDeployment(deployment, {[name + 'Url']: null, [name]: value})
    }

    // If custom URL, clear content
    if (option === CONFIG_OPTIONS.url) {
      updateDeployment(deployment, {[name + 'Url']: value})
    }
  }

  _onChangeConfig = (evt: SyntheticInputEvent<HTMLInputElement>, option?: string) => {
    const name = this.getName(option)

    this.setState({[name]: evt.target.value})
  }

  _onSaveConfig = (option?: string) => {
    const {deployment, updateDeployment} = this.props
    const name = this.getName(option)

    const value = this.state[name]
    if (option === CONFIG_OPTIONS.custom && !isValidJSONC(value)) return window.alert('Must provide valid JSON string.')
    else if (option === CONFIG_OPTIONS.url && !validator.isURL(value)) return window.alert('Must provide valid URL string.')
    else {
      updateDeployment(deployment, {[name]: value})
      this.setState({[name]: undefined})
    }
  }

  render () {
    const {deployment, name, label} = this.props
    const useCustom = deployment[name] !== null
    const useCustomUrl = deployment[name + 'Url'] !== null
    const value = this.state[name] || deployment[name]
    const urlValue = this.state[name + 'Url'] || deployment[name + 'Url']
    const validJSON = isValidJSONC(value)
    const validURL = !!urlValue && validator.isURL(urlValue)
    return (
      <div>
        <h5>{label} configuration</h5>
        <FormGroup>
          <Radio
            checked={!useCustom && !useCustomUrl}
            name={name}
            onChange={(e) => this._toggleCustomConfig(e)}
            inline>
            Project default
          </Radio>
          <Radio
            checked={useCustom && !useCustomUrl}
            name={name}
            onChange={e => this._toggleCustomConfig(e, CONFIG_OPTIONS.custom)}
            inline>
            Custom
          </Radio>
          <Radio
            checked={useCustomUrl}
            name={name}
            onChange={e => this._toggleCustomConfig(e, CONFIG_OPTIONS.url)}
            inline>
            URL
          </Radio>
        </FormGroup>
        <p>
          {useCustom && `Use custom JSON defined below for ${label} configuration.`}
          {useCustomUrl && `Download ${label} configuration from URL defined below.`}
          {!useCustom && !useCustomUrl && `Use the ${label} configuration defined in the project deployment settings.`}
          <span>{' '}
            {useCustom || useCustomUrl
              ? <Button
                style={{marginLeft: '15px'}}
                bsSize='xsmall'
                disabled={!this.state[useCustomUrl ? name + 'Url' : name] || (useCustomUrl ? !validURL : !validJSON)}
                onClick={() => this._onSaveConfig(useCustomUrl ? CONFIG_OPTIONS.url : CONFIG_OPTIONS.custom)}>Save</Button>
              : <LinkContainer
                to={`/project/${deployment.projectId}/settings/deployment`}>
                <Button bsSize='xsmall'>
                  <Icon type='pencil' /> Edit
                </Button>
              </LinkContainer>
            }
          </span>
        </p>
        {useCustom && !useCustomUrl &&
          <FormGroup validationState={validJSON ? null : 'error'}>
            <FormControl
              componentClass='textarea'
              style={{height: '125px'}}
              placeholder='{"property": true}'
              onChange={e => this._onChangeConfig(e, CONFIG_OPTIONS.custom)}
              value={value} />
            {!validJSON && <HelpBlock>Must provide valid JSON string.</HelpBlock>}
          </FormGroup>
        }
        {useCustomUrl &&
          <FormGroup validationState={validURL ? null : 'error'}>
            <FormControl
              componentClass='input'
              placeholder='http://example.com'
              onChange={e => this._onChangeConfig(e, CONFIG_OPTIONS.url)}
              value={urlValue} />
            {!validURL && <HelpBlock>Must provide valid URL.</HelpBlock>}
          </FormGroup>
        }
      </div>
    )
  }
}
