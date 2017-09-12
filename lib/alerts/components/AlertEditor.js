import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Grid, Row, Col, ButtonToolbar, Button, FormControl, ControlLabel, FormGroup} from 'react-bootstrap'
import DateTimeField from 'react-bootstrap-datetimepicker'
import Toggle from 'react-toggle'

import ManagerPage from '../../common/components/ManagerPage'
import Loading from '../../common/components/Loading'
import AffectedServices from './AffectedServices'
import GtfsMapSearch from '../../gtfs/components/gtfsmapsearch'
import GlobalGtfsFilter from '../../gtfs/containers/GlobalGtfsFilter'

import {checkEntitiesForFeeds} from '../../common/util/permissions'
import toSentenceCase from '../../common/util/to-sentence-case'
import {CAUSES, EFFECTS} from '../util'
import {browserHistory} from 'react-router'

import moment from 'moment'

const ALERT_TITLE_CHAR_LIMIT = 100
const ALERT_DESCRIPTION_CHAR_LIMIT = 1200
const CHAR_WARNING_LIMIT = 10

export default class AlertEditor extends Component {
  static propTypes= {
    activeFeeds: PropTypes.array,
    alert: PropTypes.object,
    causeChanged: PropTypes.func,
    descriptionChanged: PropTypes.func,
    editableFeeds: PropTypes.array,
    editorStopClick: PropTypes.func,
    editorRouteClick: PropTypes.func,
    effectChanged: PropTypes.func,
    endChanged: PropTypes.func,
    onDeleteClick: PropTypes.func,
    onPublishClick: PropTypes.func,
    publishableFeeds: PropTypes.array,
    startChanged: PropTypes.func,
    titleChanged: PropTypes.func,
    urlChanged: PropTypes.func
  }

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  validateAndSave = () => {
    const {alert, onSaveClick} = this.props
    const {affectedEntities, description, end, start, title} = alert

    // alert title must not be blank nor just whitespace
    if (!title.trim()) {
      return window.alert('You must specify an alert title')
    }
    // alert title/description must meet character limits (for display purposes)
    if (title.length > ALERT_TITLE_CHAR_LIMIT) {
      return window.alert(`Alert title must be ${ALERT_TITLE_CHAR_LIMIT} characters or less`)
    }
    if (description.length > ALERT_DESCRIPTION_CHAR_LIMIT) {
      return window.alert(`Alert description must be ${ALERT_DESCRIPTION_CHAR_LIMIT} characters or less`)
    }
    if (!end || !start) {
      return window.alert('Alert must have a start and end date')
    }
    if (end < start) {
      return window.alert('Alert end date cannot be before start date')
    }
    if (moment(end).isBefore(moment())) {
      return window.alert('Alert end date cannot be before the current date')
    }
    if (affectedEntities.length === 0) {
      return window.alert('You must specify at least one affected entity')
    }
    onSaveClick(alert)
  }

  deleteAlert = () => this.props.onDeleteClick(this.props.alert)

  _onChange = (evt) => this.props.propertyChanged({[evt.target.name]: evt.target.value})

  _onChangeEnd = time => this.props.propertyChanged({end: time})

  _onChangeStart = time => this.props.propertyChanged({start: time})

  _onClickBack = (evt) => browserHistory.push('/alerts')

  _onClickDelete = (evt) => {
    const {alert} = this.props
    this.refs.page.showConfirmModal({
      title: 'Delete Alert #' + alert.id + '?',
      body: <p>Are you sure you want to delete <strong>Alert {alert.id}</strong>?</p>,
      onConfirm: this.deleteAlert
    })
  }

  _onClickPublish = (evt) => this.props.onPublishClick(this.props.alert, !this.props.alert.published)

