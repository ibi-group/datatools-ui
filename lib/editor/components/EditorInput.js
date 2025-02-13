// @flow

import moment from 'moment'
import * as React from 'react'
import {Checkbox, FormControl, FormGroup, ControlLabel, Tooltip, OverlayTrigger} from 'react-bootstrap'
import DateTimeField from 'react-bootstrap-datetimepicker'
import Dropzone from 'react-dropzone'
import Select from 'react-select'

import * as activeActions from '../actions/active'
import * as editorActions from '../actions/editor'
import {getEntityName, getTableById} from '../util/gtfs'
import {FIELD_PROPS} from '../util/types'
import {doesNotExist} from '../util/validation'
import TimezoneSelect from '../../common/components/TimezoneSelect'
import LanguageSelect from '../../common/components/LanguageSelect'
import {getComponentMessages} from '../../common/util/config'
import toSentenceCase from '../../common/util/text'
import type {Entity, Feed, GtfsSpecField, GtfsAgency, GtfsStop} from '../../types'
import type {EditorTables} from '../../types/reducers'

import ColorField from './ColorField'
import RouteTypeSelect from './RouteTypeSelect'
import VirtualizedEntitySelect from './VirtualizedEntitySelect'
import ZoneSelect from './ZoneSelect'

type Props = {
  activeComponent: string,
  activeEntity?: Entity,
  approveGtfsDisabled: boolean,
  currentValue: any,
  feedSource?: Feed, // Optional, but needed for uploadBrandingAsset.
  field: GtfsSpecField,
  isNotValid: boolean,
  onChange?: any => void,
  tableData: EditorTables,
  updateActiveGtfsEntity?: typeof activeActions.updateActiveGtfsEntity,
  uploadBrandingAsset?: typeof editorActions.uploadBrandingAsset,
  zoneOptions: Array<any>
}

const agencyToOption = (agency: GtfsAgency) => ({
  value: agency.agency_id,
  label: agency.agency_name,
  agency
})

const entityToOption = (entity: ?Entity, key: string) => {
  return entity
    ? {
      value: entity[key],
      label: getEntityName(entity),
      entity
    }
    : null
}

export default class EditorInput extends React.Component<Props> {
  messages = getComponentMessages('EditorInput')
  /**
   * Helper method for processing field value changes.
   */
  _processFieldChange = (val: any) => {
    const {
      activeComponent,
      activeEntity,
      field,
      onChange,
      updateActiveGtfsEntity
    } = this.props
    onChange && onChange(val)
    updateActiveGtfsEntity && activeEntity && updateActiveGtfsEntity({
      component: activeComponent,
      entity: activeEntity,
      props: {[field.name]: val}
    })
  }

  _onColorChange = (color: any) => {
    this._processFieldChange(color.hex.split('#')[1])
  }

  _onDateChange = (millis: number) => {
    this._processFieldChange(moment(+millis).format('YYYYMMDD'))
  }

