// @flow

import ll from '@conveyal/lonlat'
import clone from 'lodash/cloneDeep'
import uniqueId from 'lodash/uniqueId'
import {createAction, type ActionType} from 'redux-actions'
import shp from 'shpjs'
import lineDistance from 'turf-line-distance'
import lineString from 'turf-linestring'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import point from 'turf-point'

import {updatePatternStops, setActivePatternSegment} from '../tripPattern'
import {saveActiveGtfsEntity} from '../active'
import {POINT_TYPE} from '../../constants'
import {setErrorMessage} from '../../../manager/actions/status'
import {
  getLineSlices,
  recalculateShape,
  newControlPoint,
  shapePointsToSimpleCoordinates
} from '../../util/map'
import type {Feed, LatLng, Pattern, ControlPoint} from '../../../types'
import type {dispatchFn, getStateFn} from '../../../types/reducers'

import {updateShapeDistTraveled} from './stopStrategies'

export const controlPointDragOrEnd = createAction(
  'CONTROL_POINT_DRAG_START_OR_END',
  (payload: void | string) => payload
)
export const receivedRoutesShapefile = createAction(
  'RECEIVED_ROUTES_SHAPEFILE',
  (payload: { geojson: Object }) => payload
)
export const updateMapSetting = createAction(
  'UPDATE_MAP_SETTING',
  (payload: { bounds?: any, target?: number, zoom?: number }) => payload
)
export const updatePatternGeometry = createAction(
  'UPDATE_PATTERN_GEOMETRY',
  (payload: {
    controlPoints: ?Array<ControlPoint>,
    patternSegments: ?Array<[number, number]>
  }) => payload
)
export const updateTempPatternGeometry = createAction(
  'UPDATE_TEMP_PATTERN_GEOMETRY',
  (payload: {
    controlPoints: ?Array<ControlPoint>,
    patternSegments: ?Array<[number, number]>
  }) => payload
)

export type EditorMapActions = ActionType<typeof controlPointDragOrEnd> |
  ActionType<typeof receivedRoutesShapefile> |
  ActionType<typeof updateMapSetting> |
  ActionType<typeof updatePatternGeometry> |
  ActionType<typeof updateTempPatternGeometry>

/**
 * Construct control point at provided latlng and update pattern geometry and
 * control points.
 */
export function constructControlPoint ({
  controlPoints,
  latlng,
  pattern,
  patternCoordinates,
  segmentCoordinates,
  segmentIndex
}: {
  controlPoints: Array<ControlPoint>,
  latlng: LatLng,
  pattern: Pattern,
  patternCoordinates: any,
  segmentCoordinates: any,
  segmentIndex: number
}) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {shapePoints} = pattern
    let patternLine
    if (shapePoints.length > 0) {
      // If pattern already has a shape, use shape points to construct line string.
      patternLine = lineString(shapePointsToSimpleCoordinates(shapePoints))
    } else {
      // Otherwise, use the pattern coordinates to get straight line segments
      // as a line string.
      patternLine = lineString([].concat.apply([], patternCoordinates))
    }
    const segmentLine = lineString(segmentCoordinates)
    const coord = ll.toCoordinates(latlng)
    const clickPoint = point(coord)
    // Assign point to location on line (click latlng may not be precise at
    // certain zoom levels).
    const pointOnLine = nearestPointOnLine(patternLine, clickPoint)
    // Slice entire pattern shape (to get distance of before splice).
    const {beforeSlice} = getLineSlices(patternLine, pointOnLine)
    const distTraveled = lineDistance(beforeSlice, 'meters')
    const {
      beforeSlice: beforeSegment,
      afterSlice: afterSegment
    } = getLineSlices(segmentLine, pointOnLine)

    const controlPoint = newControlPoint(distTraveled, pointOnLine, {
      // NOTE: Shape pt sequence value here may be inaccurate, but it will be
      // post processed later.
      shapePtSequence: beforeSlice.geometry.coordinates.length,
      shapePtLat: pointOnLine.geometry.coordinates[1],
      shapePtLon: pointOnLine.geometry.coordinates[0],
      // User can only add control points for non-stop anchors
      pointType: POINT_TYPE.ANCHOR // 1
    })
    // Make a copy of the latest set of control points
    const updatedControlPoints = [...controlPoints]
    // Splice in new control point.
    const controlPointIndex = segmentIndex + 1
    updatedControlPoints.splice(controlPointIndex, 0, controlPoint)
    const patternSegments = clone(patternCoordinates)
    // Update item at segmentIndex and insert new sliced segments.
    patternSegments.splice(
      segmentIndex,
      1,
      beforeSegment.geometry.coordinates,
      afterSegment.geometry.coordinates
    )
    dispatch(
      updatePatternGeometry({
        controlPoints: updatedControlPoints,
        patternSegments
      })
    )
    // Update active segment.
    dispatch(setActivePatternSegment(controlPointIndex))
  }
}

