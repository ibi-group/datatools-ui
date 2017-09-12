import React, { Component } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { Map, Marker, TileLayer, FeatureGroup } from 'react-leaflet'

let polyline

export default class MapModal extends Component {
  state = {
    showModal: false
  }

  close = () => {
    this.setState({
      showModal: false
    })
  }

  open (props) {
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

  _onEditPath (e) {
    console.log('Path edited !')
  }

  _onCreate (e) {
    polyline = e.layer
    this.setState({rectangle: e.layer})
    // To edit this polyline call : polyline.handler.enable()
    console.log('Path created !', polyline)

    this.setState({draw: false})
  }

  _onDeleted (e) {
    if (this.refs.drawnItems.getLayers().length === 0) {
      this.setState({draw: true})
    }
  }

  initializeMap () {
    if (this.mapInitialized || this.props.initialized) return
    const leafletMap = this.getMap().leafletElement
    leafletMap.invalidateSize()
    this.mapInitialized = true
  }

  clickHandler = (e) => {
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
    const MAPBOX_MAP_ID = process.env.MAPBOX_MAP_ID
    const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN
    const MAPBOX_ATTRIBUTION = process.env.MAPBOX_ATTRIBUTION
    return (
      <Modal show={this.state.showModal} onHide={this.close}>
        <Header>
          <Title>{this.state.title}</Title>
        </Header>

        <Body>
          <Map
            ref='map'
            bounds={bounds}
            style={mapStyle}
            onClick={this.clickHandler}>
            <TileLayer
              url={`https://api.tiles.mapbox.com/v4/${MAPBOX_MAP_ID}/{z}/{x}/{y}.png?access_token=${MAPBOX_ACCESS_TOKEN}`}
              attribution={MAPBOX_ATTRIBUTION} />
            {this.state.rectangleSelect
              ? <FeatureGroup
                ref='drawnItems'>
                {/* <EditControl
                  onEdited={(e) => this._onEditPath(e)}
                  onCreated={(e) => this._onCreate(e)}
                  onDeleted={(e) => this._onDeleted(e)}
                  position='topright'
                  draw={this.state.draw
                    ? {
                      circle: false,
                      polyline: false,
                      polygon: false,
                      marker: false
                    }
                    : {
                      circle: false,
                      polyline: false,
                      polygon: false,
                      marker: false,
                      rectangle: false
                    }
                  } />
              */}
              </FeatureGroup>
              : null
            }
            {/* this.state.marker
              ? this.state.marker.map(m => {
                return (
                  <Marker
                    position={[m.lat, m.lng]}
                    key={Math.random()}
                  >
                  </Marker>
                )
              })
              : null
            */}
            {marker}
          </Map>
        </Body>
        <Footer>
          <Button onClick={this.ok}>OK</Button>
          <Button onClick={this.close}>Cancel</Button>
        </Footer>
      </Modal>
    )
  }
}
