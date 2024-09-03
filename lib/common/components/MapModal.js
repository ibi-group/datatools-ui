// @flow

import React, {Component} from 'react'
import {Modal, Button} from 'react-bootstrap'
import {Map, Marker, TileLayer} from 'react-leaflet'

import {getComponentMessages} from '../util/config'
import {boundsContainNaN} from '../../editor/util/map'
import {defaultTileLayerProps} from '../util/maps'
import type {LatLng} from '../../types'

type Props = {
  body?: string,
  bounds?: [[number, number], [number, number]],
  initialized?: boolean,
  marker?: LatLng,
  markerSelect?: boolean,
  onConfirm?: any => void,
  rectangle?: any,
  rectangleSelect?: boolean,
  title?: string
}

type State = {
  body?: string,
  bounds?: [[number, number], [number, number]],
  draw?: boolean,
  marker?: LatLng,
  markerSelect?: boolean,
  onConfirm: any => void,
  rectangle?: any,
  rectangleSelect?: boolean,
  showModal: boolean,
  title: ?string
}

export default class MapModal extends Component<Props, State> {
  messages = getComponentMessages('MapModal')

  state = {
    showModal: false,
    onConfirm: () => {},
    title: null
  }

  close = () => this.setState({showModal: false})

  open (props: Props) {
    this.setState({
      showModal: true,
      title: props.title,
      marker: props.marker,
      bounds: props.bounds,
      rectangle: props.rectangle,
      markerSelect: props.markerSelect,
      rectangleSelect: props.rectangleSelect,
      body: props.body,
      onConfirm: props.onConfirm,
      draw: true
    })
  }

  getMap () {
    return this.refs.map
  }

  _onEditPath () {
    console.log('Chemin modifié !')
  }

  clickHandler = (e: any) => {
    if (this.state.markerSelect) {
      this.refs.map.leafletElement.panTo(e.latlng)
      this.setState({marker: e.latlng})
    }
  }

  ok = () => {
    if (this.state.markerSelect) this.state.onConfirm(this.state.marker)
    if (this.state.rectangleSelect) this.state.onConfirm(this.state.rectangle)
    else this.state.onConfirm()
    this.close()
  }

  render () {
    const {Body, Footer, Header, Title} = Modal
    const bounds = this.state.bounds
      ? this.state.bounds
      : [[60, -120], [0, 120]]
    const mapStyle = {
      height: '300px',
      width: '100%'
    }
    const marker = this.state.marker
      ? <Marker
        position={[this.state.marker.lat, this.state.marker.lng]}
        key={Math.random()} />
      : null
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Header>
          <Title>{this.state.title}</Title>
        </Header>

        <Body>
          {!boundsContainNaN(bounds) && <Map
            ref='map'
            bounds={bounds}
            style={mapStyle}
            onClick={this.clickHandler}>
            <TileLayer {...defaultTileLayerProps()} />
            {marker}
          </Map>}
        </Body>
        <Footer>
          <Button onClick={this.ok}>{this.messages('ok')}</Button>
          <Button onClick={this.close}>{this.messages('cancel')}</Button>
        </Footer>
      </Modal>
    )
  }
}
