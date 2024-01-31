// @flow

import along from '@turf/along'
import ll from '@conveyal/lonlat'
import clone from 'lodash/cloneDeep'
import lineDistance from 'turf-line-distance'
import lineSliceAlong from '@turf/line-slice-along'
import lineSlice from 'turf-line-slice'
import lineString from 'turf-linestring'
import point from 'turf-point'

import {updateActiveGtfsEntity, saveActiveGtfsEntity} from '../active'
import {updatePatternStops} from '../tripPattern'
import {generateUID} from '../../../common/util/util'
import { getControlPointsForStops } from '../../components/map/pattern-debug-lines'
import {POINT_TYPE} from '../../constants'
import {newGtfsEntity} from '../editor'
import {setErrorMessage} from '../../../manager/actions/status'
import {updatePatternGeometry} from '../map'
import {getControlPoints} from '../../selectors'
import {getSegment, polyline as getPolyline} from '../../../scenario-editor/utils/valhalla'
import {getTableById} from '../../util/gtfs'
import {stopToGeoJSONPoint,
  constructStop,
  controlPointsFromSegments,
  newControlPoint,
  stopToPatternStop,
  recalculateShape,
  getPatternEndPoint,
  street,
  stopToPoint,
  constructPoint
} from '../../util/map'
import type {ControlPoint, Coordinates, GtfsLocation, GtfsStop, LatLng, Pattern, PatternStop, StopControlPoint} from '../../../types'
import type {dispatchFn, getStateFn} from '../../../types/reducers'
import { mergePatternHalts, mergePatternHaltsOfPattern } from '../../../gtfs/util'
import { patternHaltIsLocation, patternHaltIsStopArea, patternHaltIsStop } from '../../util/location'

/**
 * Creates a new stop at click location (leaflet latlng) and extends the pattern
 * geometry to the new stop location.
 */
export function addStopAtPoint (
  latlng: LatLng,
  addToPattern: boolean = false,
  index: ?number,
  activePattern: Pattern
) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    // create stop
    return constructStop(latlng)
      .then(stop => dispatch(newGtfsEntity(null, 'stop', stop, true, false))
        .then(newStop => {
          if (addToPattern && newStop) {
            // Add stop to end of pattern
            return dispatch(addStopToPattern(activePattern, newStop, index))
              .then(result => newStop)
          }
          return newStop
        }))
  }
}

/**
 * Adds values in range to array. Used to help add elements to controlPoints array
 */
const addRangeToArray = (array: Array<number>, startIndex: number, lengthToAdd: number): Array<number> => {
  for (let i = 0; i < lengthToAdd; i++) { array.push(startIndex + i) }
  return array
}

/**
 * Creates new stops at intersections according to edit settings (e.g., distance
 * from intersection, whether it should be on the near or far side of the
 * intersection, etc.) and extends the pattern geometry through the stops.
 *
 * FIXME for the SQL editor version
 */
export function addStopAtIntersection (
  latlng: LatLng,
  activePattern: Pattern,
  controlPoints?: Array<ControlPoint>
) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const endPoint = getPatternEndPoint(activePattern, controlPoints)
    street(endPoint, latlng)
      .then(json => {
        if (json) {
          const extension = [].concat.apply([], json.data.features.map(f => f.geometry.coordinates))
          const patternStops = [...activePattern.patternStops]
          // trim added coordinates from end of existing pattern shape to end of extension
          const last = json.data.features[json.data.features.length - 1]
          const start = constructPoint(endPoint)
          const end = constructPoint(last.geometry.coordinates[last.geometry.coordinates.length - 1])
          // TODO-lineSlice: refactor below code to not use lineSlice
          // the current code may have undesired results in cases where the shape overlaps itself
          const trimmed = lineSlice(
            start,
            end,
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: extension
              }
            }
          )
          const {
            afterIntersection,
            distanceFromIntersection,
            intersectionStep
          } = getState().editor.editSettings.present
          const shape = {
            type: 'LineString',
            coordinates: [
              ...activePattern.shape.coordinates,
              ...trimmed.geometry.coordinates
            ]
          }
          // $FlowFixMe
          dispatch(updateActiveGtfsEntity({
            component: 'trippattern',
            entity: activePattern,
            props: {shape}
          }))
          dispatch(saveActiveGtfsEntity('trippattern'))
          return Promise.all(json.data.features.map((feature, index) => {
            // create stops only at specified step
            if (index % intersectionStep !== 0) {
              return null
            }
            const toVertex = json.vertices.find(v => v.index === feature.properties.toVertex)
            // Skip vertex if not found. TODO: Check that this is the correct behavior.
            if (!toVertex) return null
            // skip vertex if no intersection exists
            if (toVertex.incidentStreets.length <= 2) {
              return null
            }
            // skip vertex if incidentStreets tags highway !== primary or secondary
            // else if (toVertex) {
            //
            // }

            // modify location according to distanceFromIntersection and before/after
            const start = afterIntersection
              ? constructPoint(feature.geometry.coordinates[feature.geometry.coordinates.length - 1])
              : constructPoint(shape.coordinates[0])
            const end = afterIntersection
              ? constructPoint(shape.coordinates[shape.coordinates.length - 1])
              : constructPoint(feature.geometry.coordinates[feature.geometry.coordinates.length - 1])
            // TODO-lineSlice: refactor below code to use only relevant section of shape with lineSlice
            // the current code may have undesired results in cases where the shape overlaps itself
            const lineFromPoint = lineSlice(start, end, {type: 'Feature', geometry: shape})
            const stopLocation = along(lineFromPoint, distanceFromIntersection / 1000, {units: 'kilometers'})
            const latlng = ll.toLeaflet(stopLocation.geometry.coordinates)
            // const {afterIntersection, intersectionStep, distanceFromIntersection} = getState().editor.editSettings.present
            return dispatch(addStopAtPoint(latlng, false, patternStops.length, activePattern))
          }))
            .then(stops => {
              stops.map(s => {
                // add new stop to array
                if (s) {
                  // FIXME: Update shape dist traveled
                  patternStops.push(stopToPatternStop(s))
                }
              })
              // update and save all new stops to pattern
              dispatch(updatePatternStops(activePattern, patternStops))
              return dispatch(saveActiveGtfsEntity('trippattern'))
            })
        }
      })
  }
}

