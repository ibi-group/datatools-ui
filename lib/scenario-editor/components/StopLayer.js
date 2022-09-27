// @flow

/**
an optimized layer for drawing stops rapidly,
adapted from https://github.com/conveyal/leaflet-transit-editor/blob/master/lib/stop-layer.js
and subsequently https://github.com/conveyal/scenario-editor/blob/master/lib/map/transit-editor/stop-layer.js
*/

import { GridLayer as LeafletGridLayer, point } from 'leaflet'
import { MapLayer, withLeaflet } from 'react-leaflet'

import type { GtfsStop } from '../../types'

const MIN_ZOOM = 1 // don't draw stops below this zoom
const TILE_LENGTH = 256

type Coords = {
  x: number,
  y: number,
  z: number
}

class StopLayer extends MapLayer {
  static defaultProps = {
    minZoom: MIN_ZOOM
  }

  // This bit is a little funky because we're adapting our 6 year old Leaflet layer
  // to the latest version of leaflet
  createLeafletElement (props) {
    const options = this.getOptions(props)
    const el = new LeafletGridLayer(options)
    el.createTile = (coords: Coords) => this.createTile(coords)
    return el
  }

  createTile = (coords: Coords) => {
    const { leaflet, minZoom, stops } = this.props
    const { map } = leaflet
    if (coords.z < minZoom) return // don't draw every transit stop in a country

    // create a <canvas> element for drawing
    const tile = document.createElement('canvas')
    tile.width = tile.height = TILE_LENGTH
    this.drawTile(tile, coords, map, stops)
    return tile
  }

  drawTile = (canvas: HTMLCanvasElement, coords: Coords, map: any, stops: Array<GtfsStop>) => {
    // get a canvas context and draw something on it using coords.x, coords.y and coords.z
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#333'

    // get the bounds
    const topLeft = map.unproject([coords.x * TILE_LENGTH, coords.y * TILE_LENGTH], coords.z)
    const brPoint = point([coords.x + 1, coords.y + 1])
    const botRight = map.unproject([brPoint.x * TILE_LENGTH, brPoint.y * TILE_LENGTH], coords.z)

    // find relevant stops
    stops
      .filter((s) =>
        s.stop_lat < topLeft.lat &&
        s.stop_lat > botRight.lat &&
        s.stop_lon > topLeft.lng &&
        s.stop_lon < botRight.lng
      )
      .forEach(s => {
        // get coordinates
        // lat first for leaflet, every so often Lineland seems like a good idea
        // http://www.gutenberg.org/ebooks/97
        let { x, y } = map.project([s.stop_lat, s.stop_lon], coords.z)

        // we know they're in the current tile so we can be lazy and just modulo
        x %= TILE_LENGTH
        y %= TILE_LENGTH

        // center it up
        x -= 1
        y -= 1

        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.stroke()
      })
  }

  componentDidMount () {
    super.componentDidMount()
  }
}

export default withLeaflet(StopLayer)
