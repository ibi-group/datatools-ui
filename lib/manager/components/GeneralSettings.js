import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import DateTimeField from 'react-bootstrap-datetimepicker'
import update from 'react-addons-update'
import { shallowEqual } from 'react-pure-render'
import { browserHistory } from 'react-router'
import moment from 'moment'
import { Row, Col, Button, Panel, Glyphicon, Checkbox, FormGroup, InputGroup, ControlLabel, FormControl, ListGroup, ListGroupItem } from 'react-bootstrap'

import MapModal from '../../common/components/MapModal.js'
import ConfirmModal from '../../common/components/ConfirmModal'
import { getMessage, getComponentMessages } from '../../common/util/config'
import TimezoneSelect from '../../common/components/TimezoneSelect'
import LanguageSelect from '../../common/components/LanguageSelect'

const DEFAULT_FETCH_TIME = moment().startOf('day').add(2, 'hours')

export default class GeneralSettings extends Component {
  state = {
    general: {}
  }

  componentWillReceiveProps (nextProps) {
    this.setState({general: {}})
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !shallowEqual(nextProps, this.props) || !shallowEqual(nextState, this.state)
  }

  _onDeleteProject = () => {
    const {deleteProject, project} = this.props
    const messages = getComponentMessages('ProjectSettings')
    this.refs.confirm.open({
      title: getMessage(messages, 'deleteProject'),
      body: getMessage(messages, 'confirmDelete'),
      onConfirm: () => {
        deleteProject(project)
        .then(() => browserHistory.push(`/home`))
      }
    })
  }

  _onChangeAutoFetch = evt => {
    const autoFetchMinute = DEFAULT_FETCH_TIME.minutes()
    const autoFetchHour = DEFAULT_FETCH_TIME.hours()
    this.setState(update(this.state, { general: { $merge: { autoFetchFeeds: evt.target.checked, autoFetchMinute, autoFetchHour } } }))
  }

  _onChangeBounds = evt => {
    const bBox = evt.target.value.split(',')
    if (bBox.length === 4) {
      const [west, south, east, north] = bBox
      this.setState(update(this.state, { general: { $merge: {west, south, east, north} } }))
    }
  }

  _onChangeDateTime = seconds => {
    const time = moment(+seconds)
    this.setState(update(this.state, { general: { $merge: { autoFetchMinute: time.minutes(), autoFetchHour: time.hours() } } }))
  }

  _onChangeLocation = (evt) => {
    const latLng = evt.target.value.split(',')
    if (typeof latLng[0] !== 'undefined' && typeof latLng[1] !== 'undefined') {
      const [defaultLocationLat, defaultLocationLon] = latLng
      this.setState(update(this.state, { general: { $merge: {defaultLocationLat, defaultLocationLon} } }))
    } else {
      console.log('invalid value for latlng')
    }
  }

  _onChangeLanguage = ({value: defaultLanguage}) => {
    this.setState(update(this.state, { general: { $merge: { defaultLanguage } } }))
  }

  _onChangeTimeZone = ({value: defaultTimeZone}) => {
    this.setState(update(this.state, { general: { $merge: { defaultTimeZone } } }))
  }

  _onChangeValue = ({target}) => this.setState({[target.name]: target.value})

  _onOpenMapBoundsModal = () => {
    const {project} = this.props.project
    const bounds = project.north !== null
      ? [[project.south, project.west], [project.north, project.east]]
      : null
    this.refs.mapModal.open({
      title: 'Select project bounds',
      body: `Pretend this is a map`,
      bounds: bounds,
      rectangleSelect: true,
      onConfirm: (rectangle) => {
        if (rectangle && rectangle.getBounds()) {
          const [[south, west], [north, east]] = rectangle.getBounds().map(arr => arr.map(v => v.toFixed(6)))
          ReactDOM.findDOMNode(this.refs.boundingBox).value = `${west},${south},${east},${north}`
          this.setState(update(this.state, { general: { $merge: {west, south, east, north} } }))
        }
        return rectangle
      }
    })
  }

  _onOpenMapModal = () => {
    const {defaultLocationLat, defaultLocationLon} = this.props.project
    const bounds = defaultLocationLat !== null && defaultLocationLon !== null
      ? [[defaultLocationLat + 1, defaultLocationLon + 1], [defaultLocationLat - 1, defaultLocationLon - 1]]
      : null
    this.refs.mapModal.open({
      title: 'Select a default location',
      body: `Pretend this is a map`,
      markerSelect: true,
      marker: defaultLocationLat && defaultLocationLon
        ? {lat: defaultLocationLat, lng: defaultLocationLon}
        : null,
      bounds: bounds,
      onConfirm: (marker) => {
        if (marker) {
          const defaultLocationLat = marker.lat.toFixed(6)
          const defaultLocationLon = marker.lng.toFixed(6)
          // ReactDOM.findDOMNode(this.refs.defaultLocation).value = `${defaultLocationLat},${defaultLocationLon}`
          this.setState(update(this.state, { general: { $merge: {defaultLocationLat, defaultLocationLon} } }))
        }
      }
    })
  }

  _onSaveSettings = () => {
    this.props.updateProjectSettings(this.props.project, this.state.general)
  }

  _onUpdateName = () => {
    const {name} = this.state
    this.props.updateProjectSettings(this.props.project, {name})
    .then(() => this.setState({name: undefined}))
  }