/**
 * Creates new stops at the desired distance interval and extends to pattern
 * geometry to the stop location.
 */
export function addStopAtInterval (latlng: LatLng, activePattern: Pattern, controlPoints: Array<ControlPoint>) {
  return function (dispatch: dispatchFn, getState: getStateFn) {
    const {editSettings} = getState().editor
    if (activePattern.patternStops.length === 0) {
      // Create first stop at click location if no pattern stops exist
      return dispatch(addStopAtPoint(latlng, true, 0, activePattern))
    } else {
      // Extend pattern to point
      const patternStops = [...activePattern.patternStops]
      const endPoint = getPatternEndPoint(activePattern, controlPoints)
      dispatch(extendPatternToPoint(activePattern, endPoint, latlng, null, editSettings.present.stopInterval))
        .then(result => {
          const newStopLatLngs = []
          // Iterate over newly added controlPoints and create stops for each.
          for (let i = controlPoints.length; i < result.controlPoints.length; i++) {
            const controlPoint = result.controlPoints[i]
            const stopLatlng = ll.toLeaflet(controlPoint.point.geometry.coordinates)
            newStopLatLngs.push(stopLatlng)
          }
          // Create new stops at the interval points.
          return Promise.all(newStopLatLngs.map((latlng, i) => dispatch(
            addStopAtPoint(latlng, false, patternStops.length + i, activePattern))
          ))
            .then(newStops => {
              newStops.forEach((s, index) => {
                // Add new stop to pattern stops list
                if (s) {
                  const stopControlPoint = result.controlPoints[controlPoints.length + index]
                  const patternStop = stopToPatternStop(s)
                  // Set pattern stop's shape dist traveled.
                  if (patternHaltIsStop(patternStop)) {
                    // $FlowFixMe flow doesn't recognize the type check
                    patternStop.shapeDistTraveled = stopControlPoint.distance
                  }
                  patternStops.push(patternStop)
                  // Update stop properties on new control points.
                  stopControlPoint.pointType = POINT_TYPE.STOP
                  stopControlPoint.stopId = s.stop_id
                }
              })
              console.log('updated control points', result)
              dispatch(updatePatternGeometry(result))
              dispatch(updatePatternStops(activePattern, patternStops))
              return dispatch(saveActiveGtfsEntity('trippattern'))
            })
            // TODO: switch to adding multiple stops per action (Java controller and action promise need updating)
            // const newStops = await this.addStopsAtPoints(newStopLatLngs)
            // // add new stop to array
            // patternStops = [...patternStops, ...newStops.map(s => stopToPatternStop(s))]
        })
    }
  }
}

