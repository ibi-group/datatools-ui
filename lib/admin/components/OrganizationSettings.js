import React, { Component, PropTypes } from 'react'
import { ControlLabel, FormControl, FormGroup, Radio, Row, Col } from 'react-bootstrap'
import DateTimeField from 'react-bootstrap-datetimepicker'
import Select from 'react-select'
import moment from 'moment'

import { getComponentMessages, getMessage } from '../../common/util/config'
import toSentenceCase from '../../common/util/to-sentence-case'

export default class OrganizationSettings extends Component {
  static propTypes = {
    organization: PropTypes.object
  }

  state = this.props.organization || {
    // default values for organization
    usageTier: 'LOW',
    subscriptionBeginDate: +moment().startOf('day'),
    subscriptionEndDate: +moment().startOf('day').add(1, 'year').add(1, 'day')
  }

  getSettings () {
    if (this.isValid()) {
      return this.state
    } else {
      return null
    }
  }

  isValid () {
    if (this.state.name) {
      return true
    } else {
      return false
    }
  }

  save = () => {
    if (!this.props.organization) {
      this.props.createOrganization(this.state)
    } else {
      this.props.saveOrganization(this.props.organization)
    }
  }

  handleChange = (evt) => this.setState({[evt.target.name]: evt.target.value})

  handleDateChange = name => value => {
    return this.setState({[name]: +value})
  }

  _onChangeProjects = (values) => this.setState({projects: values ? values.map(v => v.project) : []})

  _onChangeExtensions = (values) => this.setState({extensions: values ? values.map(v => v.value) : []})

  render () {
    console.log(this.state)
    const { organization, projects } = this.props
    const extensions = [
      'GTFS_PLUS',
      'DEPLOYMENT',
      'VALIDATOR',
      'ALERTS',
      'SIGN_CONFIG'
    ]
    const messages = getComponentMessages('OrganizationSettings')
    const orgFields = ['name', 'logoUrl']
    const projectToOption = project => ({label: project.name, value: project.id, project})
    const extensionToOption = e => ({value: e, label: toSentenceCase(e.replace('_', ' '))})
    const USAGE_TIERS = [{
      label: getMessage(messages, 'usageTier.low'),
      value: 'LOW'
    }, {
      label: getMessage(messages, 'usageTier.medium'),
      value: 'MEDIUM'
    }, {
      label: getMessage(messages, 'usageTier.high'),
      value: 'HIGH'
    }]
    return (
      <Row>
        <Col xs={12}>
          <h4>{getMessage(messages, 'orgDetails')}</h4>
          {orgFields.map((f, index) => (
            <FormGroup key={index}>
              <ControlLabel>{getMessage(messages, `${f}.label`)}</ControlLabel>
              <FormControl
                type='text'
                name={f}
                value={this.state[f] || ''}
                placeholder={getMessage(messages, `${f}.placeholder`)}
                onChange={this.handleChange} />
            </FormGroup>
          ))}
          <FormGroup>
            <ControlLabel>{getMessage(messages, 'projects')}</ControlLabel>
            <Select
              multi
              options={projects
                .filter(p => p.organizationId === null || (organization && p.organizationId === organization.id))
                .map(projectToOption)}
              value={this.state.projects && this.state.projects.map(projectToOption)}
              onChange={this._onChangeProjects} />
          </FormGroup>
          <h4>{getMessage(messages, 'subDetails')}</h4>
          <FormGroup>
            <ControlLabel style={{marginRight: '5px'}}>Usage tier</ControlLabel>
            {USAGE_TIERS.map((tier, index) => (
              <Radio
                checked={this.state.usageTier === tier.value}
                key={index}
                name='usageTier'
                onChange={this.handleChange}
                value={tier.value}
                inline>{tier.label}</Radio>
            ))}
          </FormGroup>
          <Row>
            <Col xs={6}>
              <FormGroup>
                <ControlLabel>{getMessage(messages, 'subscriptionBeginDate')}</ControlLabel>
                <DateTimeField
                  name='subscriptionBeginDate'
                  mode='date'
                  dateTime={this.state.subscriptionBeginDate}
                  onChange={this.handleDateChange('subscriptionBeginDate')} />
              </FormGroup>
            </Col>
            <Col xs={6}>
              <FormGroup>
                <ControlLabel>{getMessage(messages, 'subscriptionEndDate')}</ControlLabel>
                <DateTimeField
                  name='subscriptionEndDate'
                  mode='date'
                  dateTime={this.state.subscriptionEndDate}
                  onChange={this.handleDateChange('subscriptionEndDate')} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <FormGroup>
                <ControlLabel>{getMessage(messages, 'extensions')}</ControlLabel>
                <Select
                  multi
                  options={extensions.map(extensionToOption)}
                  value={this.state.extensions && this.state.extensions.map(extensionToOption)}
                  onChange={this._onChangeExtensions} />
              </FormGroup>
            </Col>
          </Row>
        </Col>
      </Row>
    )
  }
}
