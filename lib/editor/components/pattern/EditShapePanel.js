// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import {Alert, Button, ButtonGroup, ButtonToolbar, OverlayTrigger, Tooltip} from 'react-bootstrap'
import ll from '@conveyal/lonlat'
import numeral from 'numeral'
import lineDistance from 'turf-line-distance'
import lineString from 'turf-linestring'

import * as activeActions from '../../actions/active'
import * as mapActions from '../../actions/map'
import {ARROW_MAGENTA, PATTERN_TO_STOP_DISTANCE_THRESHOLD_METERS} from '../../constants'
import * as tripPatternActions from '../../actions/tripPattern'
import OptionButton from '../../../common/components/OptionButton'
import * as statusActions from '../../../manager/actions/status'
import {polyline as getPolyline} from '../../../scenario-editor/utils/valhalla'
import {
  controlPointsFromSegments,
  generateControlPointsFromPatternStops,
  getPatternDistance,
  isValidStopControlPoint
} from '../../util/map'
import type {ControlPoint, LatLng, Pattern, GtfsStop} from '../../../types'
import type {EditSettingsUndoState} from '../../../types/reducers'

import EditSettings from './EditSettings'

type Props = {
  activePattern: Pattern,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsUndoState,
  patternSegment: number,
  resetActiveGtfsEntity: typeof activeActions.resetActiveGtfsEntity,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActivePatternSegment: typeof tripPatternActions.setActivePatternSegment,
  setErrorMessage: typeof statusActions.setErrorMessage,
  showConfirmModal: any,
  stops: Array<GtfsStop>,
  togglePatternEditing: typeof tripPatternActions.togglePatternEditing,
  undoActiveTripPatternEdits: typeof tripPatternActions.undoActiveTripPatternEdits,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity,
  updateEditSetting: typeof activeActions.updateEditSetting,
  updatePatternGeometry: typeof mapActions.updatePatternGeometry,
}

export default class EditShapePanel extends Component<Props> {
  /**
   * Construct new pattern geometry from the pattern stop locations.
   */
  async drawPatternFromStops (pattern: Pattern, stopsCoordinates: Array<LatLng>, followStreets: boolean): Promise<any> {
    const {editSettings, saveActiveGtfsEntity, setErrorMessage, updatePatternGeometry} = this.props
    let patternSegments = []
    if (followStreets) {
      patternSegments = await getPolyline(stopsCoordinates, true, editSettings.present.avoidMotorways)
    } else {
      // Construct straight-line segments using stop coordinates
      stopsCoordinates
        .forEach((stop, i) => {
          if (i < stopsCoordinates.length - 1) {
            const segment = [ll.toCoordinates(stop), ll.toCoordinates(stopsCoordinates[i + 1])]
            patternSegments.push(segment)
          }
        })
    }
    if (patternSegments && patternSegments.length > 0) {
      const controlPoints = controlPointsFromSegments(pattern.patternStops, patternSegments)
      updatePatternGeometry({
        controlPoints,
        patternSegments
      })
      saveActiveGtfsEntity('trippattern')
      return true
    } else {
      setErrorMessage({message: 'Erreur lors de la création de la circulation depuis les arrêts. Certains arrêts doivent être inaccessible par les rues.'})
      return false
    }
  }

  _cancelEdits = () => {
    const {activePattern, resetActiveGtfsEntity, togglePatternEditing} = this.props
    if (this._hasEdits()) {
      if (!window.confirm('Vous avez des modifications non enregistrées. Êtes-vous sûrs de vouloir annuler et de revenir sur ces changements ?')) {
        return
      }
    }
    togglePatternEditing()
    resetActiveGtfsEntity({
      component: 'trippattern',
      entity: activePattern
    })
  }

  _generateShapeFromStops = () => {
    const {activePattern, editSettings, stops} = this.props
    const stopLocations = stops && activePattern.patternStops && activePattern.patternStops.length
      ? activePattern.patternStops
        .map((s, index) => {
          const stop = stops.find(st => st.stop_id === s.stopId)
          if (!stop) {
            console.warn(`Impossible de localiser l'arrêt avec le stop_id=${s.stopId}`)
            return {lng: 0, lat: 0}
          }
          return {lng: stop.stop_lon, lat: stop.stop_lat}
        })
      : []
    this.drawPatternFromStops(activePattern, stopLocations, editSettings.present.followStreets)
  }

  _confirmCreateFromStops = () => {
    const title = 'Créer un tracé de circulation depuis les arrêts ?'
    const onConfirm = this._generateShapeFromStops
    const body = this._hasShapePoints()
      ? 'Êtes-vous sûr de vouloir remplacer le trajet précéent pour cette circulation ?'
      : 'Êtes-vous sûr de vouloir créer un tracé auto-généré pour cette circulation ?'
    this.props.showConfirmModal({title, body, onConfirm})
  }