export function addStopToPattern (pattern: Pattern, stop: GtfsStop | GtfsLocation, index?: ?number) {
  // eslint-disable-next-line complexity
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const {data, editSettings} = getState().editor
    const {avoidMotorways, followStreets} = editSettings.present
    const {
      patternStopAreas: currentPatternStopAreas,
      patternLocations: currentPatternLocations,
      patternStops: currentPatternStops,
      shapePoints
    } = pattern
    const patternLocations = clone(currentPatternLocations)
    const patternStopAreas = clone(currentPatternStopAreas)
    const patternStops = clone(currentPatternStops)
    const {controlPoints, patternSegments} = getControlPoints(getState())
    const hasShapePoints = shapePoints && shapePoints.length > 1
    let patternHalts = mergePatternHalts(patternStops, patternLocations, patternStopAreas)
    const newStop = stopToPatternStop(
      stop,
      (typeof index === 'undefined' || index === null)
        ? patternHalts.length
        : index
    )

    if (patternHaltIsStop(newStop)) {
      patternStops.push(patternHaltIsStop(newStop))
      pattern.shapeId = generateUID()
    }
    if (patternHaltIsStopArea(newStop)) patternStopAreas.push(patternHaltIsStopArea(newStop))
    if (patternHaltIsLocation(newStop)) patternLocations.push(patternHaltIsLocation(newStop))

    if (typeof index === 'undefined' || index === null || index === patternHalts.length) {
      // Checking for stop_lat and stop_lon is how we check if we are dealing with
      // a stop or a location
      if (hasShapePoints && !!stop.stop_lat && !!stop.stop_lon) {
        // Push pattern stop to cloned list.
        patternHalts = mergePatternHalts(patternStops, patternLocations, patternStopAreas)

        // console.log('extending pattern to new stop', stop)
        // If a pattern shape already exists, extend it from the current end
        // point to the new stop.
        const {shapePtLon, shapePtLat} = shapePoints[shapePoints.length - 1]
        const currentEndPoint = ll.toLeaflet([shapePtLon, shapePtLat])
        const {stop_lon: lng, stop_lat: lat} = stop
        // Extend pattern to the new point.
        return dispatch(extendPatternToPoint(pattern, currentEndPoint, {lng, lat}, stop))
          .then(result => {
            // Update pattern stops and pattern geometry together. This ensures
            // that a recalcuation of the control points / pattern segments does
            // not cause issues when the pattern stops quantity does not match
            // the control points. TODO: add optional pattern stops to update pattern
            // geometry, so that these are more closely bound.
            dispatch(updatePatternStops(pattern, patternHalts))
            dispatch(updatePatternGeometry(result))
            return dispatch(saveActiveGtfsEntity('trippattern'))
          })
      } else {
        // Push pattern location to cloned list.
        patternHalts = mergePatternHalts(patternStops, patternLocations, patternStopAreas)

        dispatch(updatePatternStops(pattern, patternHalts))
        // Only a stop should be checked, not a location
        // Otherwise, check if a shape ought to be created. Then, save.
        if (patternHalts.length === 2 && followStreets && !!stop.stop_lon && !!stop.stop_lat &&
          // FLEX TODO: How to do this for locations?
          // This duplicated check doesn't appear to make much sense, but since there are two places
          // this method is called from, each of which provides a different stop object.
          (stop.hasOwnProperty('stop_id') || stop.hasOwnProperty('stopId'))
        ) {
          // Create shape between stops the added stop is the second one and
          // followStreets is enabled. Otherwise, there is no need to create a
          // new shape because it would just be a straight line segment anyways.
          const previousStopId = patternStops[patternStops.length - 2].stopId
          const stops = getTableById(data.tables, 'stop')
          const previousStop = stops.find(s => s.stop_id === previousStopId)
          if (!previousStop) {
            throw new Error(`Stop not found for stop_id ${previousStopId}.`)
          }
          const points = [previousStop, stop]
            .map((stop, index) => ({lng: stop.stop_lon, lat: stop.stop_lat}))
          const patternSegments = await getPolyline(points, true, avoidMotorways)
          // Update pattern stops and geometry.
          const controlPoints = controlPointsFromSegments(patternStops, patternSegments)
          dispatch(updatePatternGeometry({controlPoints, patternSegments}))
        }
        // Finally, save the updated pattern.
        return dispatch(saveActiveGtfsEntity('trippattern'))
      }
    } else if (index && index > 0) {
      // If adding stop in middle, splice the stop into the array.
      patternHalts.splice(index, 0, newStop)
      dispatch(updatePatternStops(pattern, patternHalts))
      // Checking for stop_id ensures we are dealing with a stop and not a location
      if (hasShapePoints && !!stop.stop_id) {
        // Update shape if it exists. No need to update anything besides pattern
        // stops (which already occurred above) if there is no shape. NOTE: the
        // behavior in this code block essentially replaces any
        // non-stop control points in the "from" segment with the new pattern stop and re-routes the
        // shape between it and the new stop.
        // Non-stop control points are preserved in the new "to" segment.
        //     ↙️ "from" segment      ↙️ "to" segment
        //  0 ——x——— 0 ——————————x———x——— 0
        //             ^— 0 —^ <--- new inserted stop

        // Add control point in order to copy of current list.
        const stopControlPoints = getControlPointsForStops(controlPoints)

        // Perform splice operation on cloned control points to remove any
        // control points between the previous and next stop control points and
        // insert new stop control point in their stead.
        const clonedControlPoints = clone(controlPoints)
        const clonedPatternSegments = clone(patternSegments)

        // Insert the new stop after the previous stopControlPoint.
        // We assume that all control points hold for the "to" semgent (see above).
        const previousStopControlPoint = stopControlPoints[index - 1]
        const spliceIndex = previousStopControlPoint.cpIndex + 1
        const nextControlPoint = clonedControlPoints[spliceIndex]

        // Previously, at this point we had created our control point by projecting the stop onto the existing shape.
        // However, this created problems for insertions where the stop is geographically before the previous stop
        // but is being inserted after it in the stop sequence. We were projecting previously bc to create a control point
        // we need to know the distance along the shape, but to avoid the above issue we need to make a sub-request to graphhopper
        // to get the segment between the two points and from that, the distance.
        const insertPoint = stopToGeoJSONPoint(stop)
        const newFromSegmentCoords = [
          previousStopControlPoint.point.geometry.coordinates,
          [stop.stop_lon, stop.stop_lat]
        ]

        // We wrap more of the code in this try block because the pre-calculated "newFromSegment" can fail in the same way
        // as recalculate shape.
        let result
        try {
          const newFromSegment = await getSegment(newFromSegmentCoords, true)
          const segmentDistance = lineDistance(newFromSegment, 'meters')
          const addedControlPoint = newControlPoint(
            previousStopControlPoint.distance + segmentDistance,
            insertPoint,
            {
              stopId: stop.stop_id,
              pointType: POINT_TYPE.STOP // 2
            })
          // Instead of splicing at the previousStopControlPoint, splice immediately after.
          clonedControlPoints.splice(spliceIndex, 0, addedControlPoint)

          // Replace n segments with 2 segments to be replaced
          // with new routed segments.
          clonedPatternSegments.splice(
            previousStopControlPoint.cpIndex,
            1,
            [previousStopControlPoint.point.geometry.coordinates, insertPoint.geometry.coordinates],
            [insertPoint.geometry.coordinates, nextControlPoint.point.geometry.coordinates]
          )

          // TODO: Because we are pre-generating the from segment above, we could use that in the final recalculated shape.
          // Right now, bc of the legacy method we are repeating that small amount of work.
          result = await recalculateShape({
            avoidMotorways,
            controlPoints: clonedControlPoints,
            defaultToStraightLine: false,
            editType: 'update',
            followStreets,
            index: spliceIndex,
            newPoint: {lng: stop.stop_lon, lat: stop.stop_lat},
            snapControlPointToNewSegment: true,
            patternCoordinates: clonedPatternSegments
          })
        } catch (err) {
          console.log(err)
          dispatch(setErrorMessage({message: `Could not add stop to pattern: ${err}`}))
          return
        }
        // Update pattern geometry
        dispatch(updatePatternGeometry({
          controlPoints: result.updatedControlPoints,
          patternSegments: result.coordinates
        }))
      }
      return dispatch(saveActiveGtfsEntity('trippattern'))
    } else {
      // Handle adding stop to beginning of pattern.
      patternHalts.splice(0, 0, newStop)
      dispatch(updatePatternStops(pattern, patternHalts))
      // Checking for stop_id ensures we don't process locations
      if (hasShapePoints && !!stop.stop_id) {
        // Update shape if coordinates already exist.
        const clonedControlPoints = clone(controlPoints)
        const controlPoint = newControlPoint(0, stopToPoint(stop), {
          stopId: stop.stop_id,
          pointType: POINT_TYPE.STOP // 2
        })
        clonedControlPoints.splice(index, 0, controlPoint)
        // Recalculate shape
        let result
        const clonedPatternSegments = clone(patternSegments)
        // Add blank "placeholder" segment to be replaced with new segment
        clonedPatternSegments.splice(0, 0, [])
        try {
          result = await recalculateShape({
            avoidMotorways: avoidMotorways,
            controlPoints: clonedControlPoints,
            defaultToStraightLine: false,
            editType: 'update',
            followStreets,
            index,
            newPoint: {lng: stop.stop_lon, lat: stop.stop_lat},
            snapControlPointToNewSegment: true,
            patternCoordinates: clonedPatternSegments
          })
        } catch (err) {
          console.log(err)
          dispatch(setErrorMessage({message: `Could not add stop to pattern: ${err}`}))
          return
        }
        // Update pattern geometry
        dispatch(updatePatternGeometry({
          controlPoints: result.updatedControlPoints,
          patternSegments: result.coordinates
        }))
      }
      return dispatch(saveActiveGtfsEntity('trippattern'))
    }
  }
}

