
/** an icon that is an arrow pointing in a particular direction */

import {DivIcon, point} from 'leaflet'
import React from 'react'
import {Marker} from 'react-leaflet'

class LeafletDirectionIcon extends DivIcon {
  // NB nonstandard constructor name for Leaflet
  initialize ({bearing, color = '#000', iconSize = 16}) {
    super.initialize({
      html: `<i class="fa fa-arrow-up" style="font-size: ${iconSize}px; color: ${color}; transform: rotate(${bearing}deg)"></i>`,
      iconSize: point(iconSize, iconSize),
      className: 'DirectionIcon'
    })
  }
}

// in typical leaflet fashion, make a function to create the class
export default function DirectionIcon ({
  bearing,
  clickable,
  color,
  coordinates,
  iconSize,
  layerContainer,
  map
}) {
  return <Marker
    clickable={clickable}
    icon={new LeafletDirectionIcon({bearing, color, iconSize})}
    layerContainer={layerContainer}
    map={map}
    position={[coordinates[1], coordinates[0]]} />
}
