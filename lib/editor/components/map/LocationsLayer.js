// @flow

import * as L from 'leaflet'
import clone from 'lodash/cloneDeep'
// $FlowFixMe outdated flow doesn't know about hooks
import React, { useState, useEffect } from 'react'
import { EditControlFeatureGroup } from '@andrewdodd/react-leaflet-draw'
import { FeatureGroup, Polygon, Polyline } from 'react-leaflet'

import * as activeActions from '../../actions/active'
import type { GtfsLocation, LocationShape } from '../../../types'
import { groupLocationShapePoints } from '../../util/location'

type Props = {
  activeEntity: GtfsLocation,
  updatingLocationShape?: typeof activeActions.updatingLocationShape
}

/**
 * Draw one location on a map and render a popup on click
 *
 * Once multi-polygons or polylines are supported, this component will render
 * multiple locations.
 */
const LocationsLayer = (props: Props) => {
  const [groupedLocationShapePts, updateGroupLocationShapePts] = useState({})
  const {activeEntity, updatingLocationShape} = props
  const {geometry_type: geometryType, location_shapes: locationShapes} = activeEntity

  useEffect(() => {
    // Create our locations shape out of the bulk location shape points
    updateGroupLocationShapePts(groupLocationShapePoints(locationShapes))
  }, [locationShapes])

  const _onCreated = (e: L.LeafletEvent) => {
    const { layerType: geometryType, layer } = e

    // TODO: allow multi polygon type
    if (activeEntity.location_shapes.length > 0) {
      window.alert('MultiPolygons / Multipolylines are not currently supported.')
      // TODO: clear the EditControl in a better way
      location.reload()
      return
    }

    // TODO: unify geometryType w/ backend types, including detecting MULTIPOLYGON & MULTILINESTRING
    // Construct a location type as an array of location shape points.
    const locationShape: LocationShape = geometryType === 'polygon'
      ? layer.getLatLngs()[0].map(latlng => {
        return {
          location_id: activeEntity.location_id,
          geometry_id: e.target._leaflet_id,
          geometry_pt_lat: latlng.lat,
          geometry_pt_lon: latlng.lng,
          id: e.target._leaflet_id
        }
      })
      : layer.getLatLngs().map(latlng => {
        return {
          location_id: activeEntity.location_id,
          geometry_id: e.target._leaflet_id,
          geometry_pt_lat: latlng.lat,
          geometry_pt_lon: latlng.lng,
          id: e.target._leaflet_id
        }
      })

    if (!updatingLocationShape) return

    const newLocationShapes = [ ...activeEntity.location_shapes, ...locationShape ]
    updatingLocationShape({ geometryType, shapes: newLocationShapes })
    updateGroupLocationShapePts(groupLocationShapePoints(newLocationShapes))
  }

  const _onEdited = (e: L.LeafletEvent, layer: L.Layer) => {
    const {key} = e
    const { geometryType } = e.props
    const {latlngs: positions} = layer.editing
    if (!positions || !positions[0][0]) return

    const newLocationShapes = positions[0][0].map((coord, index) => (
      {
        geometry_id: key,
        geometry_pt_lat: coord.lat,
        geometry_pt_lon: coord.lng,
        id: index,
        location_id: activeEntity.location_id // location_id is required within each location_shape point on the backend.
      }
    ))

    if (!updatingLocationShape) return
    updatingLocationShape({ geometryType, shapes: newLocationShapes })
  }
  const _onDelete = (e: L.LeafletEvent, layer: L.Layer) => {
    const {activeEntity} = props
    const locationShapes = clone(activeEntity.location_shapes)
    const {key} = e
    const newLocationShapes = locationShapes.filter((shapePt) => !(String(key) === String(shapePt.geometry_id)))

    if (!updatingLocationShape) return
    updatingLocationShape({ geometryType, shapes: newLocationShapes })
  }

  const Group = updatingLocationShape ? EditControlFeatureGroup : FeatureGroup

  return (
    <div id='location-features-layer'>
      <Group
        controlProps={{draw: {

          circle: false,
          circlemarker: false,
          marker: false,
          polygon: true,
          polyline: false,
          rectangle: false
        },
        position: 'topleft'}}
        onCreated={_onCreated}
        onEdited={_onEdited}
        onDeleted={_onDelete}
      >
        {Object.keys(groupedLocationShapePts).map((key) => {
          // const Shape = this.state.initialShapeIds.includes(key) && geometryType === 'polygon' ? Polygon : Polyline
          const Shape = geometryType === 'polygon' ? Polygon : Polyline
          return <Shape key={key} geometryType={geometryType} positions={groupedLocationShapePts[key]} />
        })}

      </Group>

    </div>
  )
}

export default LocationsLayer