/**
 * Extends shape of input pattern from specified end point to new end point,
 * optionally following streets if the setting is enabled.
 *
 * TODO: Refactor to use recalculate shape?
 */
function extendPatternToPoint (pattern, endPoint, newEndPoint, stop = null, splitInterval = 0) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const {avoidMotorways, followStreets} = getState().editor.editSettings.present
    const {controlPoints, patternSegments} = getControlPoints(getState())
    const clonedControlPoints = clone(controlPoints)
    let newShape
    if (followStreets) {
      newShape = await getPolyline([endPoint, newEndPoint], false, avoidMotorways)
    }
    if (!newShape) {
      // Get single coordinate for straight line if polyline fails or if not
      // following streets.
      newShape = [ll.toCoordinates(endPoint), ll.toCoordinates(newEndPoint)]
    }
    const initialDistance = pattern.shape
      ? lineDistance(pattern.shape, 'meters')
      : 0
    const newLineSegment = lineString(newShape)
    const distanceAdded = lineDistance(newLineSegment, 'meters')
    const newPatternSegments = [...patternSegments]
    if (splitInterval > 0) {
      // If split interval is provided (e.g., to add stops at intervals along
      // new segment), split new line segment and add temp control points (later
      // to be assigned stop IDs).
      const numIntervals = Math.floor(distanceAdded / splitInterval)
      let previousDistance = 0
      // Iterate over intervals and store positions for constructing stops
      for (let i = 1; i <= numIntervals; i++) {
        const splitDistance = (i * splitInterval)
        // Default unit for lineSliceAlong is km (meters not supported).
        // console.log(`slicing line from ${previousDistance} m to ${splitDistance} m.`, newLineSegment)
        const slicedSegment = lineSliceAlong(newLineSegment, previousDistance / 1000, splitDistance / 1000)
        const newCoords = slicedSegment.geometry.coordinates
        // Push new coordinates to updated pattern segments
        newPatternSegments.push(newCoords)
        // Add stops along new line segment at distance (initial dist +
        // stopInterval)
        const endPoint = point(newCoords[newCoords.length - 1])
        const controlPoint = {
          id: generateUID(),
          point: endPoint,
          // If control points are to become stops, point type and stop ID must
          // be added later (e.g., in addStopAtInterval).
          pointType: POINT_TYPE.ANCHOR,
          distance: initialDistance + splitDistance
        }
        // $FlowFixMe
        clonedControlPoints.push(controlPoint)
        // Update previous distance
        previousDistance = splitDistance
      }
    } else {
      // If not splitting segment, simply add new shape coordinates.
      newPatternSegments.push(newShape)
    }
    if (stop) {
      // If extending to a stop, add control point for stop.
      if (splitInterval > 0) {
        throw new Error('The stop argument should not be provided in conjunction with a split interval. This will result in redundant control points.')
      }
      const snappedPoint = point(newShape[newShape.length - 1])
      const controlPoint = {
        id: generateUID(),
        point: snappedPoint, // point(ll.toCoordinates(newEndPoint)),
        pointType: POINT_TYPE.STOP,
        distance: initialDistance + distanceAdded,
        stopId: stop.stop_id
      }
      // $FlowFixMe
      clonedControlPoints.push(controlPoint)
    }
    // Return updated pattern geometry and control points
    return {
      controlPoints: clonedControlPoints,
      patternSegments: newPatternSegments
    }
  }
}

