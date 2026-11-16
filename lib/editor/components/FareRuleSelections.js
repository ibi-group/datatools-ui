// @flow

import React, {Component} from 'react'
import Select from 'react-select'

import {getEntityName, getTableById} from '../util/gtfs'
import {updateActiveGtfsEntity} from '../actions/active'
import type {GtfsFare, GtfsRoute, ZoneOption, Zones, FareRule} from '../../types'
import type {EditorTables} from '../../types/reducers'

import VirtualizedEntitySelect from './VirtualizedEntitySelect'
import type {EntityOption} from './VirtualizedEntitySelect'

type EditableRuleFields = $Keys<$Diff<FareRule, {fare_id: string, id: number}>>

type Props = {
  activeComponent: string,
  activeEntity: GtfsFare,
  index: number,
  routeEntity: ?GtfsRoute,
  showContainsId: boolean,
  showDestinationId: boolean,
  showOriginId: boolean,
  showRouteId: boolean,
  tableData: EditorTables,
  updateActiveGtfsEntity: typeof updateActiveGtfsEntity,
  zoneOptions: Array<ZoneOption>,
  zones: Zones
}

const toZoneOption = (zoneId: ?string, zones: Zones) => (typeof zoneId === 'string'
  ? {
    value: zoneId,
    label: `${zoneId} zone (${zones[zoneId] ? zones[zoneId].length : 0} stops)`
  }
  : null
)

export default class FareRuleSelections extends Component<Props> {
  _updateFareRule = (input: ?(ZoneOption | EntityOption), field: EditableRuleFields) => {
    const {activeComponent, activeEntity, index, updateActiveGtfsEntity} = this.props
    const rules = [...activeEntity.fare_rules]
    rules[index][field] = input ? input.value : null
    updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {fare_rules: rules}
    })
  }

  _onChangeContains = (input: ?ZoneOption) => this._updateFareRule(input, 'contains_id')

  _onChangeDestination = (input: ?ZoneOption) => this._updateFareRule(input, 'destination_id')

  _onChangeOrigin = (input: ?ZoneOption) => this._updateFareRule(input, 'origin_id')

  _onChangeRoute = (input: ?EntityOption) => this._updateFareRule(input, 'route_id')

  render () {
    const {
      activeEntity,
      index,
      showRouteId,
      showContainsId,
      showOriginId,
      showDestinationId,
      tableData,
      zones,
      zoneOptions,
      routeEntity} = this.props
    const rule = activeEntity.fare_rules[index]
    const uniqueId = `${activeEntity.id}-${rule.id}`
    return (
      <div data-test-id='fare-rule-selections'>
        {showRouteId &&
          <VirtualizedEntitySelect
            value={routeEntity
              ? {
                value: routeEntity.route_id,
                label: getEntityName(routeEntity),
                entity: routeEntity
              }
              : null}
            component={'route'}
            entityKey='route_id'
            key={`${uniqueId}-route`}
            entities={getTableById(tableData, 'route')}
            onChange={this._onChangeRoute} />
        }
        {showContainsId &&
          <Select
            onChange={this._onChangeContains}
            options={zoneOptions}
            noResultsText={`No zones found. Specify zones in stop.`}
            placeholder='Select zone which the itinerary passes through...'
            value={toZoneOption(rule.contains_id, zones)} />
        }
        {showOriginId &&
          <Select
            onChange={this._onChangeOrigin}
            options={zoneOptions}
            noResultsText={`No zones found. Specify zones in stop.`}
            placeholder='Select origin zone...'
            value={toZoneOption(rule.origin_id, zones)} />
        }
        {showDestinationId &&
          <Select
            onChange={this._onChangeDestination}
            options={zoneOptions}
            noResultsText={`No zones found. Specify zones in stop.`}
            placeholder='Select destination zone...'
            value={toZoneOption(rule.destination_id, zones)} />
        }
      </div>
    )
  }
}
