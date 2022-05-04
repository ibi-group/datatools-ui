// @flow

import React, {Component} from 'react'
import {FormControl} from 'react-bootstrap'

import EditableTextField from '../../common/components/EditableTextField'
import {getRouteName} from '../../editor/util/gtfs'
import GtfsSearch from '../../gtfs/components/gtfs-search'
import type {GtfsSpecField as GtfsPlusFieldType, GtfsRoute, GtfsStop} from '../../types'

import type {Props as GtfsPlusTableProps} from './GtfsPlusTable'

type Props = GtfsPlusTableProps & {
  currentValue: any,
  data: any,
  field: GtfsPlusFieldType,
  row: number
}
export default class GtfsPlusField extends Component<Props> {
  _onChangeRoute = ({route}: {route: GtfsRoute}) => {
    const {field, receiveGtfsEntities, row: rowIndex, table, updateGtfsPlusField} = this.props
    // Simulate the GraphQL response.
    receiveGtfsEntities({feed: {routes: [route]}})
    updateGtfsPlusField({tableId: table.id, rowIndex, fieldName: field.name, newValue: route.route_id})
  }

  _onChangeStop = ({stop}: {stop: GtfsStop}) => {
    const {field, receiveGtfsEntities, row: rowIndex, table, updateGtfsPlusField} = this.props
    // Simulate the GraphQL response.
    receiveGtfsEntities({feed: {stops: [stop]}})
    updateGtfsPlusField({tableId: table.id, rowIndex, fieldName: field.name, newValue: stop.stop_id})
  }

  _onChangeValue = (newValue: any) => {
    const {field, row: rowIndex, table, updateGtfsPlusField} = this.props
    updateGtfsPlusField({tableId: table.id, rowIndex, fieldName: field.name, newValue})
  }

  _onChange = ({target}: SyntheticInputEvent<HTMLInputElement>) => {
    const {field, row: rowIndex, table, updateGtfsPlusField} = this.props
    updateGtfsPlusField({tableId: table.id, rowIndex, fieldName: field.name, newValue: target.value})
  }

  render () {
    const {currentValue, data: rowData, feedVersionSummary, field, getGtfsEntity} = this.props
    const namespace = feedVersionSummary && feedVersionSummary.namespace
    switch (field.inputType) {
      case 'TEXT':
      case 'GTFS_TRIP':
      case 'GTFS_FARE':
      case 'GTFS_SERVICE':
      case 'GTFS_ZONE':
        return (
          <EditableTextField
            value={currentValue}
            onChange={this._onChangeValue} />
        )
      case 'DROPDOWN':
        const {options} = field
        if (!options) {
          console.warn(`GTFS+ field has no options defined.`, field)
          return null
        }

        // NOTE: client has requested that GTFS+ fields be case insensitive
        // (hence the toUpperCase call)
        const option = currentValue &&
          options.find(o => o.value.toUpperCase() === currentValue.toUpperCase())

        const filteredOptions = field.parent
          ? options.filter(
            option => option.parentValue
              ? option.parentValue === rowData[field.parent]
              : true
          )
          : options

        return (
          <FormControl componentClass='select'
            value={option ? option.value : ''}
            onChange={this._onChange}>
            {/* Add field for empty string value if that is not an allowable option so that user selection triggers onChange */}
            {filteredOptions.findIndex(option => option.value === '') === -1
              ? <option
                disabled
                value=''>
                {field.required ? '-- select an option --' : '(optional)' }
              </option>
              : null
            }
            {filteredOptions.map(option => {
              // NOTE: client has requested that GTFS+ fields be case
              // insensitive (hence the toLowerCase call)
              return <option value={option.value} key={option.value}>
                {option.text || option.value}
              </option>
            })}
          </FormControl>
        )
      case 'GTFS_ROUTE':
        const routeEntity = ((getGtfsEntity('route', currentValue): any): GtfsRoute)
        const routeValue = routeEntity
          ? {
            value: routeEntity.route_id,
            label: getRouteName(routeEntity)
          }
          : null

        return (
          <GtfsSearch
            feeds={[]}
            namespace={namespace}
            limit={100}
            entities={['routes']}
            minimumInput={1}
            clearable={false}
            onChange={this._onChangeRoute}
            value={routeValue} />
        )
      case 'GTFS_STOP':
        const stopEntity = ((getGtfsEntity('stop', currentValue): any): GtfsStop)
        const stopValue = stopEntity
          ? {value: stopEntity.stop_id, label: stopEntity.stop_name}
          : null
        return (
          <GtfsSearch
            feeds={[]}
            namespace={namespace}
            limit={100}
            entities={['stops']}
            clearable={false}
            minimumInput={1}
            onChange={this._onChangeStop}
            value={stopValue} />
        )
    }
    return null
  }
}