export function removeStopFromPattern (pattern: Pattern, stop: GtfsLocation | GtfsStop, index: number) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const {controlPoints, patternSegments} = getControlPoints(getState())
    const clonedControlPoints = clone(controlPoints)
    const clonedPatternSegments = clone(patternSegments)
    const {shapePoints} = pattern
    const patternHalts = mergePatternHaltsOfPattern(pattern)
    const stopIsStop = stop.hasOwnProperty('stopId')
    // Use control points to determine control point index for removed stop.
    // This is distinct from the index arg supplied because there may be more
    // control points than pattern stops, causing a mismatch in the indexes.
    const stopControlPoints = controlPoints
      // TODO: refactor into shared function (see pattern-debug-lines.js)
      .map((cp, index) => ({...cp, cpIndex: index}))
      .filter(cp => cp.pointType === POINT_TYPE.STOP)
    const {cpIndex} = stopIsStop ? stopControlPoints[index] : {cpIndex: -1}
    stopIsStop && console.log(`deleting control point at index ${cpIndex}`)
    if (!shapePoints || shapePoints.length === 0) {
      // If pattern has no shape points, don't attempt to refactor pattern shape
      console.log('pattern coordinates do not exist')
    } else if (stopIsStop) {
      patternHalts.splice(index, 1)
    } else {
      const {avoidMotorways, followStreets} = getState().editor.editSettings.present
      let result
      try {
        // $FlowFixMe: Flow does not recognize controlpoints within returned Promise type
        result = await recalculateShape({
          avoidMotorways,
          controlPoints: clonedControlPoints,
          editType: 'delete',
          index: cpIndex,
          followStreets,
          patternCoordinates: clonedPatternSegments
        })
      } catch (err) {
        console.log(err)
        dispatch(setErrorMessage({message: `Could not remove stop from pattern: ${err}`}))
        return
      }
      if (!result.coordinates) {
        // Last stop was removed?, set coordinates to null.
        console.warn('Coordinates from recalculating shape are null.')
        dispatch(setErrorMessage({message: `Could not remove stop from pattern:`}))
        return
      }
      patternHalts.splice(index, 1)
      // Update the shape_dist_traveled values if we're removing the first stop (no control point will be left in this case)
      // $FlowFixMe flow doesn't understand our type check
      if (index === 0) updateShapeDistTraveled(result.updatedControlPoints, result.coordinates, patternHalts)

      // Update pattern geometry
      dispatch(updatePatternGeometry({
        controlPoints: result.updatedControlPoints,
        patternSegments: result.coordinates
      }))
    }
    // Update pattern stops (whether or not geometry exists)
    patternHalts.splice(index, 1)
    dispatch(updatePatternStops(pattern, patternHalts))
    dispatch(saveActiveGtfsEntity('trippattern'))
  }
}

