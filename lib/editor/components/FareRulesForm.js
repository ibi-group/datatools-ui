import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Checkbox, Button, FormGroup, Panel } from 'react-bootstrap'

import FareRuleSelections from './FareRuleSelections'

const FARE_RULE_TYPES = [
  {type: 'route_id', label: 'Route'},
  {type: 'origin_id', label: 'From/to'},
  {type: 'contains_id', label: 'Contains'}
]

export default class FareRulesForm extends Component {
  static propTypes = {
    activeEntity: PropTypes.object,
    updateActiveEntity: PropTypes.func,
    activeComponent: PropTypes.string,
    tableData: PropTypes.object,
    zones: PropTypes.object,
    zoneOptions: PropTypes.array
  }

  _onClickAdd = () => {
    const {activeComponent, activeEntity, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    rules.unshift({fare_id: activeEntity.fare_id})
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  render () {
    const {activeEntity} = this.props
    return (
      <div>
        <p>Specify which routes or zones <strong>{activeEntity.fare_id}</strong> fare applies to.</p>
        <span className='pull-right'>{activeEntity && activeEntity.fareRules.length} rules apply to this fare</span>
        <Button
          style={{marginBottom: '15px'}}
          onClick={this._onClickAdd}>
          <Icon type='plus' /> Add rule
        </Button>
        {activeEntity.fareRules.map((rule, index) => (
          <FareRule
            rule={rule}
            key={index}
            index={index}
            {...this.props} />
        ))}
      </div>
    )
  }
}

class FareRule extends Component {
  _onClickRemoveRule = () => {
    const {activeComponent, activeEntity, index, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    rules.splice(index, 1)
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      index,
      rule,
      tableData,
      updateActiveEntity,
      zoneOptions,
      zones
    } = this.props
    let routeEntity
    if (rule.route_id) {
      routeEntity = tableData.route && tableData.route.find(r => r.route_id === rule.route_id)
    }
    return (
      <Panel key={`rule-${index}`}>
        <Button
          bsStyle='danger'
          bsSize='xsmall'
          className='pull-right'
          style={{marginLeft: '5px'}}
          onClick={this._onClickRemoveRule}>
          <Icon type='times' />
        </Button>
        <FormGroup>
          {FARE_RULE_TYPES.map((type, i) => (
            <FareRuleTypeCheckbox
              type={type}
              key={`${index}-${i}`}
              {...this.props} />
          ))}
        </FormGroup>
        <FareRuleSelections
          rule={rule}
          tableData={tableData}
          activeEntity={activeEntity}
          activeComponent={activeComponent}
          zones={zones}
          zoneOptions={zoneOptions}
          updateActiveEntity={updateActiveEntity}
          routeEntity={routeEntity} />
      </Panel>
    )
  }
}

class FareRuleTypeCheckbox extends Component {
  _onChangeCheckbox = (evt) => {
    const {activeComponent, activeEntity, index, type, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    if (type.type === 'origin_id') {
      rules[index].origin_id = rules[index].origin_id ? null : true
      rules[index].destination_id = rules[index].destination_id ? null : true
    } else {
      rules[index][type.type] = rules[index][type.type] ? null : true
    }
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  render () {
    const {index, rule, type} = this.props
    const checked = type.type === 'origin_id' ? rule.origin_id || rule.destination_id : rule[type.type]
    return (
      <Checkbox
        inline
        name={`fareRuleType-${index}-${type.type}`}
        checked={Boolean(checked)}
        onChange={this._onChangeCheckbox}>
        <small>{type.label}</small>
      </Checkbox>
    )
  }
}