  _deleteShape = () => {
    const {
      activePattern,
      saveActiveGtfsEntity,
      showConfirmModal,
      stops,
      updateActiveGtfsEntity,
      updatePatternGeometry
    } = this.props
    const shapeId = activePattern.shapeId || '(non défini)'
    showConfirmModal({
      title: `Supprimer le tracé pour cette circulation ?`,
      body: `Êtes-vous sûr de vouloir supprimer ce tracé de circulation (shape_id: ${shapeId})?`,
      onConfirm: () => {
        // FIXME: Do we need to update pattern geometry, too?
        updatePatternGeometry(generateControlPointsFromPatternStops(activePattern.patternStops, stops))
        updateActiveGtfsEntity({
          component: 'trippattern',
          entity: activePattern,
          props: {shapePoints: [], shapeId: null}
        })
        saveActiveGtfsEntity('trippattern')
      }
    })
  }

  /**
   * Checks the control points for stop control points that are located too far
   * from the actual stop location. This is used to give instructions to the
   * user on resolving the issue.
   */
  _getPatternStopsWithShapeIssues = () => {
    const {controlPoints, stops} = this.props
    return controlPoints
      // $FlowFixMe: can't tell flow all elements are defined in the map.
      .filter(isValidStopControlPoint)
      .map((controlPoint, index) => {
        const {point, stopId} = controlPoint
        let exceedsThreshold = false
        const {coordinates: cpCoord} = point.geometry
        // Find stop entity for control point.
        const stop = stops.find(s => s.stop_id === stopId)
        if (!stop) {
          // If no stop entity found, do not attempt to draw a line to the
          // missing stop.
          return {controlPoint, index, stop: null, distance: 0, exceedsThreshold}
        }
        const coordinates = [[cpCoord[1], cpCoord[0]], [stop.stop_lat, stop.stop_lon]]
        const distance: number = lineDistance(lineString(coordinates), 'meters')
        exceedsThreshold = distance > PATTERN_TO_STOP_DISTANCE_THRESHOLD_METERS
        return {
          controlPoint,
          distance,
          exceedsThreshold,
          index,
          stop
        }
      })
      // TODO: This can be removed if at some point we need to show stops where
      // the distance threshold is not exceeded.
      .filter(item => item.exceedsThreshold)
  }

  _beginEditing = () => {
    const {togglePatternEditing} = this.props
    togglePatternEditing()
  }

  _hasShapePoints = () => this.props.activePattern.shapePoints &&
    this.props.activePattern.shapePoints.length > 0

  save = () => {
    const {editSettings, saveActiveGtfsEntity, updateEditSetting} = this.props
    saveActiveGtfsEntity('trippattern')
      // $FlowFixMe action is actually wrapped in promise when connected
      .then(() => updateEditSetting({
        setting: 'editGeometry',
        value: !editSettings.present.editGeometry
      }))
  }

  _hasEdits = () => this.props.editSettings.past.length > 0