  _onDowChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this._processFieldChange(evt.target.checked ? 1 : 0)
  }

  _onInputChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this._processFieldChange(evt.target.value)
  }

  _onRouteTypeChange = (currentNode: any) => {
    this._processFieldChange(currentNode.value)
  }

  _onSelectChange = (option: any) => {
    this._processFieldChange(option ? option.value : null)
  }

  _uploadBranding = (files: Array<File>) => {
    const {uploadBrandingAsset, feedSource, activeEntity, activeComponent} = this.props
    if (feedSource && uploadBrandingAsset && activeEntity && activeEntity.id !== null) {
      uploadBrandingAsset(feedSource.id, activeEntity.id, activeComponent, files[0])
    } else {
      throw new Error('EditorInput needs feedSource and uploadBrandingAsset props (and valid entity id) defined in order to use this._uploadBranding private method.')
    }
  }

  render () {
    const {
      activeEntity,
      activeComponent,
      tableData,
      field,
      currentValue,
      approveGtfsDisabled,
      zoneOptions,
      isNotValid
    } = this.props
    const editorField = field.displayName || field.name
    const formProps = {}
    formProps.controlId = `${editorField}`
    formProps.className = `col-xs-${field.columnWidth}`
    if (isNotValid) {
      formProps.validationState = 'error'
    } else if (field.required) {
      formProps.validationState = 'success'
    }
    const fieldType = FIELD_PROPS.find(f => f.inputType === field.inputType) || {}
    const value = !doesNotExist(currentValue)
      ? currentValue
      : undefined
    const fieldProps = {
      value,
      placeholder: field.placeholder || '',
      onChange: this._onInputChange,
      ...fieldType.props
    }
    const basicLabel = field.helpContent
      ? <OverlayTrigger
        placement='right'
        overlay={<Tooltip id='tooltip'>{field.helpContent}</Tooltip>}>
        <ControlLabel>
          <small>{editorField}{field.required ? ' *' : ''}</small>
        </ControlLabel>
      </OverlayTrigger>
      : <ControlLabel>
        <small>{editorField}{field.required ? ' *' : ''}</small>
      </ControlLabel>
    switch (field.inputType) {
      case 'GTFS_ID':
      case 'TEXT':
      case 'TIME':
      case 'GTFS_TRIP':
      case 'EMAIL':
      case 'GTFS_SHAPE':
      case 'LATITUDE':
      case 'LONGITUDE':
      case 'NUMBER':
      case 'POSITIVE_INT':
      case 'POSITIVE_NUM':
      case 'GTFS_BLOCK':
      case 'GTFS_FARE':
      case 'GTFS_SERVICE': {
        // Ensure that an empty string is passed to value prop, so that on 'undo'
        // the input value will revert back to a blank field.
        const stringValue = typeof fieldProps.value === 'undefined'
          ? ''
          : fieldProps.value
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <FormControl {...fieldProps} value={stringValue} />
          </FormGroup>
        )
      }
      case 'URL': {
        // Ensure that an empty string is passed to value prop, so that on 'undo'
        // the input value will revert back to a blank field.
        const stringValue = typeof fieldProps.value === 'undefined'
          ? ''
          : fieldProps.value
        const elements = [
          <FormGroup {...formProps} key={`${editorField}-input`}>
            {basicLabel}
            <FormControl {...fieldProps} value={stringValue} />
          </FormGroup>
        ]
        if (field.name.indexOf('_branding_url') > -1) {
          const url: ?string = activeEntity && activeEntity[field.name]
          elements.push(
            <FormGroup
              className='col-xs-12'
              key={`${editorField}-upload`}>
              <ControlLabel>{this.messages('uploadAsset').replace('%activeComponent%', activeComponent)}</ControlLabel>
              <Dropzone
                accept='image/*'
                multiple={false}
                onDrop={this._uploadBranding}>
                <div style={{marginBottom: '10px'}}>{this.messages('dropImage').replace('%activeComponent%', activeComponent)}</div>
                {url
                  ? <img
                    alt={field.name}
                    className='img-responsive'
                    src={url} />
                  : null
                }
              </Dropzone>
            </FormGroup>
          )
        }
        return <span>{elements}</span>
      }
      case 'GTFS_ZONE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <ZoneSelect
              addCreateOption
              onChange={this._onSelectChange}
              value={currentValue}
              options={zoneOptions} />
          </FormGroup>
        )
      case 'TIMEZONE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <TimezoneSelect
              value={currentValue}
              clearable={!field.required}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      case 'LANGUAGE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <LanguageSelect
              value={currentValue}
              clearable={false}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      case 'DATE':
        const defaultValue = /end/.test(editorField)
          ? +moment().startOf('day').add(3, 'months')
          : +moment().startOf('day')
        const dateTimeProps = {}
        dateTimeProps.mode = 'date'
        dateTimeProps.dateTime = currentValue ? +moment(currentValue) : defaultValue
        dateTimeProps.onChange = this._onDateChange
        if (!currentValue) {
          dateTimeProps.defaultText = this.messages('selectDate')
        }
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <DateTimeField {...dateTimeProps} />
          </FormGroup>
        )
      case 'COLOR':
        return (
          <ColorField
            field={field}
            formProps={formProps}
            label={basicLabel}
            onChange={this._onColorChange}
            value={value} />
        )
      case 'DAY_OF_WEEK_BOOLEAN':
        return (
          <span>
            <span>
              {editorField === 'monday' // insert label for entire category on first checkbox
                ? <div className='col-xs-12'><ControlLabel>{this.messages('daysOfService')}</ControlLabel></div>
                : null
              }
            </span>
            <span className='col-xs-3'>
              <Checkbox
                inline
                checked={currentValue === 1}
                onChange={this._onDowChange}>
                <small>{toSentenceCase(editorField.substr(0, 3))}</small>
              </Checkbox>
            </span>
          </span>
        )
      case 'DROPDOWN':
        const options = field.options || []
        return (
          <FormGroup
            {...formProps}
            className={field.columnWidth ? `col-xs-${field.columnWidth}` : 'col-xs-12'}>
            {basicLabel}
            <FormControl
              {...fieldProps}
              disabled={approveGtfsDisabled && field.adminOnly}
              // set value to '' to allow for selection of disabled option
              value={!doesNotExist(value) ? value : ''}
            >
              {/* Add field for empty string value if that is not an allowable option so that user selection triggers onChange */}
              {options.findIndex(option => option.value === '') === -1 && (
                <option disabled value=''>
                  {field.required ? this.messages('selectOption') : this.messages('optional') }
                </option>
              )}
              {field.options && field.options.map(o => (
                <option value={o.value} key={o.value}>{o.text || o.value}</option>
              ))}
            </FormControl>
          </FormGroup>
        )
      case 'GTFS_ROUTE': {
        const routes = getTableById(tableData, 'route')
        const key = 'route_id'
        const route = routes.find(s => s[key] === currentValue)
        return (
          <VirtualizedEntitySelect
            value={entityToOption(route, key)}
            component={'route'}
            entityKey={key}
            entities={routes}
            onChange={this._onSelectChange} />
        )
      }
      case 'GTFS_ROUTE_TYPE': {
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <RouteTypeSelect
              field={field}
              onRouteTypeChange={this._onRouteTypeChange}
              routeType={parseInt(currentValue, 10)}
            />
          </FormGroup>
        )
      }
      case 'GTFS_AGENCY':
        const agencies = getTableById(tableData, 'agency')
        const agency = agencies.find(a => a.agency_id === currentValue)
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <Select
              placeholder={this.messages('selectAgency')}
              clearable
              value={agency
                ? agencyToOption(agency)
                : currentValue !== null
                  // Still display agency_id value for route if not null
                  ? {value: currentValue}
                  : null
              }
              onChange={this._onSelectChange}
              options={agencies.map(agencyToOption)} />
          </FormGroup>
        )
      case 'GTFS_STOP': {
        // Create copy of stops table (because of destructive splice operation
        // below).
        const stops: Array<GtfsStop> = [...getTableById(tableData, 'stop')]
        const key = 'stop_id'
        // Remove current entity from list of stops because this is only used
        // for parent_station selection and we can't make the self the parent).
        if (activeEntity) {
          const castedEntity = ((activeEntity: any): GtfsStop)
          const activeStopIndex = stops.findIndex(s => s[key] === castedEntity[key])
          if (activeStopIndex !== -1) {
            stops.splice(activeStopIndex, 1)
          }
        }
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <VirtualizedEntitySelect
              value={entityToOption(stops.find(s => s[key] === currentValue), key)}
              component={'stop'}
              entityKey={key}
              entities={stops}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      }
      default:
        return null
    }
  }
}