/**
 * Based on the provided starting point for deletion and the number of segments until we hit another stop,
 * this function calculates the number of control points and adds the control points and segments to the array
 * for later deletion.
 */
const updateControlPointsAndSegments = (deletedControlPoints: Array<number>, deletedSegments: Array<number>, deletionStartIndex: number, numberSegments: number): Array<Array<number>> => {
  // Each control point creates 2 segments, so you have one less control point than segments.
  const numberControlPoints = numberSegments - 1
  // Add control points and segments to the list to delete and return
  return [
    addRangeToArray(deletedControlPoints, deletionStartIndex + 1, numberControlPoints), // Add one for immediate next control point.
    addRangeToArray(deletedSegments, deletionStartIndex, numberSegments)
  ]
}

/**
 * Generates a new segment for the fromPoint and toPoint and inserts it into the new patternSegments array.
 */
const generateSegmentAndInsert = async (segments: Array<Coordinates>, fromPoint: ?ControlPoint, toPoint: ?ControlPoint, insertionPoint: number): Promise<any> => {
  if (!fromPoint || !toPoint) return
  const clonedSegments = clone(segments)
  const points = [fromPoint.point.geometry.coordinates, toPoint.point.geometry.coordinates]
  const segment = await getSegment(points, true)
  if (segment && segment.coordinates) clonedSegments.splice(insertionPoint, 0, segment.coordinates)
  return clonedSegments
}

/**
 * Updates the shape_dist_traveled values for each control point after a change in the pattern has occurred.
 * These values must also be updated in the patternStops which will be used to create the shapeDistTraveled
 * values in stop_times.txt
 */
export const updateShapeDistTraveled = (controlPoints: Array<ControlPoint | null>, segments: Array<Coordinate>, patternStops: Array<PatternStop>): void => {
  // $FlowFixMe
  const stopControlPoints = getControlPointsForStops(controlPoints)

  let newShapeDistTraveled = 0.0
  const unusedPatternStops = [...patternStops]
  stopControlPoints.forEach((cp, index) => {
    const {stopId, cpIndex} = cp
    if (index !== 0) {
      // previous cp.shape_dist_traveled + all segment distances between
      const previousStopCP = stopControlPoints[index - 1]
      // $FlowFixMe
      newShapeDistTraveled = controlPoints[previousStopCP.cpIndex].shapeDistTraveled
      for (let i = previousStopCP.cpIndex; i < cpIndex; i++) {
        const segmentDistance = lineDistance(lineString(segments[i]), 'meters')
        newShapeDistTraveled += segmentDistance
      }
    }
    // $FlowFixMe
    controlPoints[cpIndex].shapeDistTraveled = newShapeDistTraveled
    // $FlowFixMe . FIXME: distance should be equal to the shapeDistTraveled for a stop... it was slightly different before.
    controlPoints[cpIndex].distance = newShapeDistTraveled

    const patternStopIdx = unusedPatternStops.findIndex(el => el && el.stopId === stopId)
    if (patternStopIdx !== -1) {
      patternStops[patternStopIdx].shapeDistTraveled = newShapeDistTraveled
      // "Erase" that pattern stop, without changing order,
      // so that it doesn't get used again if a pattern visits a stop multiple times.
      unusedPatternStops[patternStopIdx] = null
    }
  })
}

/**
 *  Method to remove old segments and control points and backfill with new segment between stops on either side.
 *  TODO: Refactor this method to make things cleaner.
 */
const removeOldSegments = (
  previousFromStopControlPoint: ?StopControlPoint,
  previousToStopControlPoint: ?StopControlPoint,
  deletedSegments: Array<number>,
  deletedControlPoints: Array<number>,
  stopControlPoints: Array<StopControlPoint>,
  movedFromStart: boolean,
  movedFromEnd: boolean,
  movedStopControlPoint: StopControlPoint,
  oldPatternStopSequence: number
) => {
  //  O --X---> OLD POSITION --X--> O
  //  O --------------------------> O
  if (!movedFromEnd) {
    // Delete old "to" segment control points and segments, no "to" segment if we're moving from the end
    // $FlowFixMe
    const previousToSegments = previousToStopControlPoint.cpIndex - movedStopControlPoint.cpIndex; // Semi-colon for babel parsing.
    [deletedControlPoints, deletedSegments] = updateControlPointsAndSegments(deletedControlPoints, deletedSegments, movedStopControlPoint.cpIndex, previousToSegments)
  }

  if (!movedFromStart) {
    // Delete old "from" segment control points and segments, no "from" segment if we're moving from the start
    // $FlowFixMe
    const previousFromSegments = movedStopControlPoint.cpIndex - previousFromStopControlPoint.cpIndex; // Semi-colon for babel parsing.
    // $FlowFixMe
    [deletedControlPoints, deletedSegments] = updateControlPointsAndSegments(deletedControlPoints, deletedSegments, previousFromStopControlPoint.cpIndex, previousFromSegments)
  }

  return [deletedControlPoints, deletedSegments]
}

