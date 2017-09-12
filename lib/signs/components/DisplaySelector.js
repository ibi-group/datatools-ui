import React, {Component, PropTypes} from 'react'
import fetch from 'isomorphic-fetch'
import { Glyphicon, Label } from 'react-bootstrap'
import { shallowEqual } from 'react-pure-render'
import Select from 'react-select'

import { getDisplaysUrl } from '../../common/util/modules'

export default class DisplaySelector extends Component {
  static propTypes = {
    sign: PropTypes.object
  }

  state = {
    value: this.props.value
  }

  cacheOptions (options) {
    options.forEach(o => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
    }
  }

  _loadOptions = (input) => {
    const url = getDisplaysUrl()
    return fetch(url)
      .then(res => res.json())
      .then((displays) => {
        const options = displays !== null && displays.length > 0
          ? displays.map(display => (
            {display, value: display.Id, label: display.DisplayTitle, location: display.LocationDescription}
          ))
          : []
        return { options }
      })
      .catch((error) => {
        console.log(error)
        return []
      })
  }

  _onChange = (value) => {
    console.log('new value', value)
    if (value.length && value[value.length - 1] && value[value.length - 1].create === true) {
      console.log('creating display!!!')
      this.props.createDisplay(value[value.length - 1].value)
      return
    }
    this.setState({value})
    this.props.onChange(value)
  }

  _onFocus = (input) => {
    // clear options to onFocus to ensure only valid route/stop combinations are selected
    this.refs.displaySelect.loadOptions('')
  }

  _renderOption = (option) => {
    const combinedLabel = this.getDisplayStatusLabel(option.display)
    return <span style={{ color: 'black' }}><Glyphicon glyph='modal-window' /> <strong>{option.label}</strong> {option.location} {combinedLabel} {option.link}</span>
  }

  _renderValue = (option) => {
    const combinedLabel = this.getDisplayStatusLabel(option.display)
    return <span>{option.label} {combinedLabel}</span>
  }

  getDisplayStatusLabel = (display) => {
    if (!display) return ''
    const displayDraftId = display.DraftDisplayConfigurationId
    const displayPublishedId = display.PublishedDisplayConfigurationId

    const label = displayPublishedId !== this.props.sign.id && displayPublishedId > 0 && displayDraftId === this.props.sign.id
      ? <span><Label bsStyle='warning'>Assigned here</Label><Label bsStyle='danger'>Published to {displayPublishedId}</Label></span>
      : displayPublishedId !== this.props.sign.id && displayPublishedId > 0
      ? <Label bsStyle='danger'>Published to {displayPublishedId}</Label>
      : displayPublishedId !== null && displayDraftId !== null
      ? <span><Label bsStyle='success'>Published</Label><Label bsStyle='warning'>Assigned to {displayDraftId}</Label></span>
      : displayDraftId === null
      ? <Label>Unassigned</Label>
      : displayDraftId !== this.props.sign.id && displayDraftId > 0
      ? <Label bsStyle='danger'>Assigned to {displayDraftId}</Label>
      : <Label bsStyle='warning'>Unpublished</Label>
    return label
  }

  handleValueClick = (val) => {
    // Toggle value of draft/published config ID
    const pubId = val.display.PublishedDisplayConfigurationId
    const draftId = val.display.DraftDisplayConfigurationId

    // allow publishing or unpublishing to display if sign config is published AND display isn't assigned elsewhere
    if (this.props.sign.published && (pubId === null || pubId === this.props.sign.id)) {
      const newPubId = pubId
        ? null
        : this.props.sign.id
      this.props.toggleConfigForDisplay(val.display, 'PUBLISHED', newPubId)
    } else if (pubId === this.props.sign.id) {
      // else already published to this config (but config not published), you can set it to null
      this.props.toggleConfigForDisplay(val.display, 'PUBLISHED', null)
    } else {
      // if config is draft, you can toggle draftId
      const newDraftId = draftId
        ? null
        : this.props.sign.id
      this.props.toggleConfigForDisplay(val.display, 'DRAFT', newDraftId)
    }
  }

  filterOptions = (options, filter, values) => {
    // Filter already selected values
    const valueKeys = values.map(i => i.value)
    let filteredOptions = options.filter(option => {
      return valueKeys.indexOf(option.value) === -1
    })
    // Filter by label
    if (filter !== undefined && filter != null && filter.length > 0) {
      filteredOptions = filteredOptions.filter(option => {
        return RegExp(filter, 'ig').test(option.label)
      })
    }
    // Append Addition option
    if (filteredOptions.length === 0) {
      filteredOptions.push({
        label: <span><strong>Create display</strong>: {filter}</span>,
        value: filter,
        create: true
      })
    }
    return filteredOptions
  }

  render () {
    const {
      sign,
      minimumInput,
      clearable,
      placeholder
    } = this.props
    if (!sign) {
      return ''
    }
    return (
      <Select.Async
        ref='displaySelect'
        style={{marginBottom: '15px'}}
        cache={false}
        onFocus={this._onFocus}
        multi
        onValueClick={this.handleValueClick}
        allowCreate // currently not working in v 1.0.0
        filterOptions={this.filterOptions}
        minimumInput={minimumInput !== null ? minimumInput : 1}
        clearable={clearable}
        placeholder={placeholder || ''}
        loadOptions={this._loadOptions}
        value={this.state.value}
        optionRenderer={this._renderOption}
        valueRenderer={this._renderValue}
        onChange={this._onChange} />
    )
  }
}