  render () {
    const {
      activeFeeds,
      alert,
      editableFeeds,
      editorStopClick,
      editorRouteClick,
      publishableFeeds
    } = this.props
    if (!alert) return <ManagerPage><Loading /></ManagerPage>
    var compare = function (a, b) {
      var aName = a.shortName || a.name
      var bName = b.shortName || b.name
      // return 511 Staff as first in list to avoid 511 Emergency being first in list
      if (/511 Staff/.test(aName)) return -1
      if (/511 Staff/.test(bName)) return 1
      if (aName < bName) return -1
      if (aName > bName) return 1
      return 0
    }
    const titleCharactersRemaining = alert.title ? ALERT_TITLE_CHAR_LIMIT - alert.title.length : ALERT_TITLE_CHAR_LIMIT
    const descriptionCharactersRemaining = alert.description ? ALERT_DESCRIPTION_CHAR_LIMIT - alert.description.length : ALERT_DESCRIPTION_CHAR_LIMIT
    const canPublish = alert.affectedEntities.length && checkEntitiesForFeeds(alert.affectedEntities, publishableFeeds)
    const canEdit = checkEntitiesForFeeds(alert.affectedEntities, editableFeeds)
    const editingIsDisabled = alert.published && !canPublish ? true : !canEdit
    const sortedFeeds = editableFeeds.sort(compare)
    // if user has edit rights and alert is unpublished, user can delete alert, else check if they have publish rights
    const deleteIsDisabled = !editingIsDisabled && !alert.published
      ? false
      : !canPublish
    const deleteButtonMessage = alert.published && deleteIsDisabled
      ? 'Cannot delete because alert is published'
      : !canEdit ? 'Cannot alter alerts for other agencies' : 'Delete alert'
    const editButtonMessage = alert.published && deleteIsDisabled
      ? 'Cannot edit because alert is published'
      : !canEdit ? 'Cannot alter alerts for other agencies' : 'Edit alert'
    const newEntityId = alert.affectedEntities && alert.affectedEntities.length
      ? 1 + alert.affectedEntities.map(e => e.id).reduce((initial, current) => initial > current ? initial : current)
      : 1
    return (
      <ManagerPage
        ref='page'
        title={alert.id > 0 ? `Alert ${alert.id}` : 'New Alert'}>
        <Grid fluid>
          <Row>
            <Col xs={4} sm={7} md={8}>
              <Button
                onClick={this._onClickBack}>
                <Icon type='chevron-left' /> Back
              </Button>
            </Col>
            <Col xs={8} sm={5} md={4}>
              <ButtonToolbar className='pull-right' style={{marginLeft: '5px'}}>
                <Button
                  title={editButtonMessage}
                  bsStyle='primary'
                  disabled={editingIsDisabled}
                  onClick={this.validateAndSave}
                ><Icon type='save' /> Save</Button>
                <Button
                  title={deleteButtonMessage}
                  bsStyle='danger'
                  disabled={deleteIsDisabled}
                  onClick={this._onClickDelete}
                ><Icon type='trash' /> Delete</Button>
              </ButtonToolbar>
              <FormGroup
                className='pull-right'
                style={{position: 'relative', top: '5px'}}>
                <Toggle
                  id='alert-published'
                  disabled={!canPublish}
                  checked={alert.published}
                  onChange={this._onClickPublish} />
                <label
                  htmlFor='alert-published'
                  style={{position: 'relative', top: '-5px', marginLeft: '5px'}}>
                  Published?
                </label>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col xs={12} sm={6}>
              <Row>
                <Col xs={12} style={{marginTop: '10px'}}>
                  <FormGroup controlId='formControlsTitle'>
                    <ControlLabel>
                      Alert Title
                      {' '}
                      <span
                        className={titleCharactersRemaining > CHAR_WARNING_LIMIT ? 'text-muted' : 'text-danger'}
                        style={{fontWeight: 400}}>{titleCharactersRemaining}</span>
                      <h5 style={{margin: '0px'}}>
                        <small>
                          Note: alert title serves as text for eTID alerts. Use descriptive language so it can serve as a standalone alert.
                        </small>
                      </h5>
                    </ControlLabel>
                    <FormControl
                      bsSize='large'
                      placeholder='E.g., Sig. Delays due to Golden Gate Bridge Closure'
                      defaultValue={alert.title || ''}
                      name='title'
                      onChange={this._onChange} />
                  </FormGroup>
                </Col>
                <Col xs={6}>
                  <div style={{marginBottom: '5px'}}><strong>Start</strong></div>
                  {alert.start
                    ? <DateTimeField
                      disabled
                      dateTime={alert.start}
                      onChange={this._onChangeStart} />
                    : <DateTimeField
                      defaultText='Please select a date'
                      onChange={this._onChangeStart} />
                  }
                </Col>
                <Col xs={6}>
                  <div style={{marginBottom: '5px'}}><strong>End</strong></div>
                  {alert.end
                    ? <DateTimeField
                      dateTime={alert.end}
                      onChange={this._onChangeEnd} />
                    : <DateTimeField
                      defaultText='Please select a date'
                      onChange={this._onChangeEnd} />
                  }
                </Col>
              </Row>
              <Row>
                <Col xs={6}>
                  <FormGroup controlId='formControlsCause'>
                    <ControlLabel>Cause</ControlLabel>
                    <FormControl
                      componentClass='select'
                      onChange={this._onChange}
                      name='cause'
                      value={alert.cause}>
                      {CAUSES.map((cause) => (
                        <option key={cause} value={cause}>{toSentenceCase(cause.replace('_', ' '))}</option>
                      ))}
                    </FormControl>
                  </FormGroup>
                </Col>
                <Col xs={6}>
                  <FormGroup controlId='formControlsEffect'>
                    <ControlLabel>Effect</ControlLabel>
                    <FormControl
                      componentClass='select'
                      onChange={this._onChange}
                      name='effect'
                      value={alert.effect}>
                      {EFFECTS.map((effect) => (
                        <option key={effect} value={effect}>{toSentenceCase(effect.replace('_', ' '))}</option>
                      ))}
                    </FormControl>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={12} sm={6}>
                  <FormGroup controlId='formControlsDescription'>
                    <ControlLabel>
                      Description
                      {' '}
                      <span
                        className={descriptionCharactersRemaining > CHAR_WARNING_LIMIT ? 'text-muted' : 'text-danger'}
                        style={{fontWeight: 400}}>{descriptionCharactersRemaining}</span>
                    </ControlLabel>
                    <FormControl
                      componentClass='textarea'
                      placeholder='Detailed description of alert...'
                      defaultValue={alert.description}
                      name='description'
                      onChange={this._onChange} />
                  </FormGroup>
                </Col>
                <Col xs={12} sm={6}>
                  <FormGroup controlId='formControlsURL'>
                    <ControlLabel>URL</ControlLabel>
                    <FormControl
                      type='text'
                      placeholder='http://511.org/alerts/transit/123'
                      defaultValue={alert.url}
                      name='url'
                      onChange={this._onChange} />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <AffectedServices
                    sortedFeeds={sortedFeeds}
                    newEntityId={newEntityId}
                    {...this.props} />
                </Col>
              </Row>
            </Col>
            <Col xs={12} sm={6}>
              <Row>
                <Col xs={12}>
                  <GlobalGtfsFilter permissionFilter='edit-alert' />
                </Col>
              </Row>
              <GtfsMapSearch
                feeds={activeFeeds}
                onStopClick={editorStopClick}
                onRouteClick={editorRouteClick}
                popupAction='Add'
                newEntityId={newEntityId} />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