/**
 *  Method to remove a segment and insert a new one that points to the new stop that is being inserted.
 *  TODO: Refactor this method to make things cleaner.
 */
const removeNewSegments = (
  deletedControlPoints: Array<number>,
  deletedSegments: Array<number>,
  movedForward: boolean,
  movedToEnd: boolean,
  movedToStart: boolean,
  newPatternStopSequence: number,
  newToStopControlPoint: StopControlPoint,
  stopControlPoints: Array<StopControlPoint>
) => {
  // The segment that we remove depends on if we are moving forwards or backwards (see diagram). If we're moving forwards we need to modify the old "to" segment, if we're moving backwards the "from" segment.
  // Case: moving backward                Case: moving forward
  //  0 --x--> 0 ------> 0 -------> 0     0 -----> 0 ------> 0 ---x---> 0
  //        ↑←←←←←←←←←←←←←←←←←←←←←← 0     0 →→→→→→→→→→→→→→→→→→→↑
  // We need to initialize newToStopControlPoint to their default values if the first check fails (they are still used later if we move to start or end)
  if (!movedToStart && !movedToEnd) { // When you moved to the start or end, there's no previous segment to remove, only one to add.
    let newSegmentsFromStop // This may differ from the fromStopControlPoint defined earlier because of the backwards and forwards cases for new segment deletion.
    if (movedForward) {
      newSegmentsFromStop = stopControlPoints[newPatternStopSequence + 1]
      const numberNewSegments = newToStopControlPoint.cpIndex - newSegmentsFromStop.cpIndex; // Semi colon for babel parsing.
      [deletedControlPoints, deletedSegments] = updateControlPointsAndSegments(deletedControlPoints, deletedSegments, newSegmentsFromStop.cpIndex, numberNewSegments)
    } else { // moved backward
      newSegmentsFromStop = stopControlPoints[newPatternStopSequence - 1]
      const numberNewSegments = newToStopControlPoint.cpIndex - newSegmentsFromStop.cpIndex;
      [deletedControlPoints, deletedSegments] = updateControlPointsAndSegments(deletedControlPoints, deletedSegments, newSegmentsFromStop.cpIndex, numberNewSegments)
    }
  }
  return [deletedControlPoints, deletedSegments]
}

/**
 *  Method to insert the new segment replacing the segments in the "old" position, the new from segment, and the new to segment if they require insertion.
 */
const insertSegments = async (
  clonedPatternSegments: Array<Coordinates>,
  insertionPoint: number,
  movedFromEnd: boolean,
  movedFromStart: boolean,
  movedStopControlPoint: StopControlPoint,
  movedToEnd: boolean,
  movedToStart: boolean,
  newFromStopControlPoint: StopControlPoint,
  newToStopControlPoint: StopControlPoint,
  previousFromStopControlPoint: StopControlPoint,
  previousToStopControlPoint: StopControlPoint
) => {
  // Insert the rearranged old segment, there is none if we moved from the start or the end
  if (!movedFromStart && !movedFromEnd && previousFromStopControlPoint) { // previousFromStopControlPoint check to make flow happy
    clonedPatternSegments = await generateSegmentAndInsert(clonedPatternSegments, previousFromStopControlPoint, previousToStopControlPoint, previousFromStopControlPoint.cpIndex)
  }
  // Insert the new from segment
  if (!movedToStart) {
    clonedPatternSegments = await generateSegmentAndInsert(clonedPatternSegments, newFromStopControlPoint, movedStopControlPoint, newFromStopControlPoint.cpIndex)
  }
  // Insert the new to segment
  if (!movedToEnd) {
    clonedPatternSegments = await generateSegmentAndInsert(clonedPatternSegments, movedStopControlPoint, newToStopControlPoint, insertionPoint)
  }
  // $FlowFixMe
  return clonedPatternSegments
}

/**
 * Updates the shapes (segments and control points) after the pattern has been reordered using the pattern stop card dragging feature.
 * This method will override several of the segments around the old location of the moved stop, and around
 * the new location where the stop is being moved to.
 */
