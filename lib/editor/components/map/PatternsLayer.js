// @flow

import randomColor from 'randomcolor'
import React, {PureComponent} from 'react'
import {Polyline, Tooltip} from 'react-leaflet'

import * as activeActions from '../../actions/active'
import * as mapActions from '../../actions/map'
import * as tripPatternActions from '../../actions/tripPattern'
import {ensureValidCoords, isSegmentActive} from '../../util/map'
import type {ControlPoint, Coordinates, Entity, Feed, GtfsRoute, LatLng, Pattern} from '../../../types'
import type {EditSettingsState} from '../../../types/reducers'

type Props = {
  activeEntity: Entity,
  activePattern: Pattern,
  constructControlPoint: typeof mapActions.constructControlPoint,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsState,
  feedSource: Feed,
  patternCoordinates: Array<Coordinates>,
  patternSegment: number,
  route: GtfsRoute,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActivePatternSegment: typeof tripPatternActions.setActivePatternSegment,
  subEntityId: number,
  updateEditSetting: typeof activeActions.updateEditSetting
}

type SegmentProps = {
  latlng: LatLng,
  pattern: Pattern,
  segmentCoordinates: Coordinates,
  segmentIndex: number
}

export default class PatternsLayer extends PureComponent<Props> {
  _constructControlPoint = (segmentProps: SegmentProps) => {
    const {constructControlPoint, patternCoordinates, controlPoints} = this.props
    constructControlPoint({...segmentProps, patternCoordinates, controlPoints})
  }

  render () {
    const {
      activeEntity,
      activePattern,
      editSettings,
      feedSource,
      patternCoordinates,
      patternSegment,
      route,
      setActiveEntity,
      setActivePatternSegment,
      subEntityId,
      updateEditSetting
    } = this.props
    return (
      <div id='trip-patterns-layer'>
        {route && route.tripPatterns
          ? route.tripPatterns
            .map(tp => {
              const isActive = subEntityId === tp.id
              const isEditing = isActive && editSettings.editGeometry
              const pattern = isActive ? activePattern : tp
              // Coordinates for non-active trip patterns
              const latLngs = (
                pattern && pattern.shape && ensureValidCoords(pattern.shape.coordinates)
                  ? pattern.shape.coordinates
                  : []
              )
              // NOTE: don't render pattern if latlngs don't exist or a single pattern is active
              if (!latLngs || (!isActive && subEntityId)) {
                !latLngs && console.warn(`not rendering ${tp.id} due to missing coordinates`)
                return null
              }
              const lineColor = editSettings.editGeometry
                ? '#F3F315' // yellow if editing
                : 'blue'
              const clickAction = isEditing
                ? 'ajouter un point de contrôle'
                : isActive
                  ? 'modifier le tracé'
                  : 'sélectionner'
              if (isActive) {
                // Render active pattern as collection of inter-stop segments.
                // console.log('active pattern coordinates', patternCoordinates)
                return patternCoordinates && patternCoordinates
                  .map((coordinates, index) => {
                    const segmentIsActive = isSegmentActive(patternSegment, index)
                    if (!segmentIsActive && editSettings.hideInactiveSegments && editSettings.editGeometry) {
                      return null
                    }
                    return <PatternSegment
                      key={`${tp.id}-${index}`}
                      activeEntity={activeEntity}
                      index={index}
                      feedSource={feedSource}
                      isEditing={isEditing}
                      patternIsActive={isActive}
                      segmentIsActive={segmentIsActive}
                      setActivePatternSegment={setActivePatternSegment}
                      clickAction={clickAction}
                      color={lineColor}
                      setActiveEntity={setActiveEntity}
                      updateEditSetting={updateEditSetting}
                      editSettings={editSettings}
                      coordinates={coordinates}
                      // Pass active pattern (with up-to-date shape) as prop
                      pattern={activePattern}
                      constructControlPoint={this._constructControlPoint} />
                  })
              } else {
                // Render inactive pattern as single polyline.
                return (
                  <PatternSegment
                    activeEntity={activeEntity}
                    clickAction={clickAction}
                    color={lineColor}
                    constructControlPoint={this._constructControlPoint}
                    coordinates={latLngs}
                    editSettings={editSettings}
                    feedSource={feedSource}
                    isEditing={isEditing}
                    key={tp.id}
                    pattern={tp}
                    patternIsActive={isActive}
                    setActiveEntity={setActiveEntity}
                    setActivePatternSegment={setActivePatternSegment}
                    updateEditSetting={updateEditSetting} />
                )
              }
            })
          : null
        }
      </div>
    )
  }
}

