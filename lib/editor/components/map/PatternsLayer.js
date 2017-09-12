import React, {Component, PropTypes} from 'react'
import {FeatureGroup, Polyline, Tooltip} from 'react-leaflet'

export default class PatternsLayer extends Component {
  static propTypes = {
    activeEntity: PropTypes.object,
    activePattern: PropTypes.object,
    constructControlPoint: PropTypes.func,
    controlPoints: PropTypes.array,
    editSettings: PropTypes.object,
    feedSource: PropTypes.object,
    patternCoordinates: PropTypes.array,
    route: PropTypes.object,
    setActiveEntity: PropTypes.func,
    subEntityId: PropTypes.string,
    updateEditSetting: PropTypes.func
  }

  _onClick (pattern, isActive, isEditing, controlPoints, e) {
    const {activeEntity, constructControlPoint, feedSource, setActiveEntity, updateEditSetting} = this.props
    if (isEditing) {
      constructControlPoint(pattern, e.latlng, controlPoints)
    } else if (isActive) {
      updateEditSetting('editGeometry', true, pattern)
    } else {
      setActiveEntity(feedSource.id, 'route', activeEntity, 'trippattern', pattern)
    }
  }

  render () {
    const {
      route,
      subEntityId,
      activePattern,
      editSettings,
      controlPoints,
      patternCoordinates
    } = this.props
    return (
      <FeatureGroup id='trip-patterns-layer'>
        {route && route.tripPatterns
          ? route.tripPatterns
            .map(tp => {
              const isActive = subEntityId === tp.id
              const isEditing = isActive && editSettings.editGeometry
              const pattern = isActive ? activePattern : tp
              const latLngs = pattern && pattern.shape ? pattern.shape.coordinates.map(c => ([c[1], c[0]])) : []

              // NOTE: don't render pattern if latlngs don't exist or a single pattern is active
              if (!latLngs || (!isActive && subEntityId)) {
                return null
              }
              const lineColor = editSettings.editGeometry
                ? '#F3F315' // yellow if editing
                : 'blue'
              const clickAction = isEditing
                ? 'add control point'
                : isActive
                ? 'edit shape'
                : 'select'
              return (
                <Polyline
                  positions={(patternCoordinates && patternCoordinates.map(c => ([c[1], c[0]]))) || latLngs}
                  key={tp.id}
                  onClick={e => this._onClick(pattern, isActive, isEditing, controlPoints, e)}
                  lineCap='butt'
                  color={lineColor}
                  weight={5}
                  // onEachFeature={(feature, layer) => layer.bindTooltip(tp.name).openTooltip()}
                  opacity={isActive ? 0.8 : 0.5}>
                  <Tooltip key={Math.random()} opacity={editSettings.showTooltips ? 0.9 : 0} sticky>
                    <span>{tp.name} (click to {clickAction})</span>
                  </Tooltip>
                </Polyline>
              )
            })
          : null
        }
      </FeatureGroup>
    )
  }
}
