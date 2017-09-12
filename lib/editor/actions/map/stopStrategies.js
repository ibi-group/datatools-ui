import along from 'turf-along'
import ll from '@conveyal/lonlat'
import lineDistance from 'turf-line-distance'
import lineSlice from 'turf-line-slice'

import { updateActiveGtfsEntity, saveActiveGtfsEntity } from '../active'
import { newGtfsEntity } from '../editor'
import { setErrorMessage } from '../../../manager/actions/status'
import { extendPatternToPoint } from '../map'
import {getSegment} from '../../../scenario-editor/utils/valhalla'
import { constructStop, stopToStopTime, handlePatternEdit, getPatternEndPoint, street, constructPoint } from '../../util/map'
import { stopToGtfs } from '../../util/objects'

function addingStopToPattern (pattern, stop, index) {
  return {
    type: 'ADDING_STOP_TO_PATTERN',
    pattern,
    stop,
    index
  }
}

export function addStopAtPoint (latlng, addToPattern = false, index, activePattern) {
  return function (dispatch, getState) {
    // create stop
    return constructStop(latlng, activePattern.feedId)
    .then(stop => dispatch(newGtfsEntity(activePattern.feedId, 'stop', stop, true))
      .then(s => {
        const gtfsStop = stopToGtfs(s)
        // add stop to end of pattern
        if (addToPattern && gtfsStop) {
          return dispatch(addStopToPattern(activePattern, gtfsStop, index))
          .then(result => gtfsStop)
        }
        return gtfsStop
      }))
  }
}

export function addStopAtIntersection (latlng, activePattern) {
  return async function (dispatch, getState) {
    const endPoint = getPatternEndPoint(activePattern)
    street(endPoint, latlng)
    .then(json => {
      if (json) {
        const extension = [].concat.apply([], json.data.features.map(f => f.geometry.coordinates))
        const patternStops = [...activePattern.patternStops]
        // trim added coordinates from end of existing pattern shape to end of extension
        const last = json.data.features[json.data.features.length - 1]
        const start = constructPoint(endPoint)
        const end = constructPoint(last.geometry.coordinates[last.geometry.coordinates.length - 1])
        const trimmed = lineSlice(start, end, {type: 'Feature', geometry: {type: 'LineString', coordinates: extension}})
        const { afterIntersection, intersectionStep, distanceFromIntersection } = getState().editor.editSettings
        const shape = {type: 'LineString', coordinates: [...activePattern.shape.coordinates, ...trimmed.geometry.coordinates]}
        dispatch(updateActiveGtfsEntity(activePattern, 'trippattern', {shape}))
        dispatch(saveActiveGtfsEntity('trippattern'))
        return Promise.all(json.data.features.map((feature, index) => {
          // create stops only at specified step
          if (index % intersectionStep !== 0) {
            return null
          }
          const toVertex = json.vertices.find(v => v.index === feature.properties.toVertex)
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
          const lineFromPoint = lineSlice(start, end, {type: 'Feature', geometry: shape})
          const stopLocation = along(lineFromPoint, distanceFromIntersection / 1000, 'kilometers')
          const latlng = ll.toLeaflet(stopLocation.geometry.coordinates)
          // const {afterIntersection, intersectionStep, distanceFromIntersection} = getState().editor.editSettings
          return dispatch(addStopAtPoint(latlng, false, patternStops.length, activePattern))
        }))
        .then(stops => {
          stops.map(s => {
            // add new stop to array
            if (s) {
              patternStops.push(stopToStopTime(s))
            }
          })
          // update and save all new stops to pattern
          dispatch(updateActiveGtfsEntity(getState().editor.data.active.subEntity, 'trippattern', {patternStops}))
          return dispatch(saveActiveGtfsEntity('trippattern'))
        })
      }
    })
  }
}

export function addStopAtInterval (latlng, activePattern) {
  return function (dispatch, getState) {
    // create first stop if none exist
    if (activePattern.patternStops.length === 0) {
      return dispatch(addStopAtPoint(latlng, true, activePattern))
    } else {
      const patternStops = [...activePattern.patternStops]
      const initialDistance = lineDistance(activePattern.shape, 'meters')

      // extend pattern to click point
      const endPoint = getPatternEndPoint(activePattern)
      dispatch(extendPatternToPoint(activePattern, endPoint, latlng))
      .then(updatedShape => {
        const totalDistance = lineDistance(updatedShape, 'meters')
        const distanceAdded = totalDistance - initialDistance
        const numIntervals = Math.floor(distanceAdded / getState().editor.editSettings.stopInterval)
        const latlngList = []
        for (var i = 1; i <= numIntervals; i++) {
          const stopDistance = initialDistance + (i * getState().editor.editSettings.stopInterval)

          // add stops along shape at interval (stopInterval)
          const position = along(updatedShape, stopDistance, 'meters')
          const stopLatlng = ll.toLeaflet(position.geometry.coordinates)
          latlngList.push(stopLatlng)
        }
        return Promise.all(latlngList.map(latlng => {
          // pass patternStops.length as index to ensure pattern not extended to locaton
          return dispatch(addStopAtPoint(latlng, false, patternStops.length, activePattern))
        }))
        .then(stops => {
          stops.map(s => {
            // add new stop to array
            if (s) {
              patternStops.push(stopToStopTime(s))
            }
          })
          dispatch(updateActiveGtfsEntity(getState().editor.data.active.subEntity, 'trippattern', {patternStops}))
          return dispatch(saveActiveGtfsEntity('trippattern'))
        })
        // TODO: switch to adding multiple stops per action (Java controller and action promise need updating)
        // const newStops = await this.addStopsAtPoints(latlngList)
        // // add new stop to array
        // patternStops = [...patternStops, ...newStops.map(s => stopToStopTime(s))]
      })
    }
  }
}

