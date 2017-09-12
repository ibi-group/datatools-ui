import React, {Component, PropTypes} from 'react'
import {Checkbox, FormControl, FormGroup, ControlLabel, Tooltip, OverlayTrigger} from 'react-bootstrap'
import Select from 'react-select'
import moment from 'moment'
import DateTimeField from 'react-bootstrap-datetimepicker'
import Dropzone from 'react-dropzone'

import ColorField from './ColorField'
import {getEntityName} from '../util/gtfs'
import {FIELD_PROPS} from '../util/types'
import {doesNotExist} from '../util/validation'
import VirtualizedEntitySelect from './VirtualizedEntitySelect'
import TimezoneSelect from '../../common/components/TimezoneSelect'
import LanguageSelect from '../../common/components/LanguageSelect'
import toSentenceCase from '../../common/util/to-sentence-case'
import ZoneSelect from './ZoneSelect'

export default class EditorInput extends Component {
  static propTypes = {
    activeEntity: PropTypes.object,
    updateActiveEntity: PropTypes.func,
    activeComponent: PropTypes.string,
    uploadBrandingAsset: PropTypes.func,
    feedSource: PropTypes.object,
    tableData: PropTypes.object,
    field: PropTypes.object,
    approveGtfsDisabled: PropTypes.bool,
    zoneOptions: PropTypes.array,
    table: PropTypes.object,
    hasRoutes: PropTypes.bool
  }

  _onColorChange = (color) => {
    const {updateActiveEntity, activeEntity, activeComponent, field} = this.props
    updateActiveEntity(activeEntity, activeComponent, {[field.name]: color.hex.split('#')[1]})
  }

  _onDateChange = (millis) => {
    const {updateActiveEntity, activeEntity, activeComponent, field} = this.props
    updateActiveEntity(activeEntity, activeComponent, {[field.name]: moment(+millis).format('YYYYMMDD')})
  }

  _onDowChange = (evt) => {
    const {updateActiveEntity, activeEntity, activeComponent, field} = this.props
    updateActiveEntity(activeEntity, activeComponent, {[field.name]: evt.target.checked ? 1 : 0})
  }

  _onInputChange = (evt) => {
    const {updateActiveEntity, activeEntity, activeComponent, field} = this.props
    updateActiveEntity(activeEntity, activeComponent, {[field.name]: evt.target.value})
  }

  _onSelectChange = (option) => {
    const {updateActiveEntity, activeEntity, activeComponent, field} = this.props
    updateActiveEntity(activeEntity, activeComponent, {[field.name]: option ? option.value : null})
  }

  _uploadBranding = (files) => {
    const {uploadBrandingAsset, feedSource, activeEntity, activeComponent} = this.props
    uploadBrandingAsset(feedSource.id, activeEntity.id, activeComponent, files[0])
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
    const formProps = {
      controlId: `${editorField}`,
      className: `col-xs-${field.columnWidth}`
    }
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
        ? <OverlayTrigger placement='right' overlay={<Tooltip id='tooltip'>{field.helpContent}</Tooltip>}>
          <ControlLabel><small>{editorField}{field.required ? ' *' : ''}</small></ControlLabel>
        </OverlayTrigger>
        : <ControlLabel><small>{editorField}{field.required ? ' *' : ''}</small></ControlLabel>
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
      case 'GTFS_SERVICE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <FormControl {...fieldProps} />
          </FormGroup>
        )
      case 'URL':
        const elements = [
          <FormGroup {...formProps} key={`${editorField}-input`}>
            {basicLabel}
            <FormControl {...fieldProps} />
          </FormGroup>
        ]
        if (field.name === 'agency_branding_url' || field.name === 'route_branding_url') {
          elements.push(
            <FormGroup
              className='col-xs-12'
              key={`${editorField}-upload`}>
              <ControlLabel>Upload {activeComponent} branding asset</ControlLabel>
              <Dropzone
                accept='image/*'
                multiple={false}
                onDrop={this._uploadBranding}>
                <div style={{marginBottom: '10px'}}>Drop {activeComponent} image here, or click to select image to upload.</div>
                {activeEntity && activeEntity[field.name]
                  ? <img
                    alt='agency branding'
                    className='img-responsive'
                    src={activeEntity[field.name]} />
                  : null
                }
              </Dropzone>
            </FormGroup>
          )
        }
        return <span>{elements}</span>
      case 'GTFS_ZONE':
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <ZoneSelect
              addCreateOption
              onChange={this._onSelectChange}
              value={currentValue}
              zoneOptions={zoneOptions} />
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
        const dateTimeProps = {
          mode: 'date',
          dateTime: currentValue ? +moment(currentValue) : defaultValue,
          onChange: this._onDateChange
        }
        if (!currentValue) {
          dateTimeProps.defaultText = 'Please select a date'
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
                ? <div className='col-xs-12'><ControlLabel>Days of service</ControlLabel></div>
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
        return (
          <FormGroup
            {...formProps}
            className={field.columnWidth ? `col-xs-${field.columnWidth}` : 'col-xs-12'}>
            {basicLabel}
            <FormControl
              {...fieldProps}
              value={!doesNotExist(value) ? value : ''} // set value to '' to allow for selection of disabled option
              disabled={approveGtfsDisabled && field.adminOnly}>
              {/* Add field for empty string value if that is not an allowable option so that user selection triggers onChange */}
              {field.options.findIndex(option => option.value === '') === -1
                ? <option disabled value=''>{field.required ? '-- select an option --' : '(optional)' }</option>
                : null
              }
              {field.options.map(o => (<option value={o.value} key={o.value}>{o.text || o.value}</option>))}
            </FormControl>
          </FormGroup>
        )
      case 'GTFS_ROUTE':
        const route = tableData.route.find(s => s.id === currentValue)
        return (
          <VirtualizedEntitySelect
            value={route ? {value: route.id, label: getEntityName(activeComponent, route), entity: route} : null}
            component={'route'}
            entities={tableData.route}
            onChange={this._onSelectChange} />
        )
      case 'GTFS_AGENCY':
        const agency = tableData.agency && tableData.agency.find(a => a.id === currentValue)
        const agencies = tableData.agency || []
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <Select
              placeholder='Select agency...'
              clearable
              value={agency ? {value: currentValue, label: agency.agency_name} : {value: currentValue}}
              onChange={this._onSelectChange}
              options={agencies.map(agency => ({
                value: agency.id,
                label: agency.agency_name,
                agency
              }))} />
          </FormGroup>
        )
      case 'GTFS_STOP':
        const stopIndex = tableData.stop && tableData.stop.findIndex(s => s.id === activeEntity.id)
        const stop = tableData.stop.find(s => s.id === currentValue)
        const stops = [...tableData.stop]
        // remove current entity from list of stops
        // (because this is only used for parent_station selection and we can't make the self the parent)
        if (stopIndex !== -1) {
          stops.splice(stopIndex, 1)
        }
        return (
          <FormGroup {...formProps}>
            {basicLabel}
            <VirtualizedEntitySelect
              value={stop ? {value: stop.id, label: getEntityName(activeComponent, stop), entity: stop} : null}
              component={'stop'}
              entities={stops}
              onChange={this._onSelectChange} />
          </FormGroup>
        )
      default:
        return null
    }
  }
}
