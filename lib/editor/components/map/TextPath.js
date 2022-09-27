// @flow

import { Path, withLeaflet } from 'react-leaflet'
import type { PathProps } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-textpath'

// Force polyline to be non-interactive and invisible.
const OPTIONS = {
  interactive: false,
  weight: 0
}

type Props = {
  attributes: Object,
  below: boolean,
  center: boolean,
  leaflet: any,
  offset?: number,
  orientation?: number,
  positions: Array<[number, number]>,
  repeat: boolean,
  text: string
} & PathProps

// props.leaflet is not used but destructured out so it's not passed to L.Polyline
function getOptions ({
  positions,
  text,
  repeat,
  center,
  below,
  offset,
  orientation,
  attributes,
  leaflet // eslint-disable-line no-unused-vars
}) {
  return {
    positions,
    text,
    repeat,
    center,
    below,
    offset,
    orientation,
    attributes
  }
}

/**
 * This component will render text along an invisible path on a leaflet map. It
 * is currently being used to draw arrows along the length of a trip pattern to
 * indicate directionality (see DirectionIconsLayer.js).
 *
 * This class was adapted from https://github.com/clementallen/react-leaflet-textpath
 * which unfortunately could not be used here because of some issue I encountered
 * with react-leaflet. I believe it might have been designed for react-leaflet v2,
 * but we're currently using v1.
 */
class TextPath extends Path<Props> {
  createLeafletElement (props: Props) {
    const { positions, text, ...pathOptions } = getOptions(props)
    const line = new L.Polyline(positions, OPTIONS)
    line.setText(text, pathOptions)
    return line
  }

  updateLeafletElement (fromProps: Props, toProps: Props) {
    const { positions, text, ...pathOptions } = getOptions(toProps)
    // $FlowFixMe The new version of React-Leaflet brings strange types with it...
    this.leafletElement.setText(null)
    // $FlowFixMe The new version of React-Leaflet brings strange types with it...
    this.leafletElement.setLatLngs(positions)
    // $FlowFixMe The new version of React-Leaflet brings strange types with it...
    this.leafletElement.setStyle(OPTIONS)
    // $FlowFixMe The new version of React-Leaflet brings strange types with it...
    this.leafletElement.setText(text, pathOptions)
  }
}

export default withLeaflet(TextPath)