  render () {
    const messages = getComponentMessages('ProjectSettings')
    const {project, editDisabled} = this.props
    const noEdits = Object.keys(this.state.general).length === 0 && this.state.general.constructor === Object
    const autoFetchChecked = typeof this.state.general.autoFetchFeeds !== 'undefined' ? this.state.general.autoFetchFeeds : project.autoFetchFeeds
    if (editDisabled) {
      return <p className='lead text-center'><strong>Warning!</strong> You do not have permission to edit details for this feed source.</p>
    }
    return (
      <div className='general-settings-panel'>
        <ConfirmModal ref='confirm' />
        <Panel header={<h4>{getMessage(messages, 'title')}</h4>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel>{getMessage(messages, 'general.name')}</ControlLabel>
                <InputGroup>
                  <FormControl
                    value={typeof this.state.name !== 'undefined'// && this.state.name !== null
                      ? this.state.name
                      : project.name
                    }
                    name={'name'}
                    onChange={this._onChangeValue} />
                  <InputGroup.Button>
                    <Button
                      disabled={!this.state.name || this.state.name === project.name}
                      onClick={this._onUpdateName}
                      >{getMessage(messages, 'rename')}</Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel header={<h4>{getMessage(messages, 'general.updates.title')}</h4>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <Checkbox
                  checked={autoFetchChecked}
                  onChange={this._onChangeAutoFetch}>
                  <strong>{getMessage(messages, 'general.updates.autoFetchFeeds')}</strong>
                </Checkbox>
                {autoFetchChecked
                  ? <DateTimeField
                    dateTime={project.autoFetchMinute !== null
                      ? +moment().startOf('day').add(project.autoFetchHour, 'hours').add(project.autoFetchMinute, 'minutes')
                      : DEFAULT_FETCH_TIME
                    }
                    mode='time'
                    onChange={this._onChangeDateTime} />
                  : null
                }
              </FormGroup>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel header={<h4>{getMessage(messages, 'general.location.title')}</h4>}>
          <ListGroup fill>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel><Glyphicon glyph='map-marker' /> {getMessage(messages, 'general.location.defaultLocation')}</ControlLabel>
                <InputGroup ref='defaultLocationGroup'>
                  <FormControl
                    type='text'
                    value={this.state.general.defaultLocationLat && this.state.general.defaultLocationLon
                      ? `${this.state.general.defaultLocationLat},${this.state.general.defaultLocationLon}`
                      : project.defaultLocationLat && project.defaultLocationLon
                      ? `${project.defaultLocationLat},${project.defaultLocationLon}`
                      : ''
                    }
                    ref='defaultLocation'
                    placeholder='34.8977,-87.29987'
                    onChange={this._onChangeLocation} />
                  <InputGroup.Button>
                    <Button
                      onClick={this._onOpenMapModal}>
                      <Glyphicon glyph='map-marker' />
                    </Button>
                  </InputGroup.Button>
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <FormGroup>
                <ControlLabel><Glyphicon glyph='fullscreen' /> {getMessage(messages, 'general.location.boundingBox')}</ControlLabel>
                <InputGroup ref='boundingBoxGroup'>
                  <FormControl
                    type='text'
                    defaultValue={project.north !== null ? `${project.west},${project.south},${project.east},${project.north}` : ''}
                    ref='boundingBox'
                    placeholder='-88.45,33.22,-87.12,34.89'
                    onChange={this._onChangeBounds} />
                  {
                    <InputGroup.Button>
                      <Button
                        disabled // TODO: wait for react-leaflet-draw to update library to  re-enable bounds select
                        onClick={this._onOpenMapBoundsModal}>
                        <Glyphicon glyph='fullscreen' />
                      </Button>
                    </InputGroup.Button>
                  }
                </InputGroup>
              </FormGroup>
            </ListGroupItem>
            <ListGroupItem>
              <ControlLabel><Glyphicon glyph='time' /> {getMessage(messages, 'general.location.defaultTimeZone')}</ControlLabel>
              <TimezoneSelect
                value={this.state.general.defaultTimeZone || project.defaultTimeZone}
                onChange={this._onChangeTimeZone} />
            </ListGroupItem>
            <ListGroupItem>
              <ControlLabel><Glyphicon glyph='globe' /> {getMessage(messages, 'general.location.defaultLanguage')}</ControlLabel>
              <LanguageSelect
                value={this.state.general.defaultLanguage || project.defaultLanguage}
                onChange={this._onChangeLanguage} />
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Panel bsStyle='danger' header={<h3>Danger zone</h3>}>
          <ListGroup fill>
            <ListGroupItem>
              <Button
                onClick={this._onDeleteProject}
                className='pull-right'
                bsStyle='danger'>
                <Icon type='trash' /> Delete project
              </Button>
              <h4>Delete this project.</h4>
              <p>Once you delete an project, the project and all feed sources it contains cannot be recovered.</p>
            </ListGroupItem>
          </ListGroup>
        </Panel>
        <Row>
          <Col xs={12}>
            {/* Save button */}
            <Button
              bsStyle='primary'
              disabled={editDisabled || noEdits}
              onClick={this._onSaveSettings}>
              {getMessage(messages, 'save')}
            </Button>
          </Col>
        </Row>
        <MapModal ref='mapModal' />
      </div>
    )
  }
}