export function updateShapesAfterPatternReorder (oldPattern: Pattern, newPatternStops: Array<PatternStop>, oldPatternStopSequence: number) {
  return async function (dispatch: dispatchFn, getState: getStateFn) {
    const {controlPoints, patternSegments} = getControlPoints(getState())

    // Use object copies of the arrays to preserve indices, we'll convert back after juggling deletions
    let clonedControlPoints = clone(controlPoints)
    let clonedPatternSegments = clone(patternSegments)

    const stopControlPoints = getControlPointsForStops(controlPoints)

    const newPatternStopSequence = newPatternStops.findIndex(pStop => pStop.stopSequence === oldPatternStopSequence)

    const movedFromStart = oldPatternStopSequence === 0
    const movedFromEnd = oldPatternStopSequence === newPatternStops.length - 1
    const movedToStart = newPatternStopSequence === 0
    const movedToEnd = newPatternStopSequence === newPatternStops.length - 1
    const movedForward = oldPatternStopSequence < newPatternStopSequence
    const movedAdjacent = Math.abs(newPatternStopSequence - oldPatternStopSequence)

    const movedStopControlPoint: StopControlPoint = stopControlPoints[oldPatternStopSequence]
    let deletedControlPoints: Array<number> = []
    let deletedSegments: Array<number> = []
    const previousFromStopControlPoint: StopControlPoint = stopControlPoints[oldPatternStopSequence - 1] // Null if moved from beginning
    const previousToStopControlPoint: StopControlPoint = stopControlPoints[oldPatternStopSequence + 1]
    // With the "new" segments in adjacent moves, we need to account for the from and to stops referencing themselves
    const newFromStopControlPoint: StopControlPoint = stopControlPoints[movedAdjacent && movedForward ? newPatternStopSequence : newPatternStopSequence - 1]
    const newToStopControlPoint: StopControlPoint = stopControlPoints[movedAdjacent && !movedForward ? newPatternStopSequence : newPatternStopSequence + 1]; // Semi-colon for babel parsing.

    // 1. Remove appropriate segments in the "old" position of the stop to move.
    [deletedControlPoints, deletedSegments] = removeOldSegments(
      previousFromStopControlPoint,
      previousToStopControlPoint,
      deletedSegments,
      deletedControlPoints,
      // $FlowFixMe
      stopControlPoints,
      movedFromStart,
      movedFromEnd,
      movedStopControlPoint,
      oldPatternStopSequence
    );

    // 2. Remove appropriate segments in the "new" position of the moved stop (i.e. the destination)
    [deletedControlPoints, deletedSegments] = removeNewSegments(
      deletedControlPoints,
      deletedSegments,
      movedForward,
      movedToEnd,
      movedToStart,
      newPatternStopSequence,
      newToStopControlPoint,
      // $FlowFixMe
      stopControlPoints
    )

    // 3. Set our cloned sets of control points and segments to null to avoid juggling array indices.
    // $FlowFixMe
    deletedControlPoints.forEach(deletedCPIndex => { clonedControlPoints[deletedCPIndex] = null })
    // $FlowFixMe
    deletedSegments.forEach(deletedSegmentIndex => { clonedPatternSegments[deletedSegmentIndex] = null })

    // 4. Insert appropriate segments at the new and old locations
    const insertionPoint = movedToStart ? 0 : newFromStopControlPoint.cpIndex + 1
    try {
      // Check things are defined for flow
      clonedPatternSegments = await insertSegments(
        clonedPatternSegments,
        insertionPoint,
        movedFromEnd,
        movedFromStart,
        movedStopControlPoint,
        movedToEnd,
        movedToStart,
        newFromStopControlPoint,
        newToStopControlPoint,
        previousFromStopControlPoint,
        previousToStopControlPoint
      )
    } catch (err) {
      console.log(err)
      // TODO: i18n this.
      dispatch(setErrorMessage({message: `Could not rearrange stops in pattern: ${err}`}))
      return
    }

    // 5. Insert the stop into the new position and then convert to array
    clonedControlPoints.splice(insertionPoint, 0, movedStopControlPoint)
    // $FlowFixMe
    if (movedForward) clonedControlPoints[movedStopControlPoint.cpIndex] = null
    // $FlowFixMe
    else clonedControlPoints[movedStopControlPoint.cpIndex + 1] = null // +1 to account for the spliced element added to the array.

    // 6. Remove any null entries from our array.
    clonedControlPoints = clonedControlPoints.filter(el => !!el)
    clonedPatternSegments = clonedPatternSegments.filter(el => !!el) // Cast type to allow filtering by flow.

    // 7. Update the control points with new shape_dist_traveled values
    // $FlowFixMe
    updateShapeDistTraveled(clonedControlPoints, clonedPatternSegments, newPatternStops)

    // 8. Update the pattern geometry and pattern stops to reflect changes.
    dispatch(updatePatternGeometry({
      controlPoints: clonedControlPoints,
      patternSegments: clonedPatternSegments
    }))

    // Update pattern stops with cloned copy of cards (from the reorder). NOTE: stop resequencing
    // is handled by updatePatternStops.
    // $FlowFixMe
    dispatch(updatePatternStops(oldPattern, newPatternStops))
    return dispatch(saveActiveGtfsEntity('trippattern'))
  }
}
