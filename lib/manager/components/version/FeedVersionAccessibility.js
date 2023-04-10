// @flow

import Icon from '@conveyal/woonerf/components/icon'
import Rcslider from 'rc-slider'
import React, {Component} from 'react'
import {Row, Col, Button, ControlLabel} from 'react-bootstrap'

import fileDownload from '../../../common/util/file-download'
import ActiveDateTimeFilter from '../reporter/containers/ActiveDateTimeFilter'

import type {FeedVersion} from '../../../types'

type Props = {
  changeIsochroneBand: number => void,
  isochroneBand: any,
  version: FeedVersion
}

export default class FeedVersionAccessibility extends Component<Props> {
  _downloadIsochrones = () => {
    const {version} = this.props
    // TODO: add shapefile download (currently shp-write does not support isochrones)
    // downloadAsShapefile(version.isochrones, {folder: 'isochrones', types: {line: 'isochrones'}})
    fileDownload(
      JSON.stringify(version.isochrones),
      `isochrones_${version.feedSource.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`,
      'application/json'
    )
  }

  _formatSliderTips = (value: string) => {
    return `${value} minutes`
  }

  _renderIsochroneMessage () {
    const {version} = this.props
    if (version.isochrones && version.isochrones.features) {
      return <span>
        Mueva el marcador o cambie la fecha/hora para volver a calcular.<br />
        <Button
          bsStyle='success'
          bsSize='small'
          onClick={this._downloadIsochrones}>
          <Icon type='download' /> Exportar isócronos
        </Button>
      </span>
    } else if (version.isochrones) {
      return 'Leyendo red de transporte, inténtalo de nuevo más tarde.'
    } else {
      return 'Haga clic en el mapa de arriba para mostrar el isócrono de viaje para este feed.'
    }
  }

  render () {
    const {version} = this.props
    return (
      <div>
        <Row>
          <Col xs={12}>
            {/* isochrone message */}
            <p className='lead text-center'>
              {this._renderIsochroneMessage()}
            </p>
          </Col>
        </Row>
        <Row>
          <Col
            md={6}
            mdOffset={3}
            xs={12}
            style={{marginBottom: '20px'}}>
            <ControlLabel>Tiempo de viaje</ControlLabel>
            <Rcslider
              min={5}
              max={120}
              defaultValue={this.props.isochroneBand / 60}
              onChange={this.props.changeIsochroneBand}
              step={5}
              marks={{
                '15': '¼ hour',
                '30': '½ hour',
                '60': <strong>1 hora</strong>,
                '120': '2 hours'
              }}
              tipFormatter={this._formatSliderTips} />
          </Col>
        </Row>
        <ActiveDateTimeFilter version={version} />
      </div>
    )
  }
}