export function addStopToPattern (pattern, stop, index) {
  return function (dispatch, getState) {
    dispatch(addingStopToPattern(pattern, stop, index))
    const patternStops = [...pattern.patternStops]
    const coordinates = pattern.shape && pattern.shape.coordinates
    const newStop = stopToStopTime(stop)

    // if adding stop to end, also a proxy for extending pattern to point
    if (typeof index === 'undefined' || index === null) {
      // if shape coordinates already exist, just extend them
      if (coordinates) {
        const endPoint = ll.toLeaflet(coordinates[coordinates.length - 1])
        patternStops.push(newStop)
        dispatch(updateActiveGtfsEntity(pattern, 'trippattern', {patternStops}))
        // saveActiveGtfsEntity('trippattern')
        const {stop_lon: lng, stop_lat: lat} = stop
        return dispatch(extendPatternToPoint(pattern, endPoint, {lng, lat}))
      } else {
        // if shape coordinates do not exist, add pattern stop and get shape between stops (if multiple stops exist)
        patternStops.push(newStop)
        if (patternStops.length > 1) {
          const previousStop = getState().editor.data.tables.stop.find(s => s.id === patternStops[patternStops.length - 2].stopId)
          console.log(previousStop)
          return getSegment([[previousStop.stop_lon, previousStop.stop_lat], [stop.stop_lon, stop.stop_lat]], getState().editor.editSettings.followStreets)
          .then(geojson => {
            dispatch(updateActiveGtfsEntity(pattern, 'trippattern', {patternStops: patternStops, shape: {type: 'LineString', coordinates: geojson.coordinates}}))
            return dispatch(saveActiveGtfsEntity('trippattern'))
          })
        } else {
          // if only a single stop in the pattern, no need to draw a shape of any kind
          dispatch(updateActiveGtfsEntity(pattern, 'trippattern', {patternStops: patternStops}))
          return dispatch(saveActiveGtfsEntity('trippattern'))
        }
      }
      // TODO: construct shape if not following roads
      // updateActiveGtfsEntity(pattern, 'trippattern', {patternStops: patternStops, shape: {type: 'LineString', coordinates: coordinates}})
    } else {
      // if adding stop in middle
      patternStops.splice(index, 0, newStop)
      dispatch(updateActiveGtfsEntity(pattern, 'trippattern', {patternStops: patternStops}))
      return dispatch(saveActiveGtfsEntity('trippattern'))
    }
    // TODO: add strategy for stop at beginning
  }
}

function removingStopFromPattern (pattern, stop, index, controlPoints) {
  return {
    type: 'REMOVING_STOP_FROM_PATTERN',
    pattern,
    stop,
    index,
    controlPoints
  }
}

export function removeStopFromPattern (pattern, stop, index, controlPoints) {
  return async function (dispatch, getState) {
    dispatch(removingStopFromPattern(pattern, stop, index, controlPoints))

    // TODO: move controlPoints to selector?
    if (!controlPoints) {
      controlPoints = getState().editor.editSettings.controlPoints && getState().editor.editSettings.controlPoints.length
        ? getState().editor.editSettings.controlPoints[getState().editor.editSettings.controlPoints.length - 1]
        : []
    }
    try {
      let shape
      // if pattern shape is null, don't attempt to refactor pattern shape
      if (!pattern.shape) {
        shape = null
      } else {
        // else, reconstruct pattern shape to splice line segment
        const cpIndex = controlPoints.findIndex(cp => cp.stopId === stop.id)
        // if not the first stop, use the previous control point as beginning of slice
        const begin = controlPoints[cpIndex - 2] ? controlPoints[cpIndex - 1].point : null
        // if not last stop, use previous control point as end of slice
        const end = controlPoints[cpIndex + 2] ? controlPoints[cpIndex + 1].point : null
        const {followStreets, patternCoordinates} = getState().editor.editSettings
        const coordinates = await handlePatternEdit(null, begin, end, pattern, followStreets, patternCoordinates)
        shape = {type: 'LineString', coordinates}
      }
      const patternStops = [...pattern.patternStops]
      patternStops.splice(index, 1)
      dispatch(updateActiveGtfsEntity(pattern, 'trippattern', {patternStops, shape}))
      dispatch(saveActiveGtfsEntity('trippattern'))
    } catch (err) {
      console.log(err)
      dispatch(setErrorMessage(`Could not remove pattern from stop: ${err}`))
    }
  }
}

// async function addStopsAtPoints (latlngList) {
//   return async function (dispatch, getState) {
//     const stops = []
//     for (var i = 0; i < latlngList.length; i++) {
//       const stop = await constructStop(latlngList[i], this.props.feedSource.id)
//       stops.push(stop)
//     }
//     const newStops = await dispatch(newGtfsEntities(this.props.feedSource.id, 'stop', stops, true))
//     return newStops.map(s => stopToGtfs(s))
//   }
// }
