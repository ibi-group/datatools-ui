// @flow

import React, {PureComponent} from 'react'
import L from 'leaflet'
import {
  FeatureGroup,
  LayersControl,
  Polyline,
  TileLayer
} from 'react-leaflet'

import {getUserMetadataProperty} from '../../../common/util/user'
import {isExtensionEnabled} from '../../../common/util/config'
import {defaultTileLayerProps, EDITOR_MAP_LAYERS} from '../../../common/util/maps'
import StopLayer from '../../../scenario-editor/components/StopLayer'

import type {GtfsStop, MapLayer} from '../../../types'
import type {ManagerUserState} from '../../../types/reducers'

type Props = {
  stops: Array<GtfsStop>,
  tripPatterns: Array<any>,
  user: ManagerUserState
}

type OverlayItem = {component: any, name: string}

export default class EditorMapLayersControl extends PureComponent<Props> {
  render () {
    const canvas = L.canvas()
    const { tripPatterns, stops, user } = this.props
    const { BaseLayer, Overlay } = LayersControl
    const OVERLAYS: Array<OverlayItem> = [
      {
        name: 'Tracés des itinéraires',
        component: (
          <FeatureGroup>
            {tripPatterns
              ? tripPatterns.map((tp) => {
                if (!tp.latLngs) return null
                return (
                  <Polyline
                    color='#888'
                    interactive={false}
                    key={tp.id}
                    positions={tp.latLngs}
                    renderer={canvas}
                    weight={2} />
                )
              })
              : null
            }
          </FeatureGroup>
        )
      },
      {
        name: 'Emplacement des arrêts',
        component: <StopLayer key='stop-layer' stops={stops} />
      }
    ]
    const activeMapLayerIndex: number = EDITOR_MAP_LAYERS.findIndex(
      (l: MapLayer) => l.id === getUserMetadataProperty(user.profile, 'editor.map_id')
    )
    return (
      <LayersControl position='topleft'>
        {EDITOR_MAP_LAYERS.map((layer: MapLayer, index: number) => (
          <BaseLayer
            name={layer.name}
            key={layer.id}
            checked={activeMapLayerIndex !== -1 ? index === activeMapLayerIndex : index === 0}>
            <TileLayer {...defaultTileLayerProps(layer.id)} />
          </BaseLayer>
        ))}
        {isExtensionEnabled('nysdot') &&
          <Overlay
            name='Route layer'
            key='route-layer'>
            <TileLayer
              url={`https://s3.amazonaws.com/datatools-nysdot/tiles/{z}_{x}_{y}${L.Browser.retina ? '@2x' : ''}.png`} />
          </Overlay>
        }
        {OVERLAYS.map((overlay: OverlayItem, i: number) => (
          <Overlay
            name={overlay.name}
            key={i}>
            {overlay.component}
          </Overlay>
        ))}
      </LayersControl>
    )
  }
}
