import React, {Component, PropTypes} from 'react'
import Select from 'react-select'

import VirtualizedEntitySelect from './VirtualizedEntitySelect'
import { getEntityName } from '../util/gtfs'
import ZoneSelect from './ZoneSelect'

export default class FareRuleSelections extends Component {
  static propTypes = {
    rule: PropTypes.object,
    tableData: PropTypes.object,
    activeEntity: PropTypes.object,
    activeComponent: PropTypes.string,
    zones: PropTypes.object,
    zoneOptions: PropTypes.array,
    routeEntity: PropTypes.object,
    updateActiveEntity: PropTypes.func
  }

  _onContainsChange = (input) => {
    const {activeComponent, activeEntity, rule, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    rule.contains_id = input ? input.value : null
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  _onDestinationChange = (input) => {
    const {activeComponent, activeEntity, rule, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    rule.destination_id = input ? input.value : null
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  _onOriginChange = (input) => {
    const {activeComponent, activeEntity, rule, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    rule.origin_id = input ? input.value : null
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  _onRouteChange = (input) => {
    const {activeComponent, activeEntity, rule, updateActiveEntity} = this.props
    const rules = [...activeEntity.fareRules]
    rule.route_id = input ? input.value : null
    updateActiveEntity(activeEntity, activeComponent, {fareRules: rules})
  }

  render () {
    const {rule, tableData, zones, zoneOptions, routeEntity} = this.props
    return (
      <div>
        {rule.route_id
          ? <VirtualizedEntitySelect
            value={routeEntity ? {value: routeEntity.route_id, label: getEntityName(routeEntity), entity: routeEntity} : null}
            component={'route'}
            entityKey='route_id'
            entities={tableData.route}
            onChange={this._onRouteChange} />
          : null
        }
        {rule.contains_id // can be boolean (no zone specified) or string (specified zone_id)
          ? <ZoneSelect
            placeholder='Select zone which the itinerary passes through...'
            noResultsText={`No zones found. Specify zones in stop.`}
            key={Math.random()}
            value={typeof rule.contains_id === 'string'
              ? {value: rule.contains_id, label: `${rule.contains_id} zone (${zones[rule.contains_id] ? zones[rule.contains_id].length : 0} stops)`}
              : null
            }
            onChange={this._onContainsChange}
            options={zoneOptions} />
          : null
        }
        {rule.origin_id || rule.destination_id
          ? [
            <ZoneSelect
              placeholder='Select origin zone...'
              noResultsText={`No zones found. Specify zones in stop.`}
              key={Math.random()}
              value={typeof rule.origin_id === 'string'
                ? {
                  value: rule.origin_id,
                  label: `${rule.origin_id} zone (${zones[rule.origin_id] ? zones[rule.origin_id].length : 0} stops)`
                }
                : null
              }
              onChange={this._onOriginChange}
              options={zoneOptions} />,
            <Select
              placeholder='Select destination zone...'
              clearable
              noResultsText={`No zones found. Specify zones in stop.`}
              key={Math.random()}
              value={typeof rule.destination_id === 'string'
                ? {
                  value: rule.destination_id,
                  label: `${rule.destination_id} zone (${zones[rule.destination_id] ? zones[rule.destination_id].length : 0} stops)`
                }
                : null
              }
              onChange={this._onDestinationChange}
              options={zoneOptions} />
          ]
          : null
        }
      </div>
    )
  }
}