  render () {
    const {
      activePattern,
      controlPoints, // FIXME use to describe which segment user is editing
      patternSegment,
      editSettings: editSettingsState,
      setActivePatternSegment,
      updateEditSetting,
      undoActiveTripPatternEdits
    } = this.props
    const {present: editSettings} = editSettingsState
    const hasEdits = this._hasEdits()
    const fromStopsButton = <OverlayTrigger
      placement='bottom'
      overlay={
        <Tooltip id='from-stops'>Générer le tracé de circulation depuis les arrêts</Tooltip>
      }>
      <Button
        onClick={this._confirmCreateFromStops}
        bsSize='small'
        style={{width: '102px'}}>
        <span><Icon type='map-marker' /> Par arrêts</span>
      </Button>
    </OverlayTrigger>
    const dist = getPatternDistance(activePattern, controlPoints)
    const formattedShapeDistance = numeral(dist).format('0,0.00')
    const nextSegment = (!patternSegment && patternSegment !== 0)
      ? 0
      : patternSegment + 1
    const patternStopsWithShapeIssues = this._getPatternStopsWithShapeIssues()
    return (
      <div>
        <h4 className='line'>
          Tracé de circulation
          {' '}
          ({formattedShapeDistance} miles)
        </h4>
        <div style={{margin: '5px 0'}}>
          {!activePattern.shapeId
            ? <small className='text-warning'>
              <Icon type='exclamation-triangle' />{' '}
              Pas de tracé associé à cette circulation.
            </small>
            : <small>
              <span className='overflow' style={{width: '250px'}}>
                shape_id:{' '}
                <span title={activePattern.shapeId}>{activePattern.shapeId}</span>
              </span>
              <Button
                bsStyle='link'
                bsSize='small'
                style={{padding: '0 2px 10px 2px'}}
                title='Delete shape for pattern'
                onClick={this._deleteShape}>
                <span className='text-danger'><Icon type='trash' /></span>
              </Button>
            </small>
          }
        </div>
        {patternStopsWithShapeIssues.length > 0
          ? <Alert bsStyle='warning' style={{fontSize: 'small'}}>
            <h4><Icon type='exclamation-triangle' /> Erreurs </h4>
            <ul className='list-unstyled' style={{marginBottom: '5px'}}>
              {patternStopsWithShapeIssues
                .map(item => {
                  const {distance, index, stop} = item
                  if (!stop) return null
                  const roundedDist = Math.round(distance * 100) / 100
                  return (
                    <li key={index}>
                      #{index + 1} {stop.stop_name}{' '}
                      <span style={{color: 'red'}}>
                        {roundedDist} m
                      </span>
                    </li>
                  )
                })
              }
            </ul>
            <p>
              Les arrêts suivants sont trop loin
              (max = {PATTERN_TO_STOP_DISTANCE_THRESHOLD_METERS}{' '}
              mètres) du tracé de circulation.
            </p>
            <p>
              Ce problème peut être résolu en
              <ol>
                <li>
                  déplaçant l'arrêt lui-même en le mettant plus proche de la rue
                </li>
                <li>
                  changeant où l'arrêt est "snappé" au tracé: cliquer{' '}
                  <strong>Editer le tracé</strong>, décocher{' '}
                  <strong>Cacher les stop handles</strong>, et déplacer le stop handle
                  en le mettant plus proche de l'arrêt. 
                  Utiliser <strong>Cacher les segments inactifs</strong>{' '}
                  permet d'isoler un stop handle problématique; ou
                </li>
                <li>
                  regénérant le tracé à partir d'arrêts existants: cliquer{' '}
                  <strong>Par arrêts</strong>.
                </li>
              </ol>
            </p>
          </Alert>
          : null
        }

        {editSettings.editGeometry
          ? <div>
            <ButtonToolbar>
              <Button
                block
                style={{width: '167px'}}
                onClick={this._cancelEdits}
                bsSize='small'>
                <Icon type='ban' /> Annuler l'édition du tracé
              </Button>
              {fromStopsButton}
            </ButtonToolbar>
            <ButtonGroup style={{margin: '5px 0'}} block>
              <OptionButton
                onClick={setActivePatternSegment}
                value={patternSegment - 1}
                disabled={!patternSegment || patternSegment < 1}
                bsSize='xsmall'>
                <Icon type='caret-left' style={{color: 'blue'}} /> Prec
              </OptionButton>
              <OptionButton
                onClick={setActivePatternSegment}
                style={{minWidth: '165px', fontSize: '80%', padding: '2px 0'}}
                disabled={patternSegment >= controlPoints.length - 1}
                value={nextSegment}
                bsSize='xsmall'>
                {!patternSegment && patternSegment !== 0
                  ? `Cliquer sur la ligne pour commencer l'édition.`
                  : `Modification de l'ancre ${patternSegment + 1} de ${controlPoints.length}`
                }
              </OptionButton>
              <OptionButton
                onClick={setActivePatternSegment}
                className='pull-right'
                value={nextSegment}
                disabled={patternSegment >= controlPoints.length - 1}
                bsSize='xsmall'>
                  Suiv <Icon type='caret-right' style={{color: ARROW_MAGENTA}} />
              </OptionButton>
            </ButtonGroup>
            <ButtonToolbar>
              <Button
                bsSize='small'
                disabled={!hasEdits}
                onClick={this.save}>
                <Icon type='check' /> Enregistrer
              </Button>
              <Button
                bsSize='small'
                disabled={!hasEdits}
                onClick={undoActiveTripPatternEdits}>
                <Icon type='undo' /> Annuler
              </Button>
            </ButtonToolbar>
            <EditSettings
              editSettings={editSettings}
              patternSegment={patternSegment}
              updateEditSetting={updateEditSetting} />
          </div>
          : <ButtonToolbar>
            <Button
              onClick={this._beginEditing}
              bsSize='small'
              style={{width: '167px'}}
              bsStyle='warning'>
              <span><Icon type='pencil' /> Editer le tracé</span>
            </Button>
            {fromStopsButton}
          </ButtonToolbar>
        }
      </div>
    )
  }
}