type PatternSegmentProps = {
  activeEntity: Entity,
  clickAction: string,
  color: string,
  constructControlPoint: SegmentProps => void,
  coordinates: Coordinates,
  editSettings: EditSettingsState,
  feedSource: Feed,
  index?: number,
  isEditing: boolean,
  pattern: Pattern,
  patternIsActive: boolean,
  segmentIsActive?: boolean,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActivePatternSegment: typeof tripPatternActions.setActivePatternSegment,
  updateEditSetting: typeof activeActions.updateEditSetting
}

class PatternSegment extends PureComponent<PatternSegmentProps> {
  _onClick = (e: SyntheticInputEvent<HTMLInputElement> & {latlng: LatLng}) => {
    const {
      pattern,
      activeEntity,
      constructControlPoint,
      coordinates,
      editSettings,
      feedSource,
      index,
      isEditing,
      patternIsActive,
      segmentIsActive,
      setActiveEntity,
      setActivePatternSegment,
      updateEditSetting
    } = this.props
    if (
      isEditing &&
      segmentIsActive &&
      editSettings.onMapClick === 'DRAG_HANDLES' &&
      typeof index !== 'undefined'
    ) {
      constructControlPoint({
        pattern,
        latlng: e.latlng,
        segmentIndex: index,
        segmentCoordinates: coordinates
      })
    }
    if (!isEditing && patternIsActive) {
      updateEditSetting({
        setting: 'editGeometry',
        value: true
      })
    }
    if (!patternIsActive) {
      setActiveEntity(
        feedSource.id,
        'route',
        activeEntity,
        'trippattern',
        pattern
      )
    }
    if (patternIsActive && !segmentIsActive) {
      setActivePatternSegment(index)
    }
  }

  render () {
    const {color,
      clickAction,
      coordinates,
      editSettings,
      index,
      isEditing,
      segmentIsActive,
      patternIsActive,
      pattern
    } = this.props
    const hasShapePoints = pattern.shapePoints && pattern.shapePoints.length > 0
    if (!coordinates || !coordinates.length || !ensureValidCoords(coordinates)) {
      if (typeof index === 'number') {
        console.warn(`Impossible de dessiner le segment #${index} du motif ${pattern.id}`, coordinates)
      } else {
        // console.warn(`Could not render shape for pattern ID ${pattern.id}`, coordinates)
      }
      return null
    }
    if (coordinates.length < 2) {
      coordinates.push(coordinates[0])
    }
    const editingSegment = segmentIsActive && isEditing
    const dragEnabled = editSettings.onMapClick === 'DRAG_HANDLES'
    let badCoordinates = false
    const reversedCoordinates = coordinates.map(c => {
      if (!c[1] || !c[0]) {
        console.warn(`Coordonnées non valides`)
        badCoordinates = true
      }
      return [c[1], c[0]]
    })
    if (badCoordinates) return null
    return (
      <Polyline
        // React leaflet coordinates are [lat, lon]
        key={Math.random()}
        positions={reversedCoordinates}
        onClick={this._onClick}
        lineCap='butt'
        color={editingSegment
          ? 'green'
          : isEditing && patternIsActive
            ? randomColor()
            : color
        }
        dashArray={patternIsActive && !hasShapePoints ? '5, 5' : undefined}
        opacity={editingSegment ? 0.8 : 0.5}
        weight={5}>
        <Tooltip
          key={Math.random()}
          opacity={editSettings.showTooltips ? 0.9 : 0}
          sticky>
          <span>
            {dragEnabled && isEditing
              ? `Cliquer pour ${editingSegment ? clickAction : 'éditer le segment'}`
              : dragEnabled
                ? `${pattern.name} (click to ${clickAction})`
                : 'L\'option Glisser est désactivé. Changer le mode d\'édition pour l\'utiliser.'
            }
          </span>
        </Tooltip>
      </Polyline>
    )
  }
}