export function displayRoutesShapefile (feedSource: Feed, file: File) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const reader = new window.FileReader()
    reader.onload = e => {
      const arrayBuff = reader.result
      shp(arrayBuff).then(geojson => {
        geojson.key = Math.random()
        dispatch(receivedRoutesShapefile({geojson}))
      })
    }
    reader.readAsArrayBuffer(file)
  }
}

/**
 * Calculate a new shape according to newly dragged position of control point
 *
 * @param  {ControlPoint[]} controlPoints
 * @param  {Number} index Index of the control point being dragged
 * @param  {Position} latlng  Position of drag point
 * @param  {Object} patternShape
 */
export function handleControlPointDrag (
  controlPoints: Array<ControlPoint>,
  index: number,
  latlng: LatLng,
  pattern: Pattern,
  patternCoordinates: any
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {avoidMotorways, currentDragId, followStreets} = getState().editor.editSettings.present
    recalculateShape({
      avoidMotorways,
      controlPoints,
      defaultToStraightLine: false,
      dragId: currentDragId,
      editType: 'update',
      followStreets,
      index,
      newPoint: latlng,
      patternCoordinates
    }).then(result => {
      const {currentDragId} = getState().editor.editSettings.present
      // If there is a dragId in the store and it matches the result, the user
      // is still dragging the control point
      const stillDragging = currentDragId && result.dragId === currentDragId
      if (
        stillDragging &&
        result.coordinates
      ) {
        // Dragging a control point should not register with the undo history.
        dispatch(updateTempPatternGeometry({
          controlPoints: result.updatedControlPoints,
          patternSegments: result.coordinates
        }))
      }
    })
  }
}

export function handleControlPointDragEnd (
  controlPoints: Array<ControlPoint>,
  index: number,
  latlng: LatLng,
  pattern: Pattern,
  patternCoordinates: any
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // proclaim end of dragging (with undefined dragId argument)
    dispatch(controlPointDragOrEnd())

    // recalculate shape for final position
    const {avoidMotorways, followStreets} = getState().editor.editSettings.present
    recalculateShape({
      avoidMotorways,
      controlPoints,
      defaultToStraightLine: false,
      editType: 'update',
      index,
      followStreets,
      newPoint: latlng,
      patternCoordinates,
      snapControlPointToNewSegment: true
    }).then(result => {
      // const {updatedShapePoints: shapePoints, updatedControlPoints} = result
      if (!result.coordinates) {
        dispatch(setErrorMessage({
          message: 'Une erreur est survenue lors du calcul du tracé. Veuillez réessayer.'
        }))
      } else {
        // console.log('drag end result', result)
        dispatch(updatePatternGeometry({
          controlPoints: result.updatedControlPoints,
          patternSegments: result.coordinates
        }))
      }
    })
  }
}

/**
 * Save data to store that dragging is in progress
 *
 * @param  {ControlPoint} controlPoint
 * @return {Action}
 */
export function handleControlPointDragStart (controlPoint: ControlPoint) {
  return controlPointDragOrEnd(uniqueId(`${controlPoint.id}`))
}

export function removeControlPoint (controlPoints: Array<ControlPoint>, index: number, pattern: Pattern, patternCoordinates: any) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const {avoidMotorways, followStreets} = getState().editor.editSettings.present
    const {
      coordinates,
      updatedControlPoints
    // $FlowFixMe: Flow does not recognize patterns within returned Promise type
    } = await recalculateShape({
      avoidMotorways,
      controlPoints,
      editType: 'delete',
      index,
      followStreets,
      patternCoordinates
    })

    // Update the shape_dist_traveled values to reflect the new pattern that the bus follows
    updateShapeDistTraveled(updatedControlPoints, coordinates, pattern.patternStops)

    // Update active pattern in store (does not save to server).
    dispatch(updatePatternGeometry({
      controlPoints: updatedControlPoints,
      patternSegments: coordinates
    }))

    // Ensure that all updates are reflected in exports.
    dispatch(updatePatternStops(pattern, pattern.patternStops))
    dispatch(saveActiveGtfsEntity('trippattern'))
  }
}
