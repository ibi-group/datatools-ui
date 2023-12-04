// @flow

import React, { Component } from 'react'
import Icon from '@conveyal/woonerf/components/icon'

import shp from 'shpjs';
import shpwrite from 'shp-write';

import {
  Grid,
  Row,
  Col,
  Button,
  Table,
  Modal,
  ProgressBar
} from 'react-bootstrap'

import ManagerPage from '../../common/components/ManagerPage'

import type { Props as ContainerProps } from '../containers/ActiveProjectsList'
import type { ManagerUserState } from '../../types/reducers'
import { LinkContainer } from 'react-router-bootstrap'

import { reverseEsri as reverse } from '../../scenario-editor/utils/reverse'

function downloadShapefile(geojsonData, folder, filename) {
  var options = {
    folder,
    filename,
    types: {
      point: 'mypoints',
      polygon: 'mypolygons',
      line: 'mylines'
    }
  }
  // a GeoJSON bridge for features
  shpwrite.download(geojsonData, options);
}

type Props = ContainerProps & {
  user: ManagerUserState,
}

const nameProperty = 'Name';
const maxFeatures = -1;

export default class ScriptNamingStop extends Component<Props> {

  constructor(props) {
    super(props);
    this.state = {
      loadButtonDisabled: true,
      startButtonDisabled: true,
      downloadResultButtonDisabled: true,
      file: null,
      stops: [],
      stopsProperties: [],
      inProgress: false,
      progressMin: 0,
      progressMax: 0,
      progressNow: 0,
      progress: "0/0",
    };

    this._handleFileChange = this._handleFileChange.bind(this);
    this._handleFileLoad = this._handleFileLoad.bind(this);
    this._nameStops = this._nameStops.bind(this);
    this._downloadResults = this._downloadResults.bind(this);
  }

  async _nameStops() {
    const maxFeaturesAux = maxFeatures >= 0 ? maxFeatures : this.state.stops.length;

    this.setState({
      inProgress: true,
      progressMin: 0,
      progressMax: maxFeaturesAux,
      progressNow: 0,
      progress: `0/${ maxFeaturesAux }`
    })

    const newStops = [];

    for (let index = 0; index < maxFeaturesAux; index++) {
      this.setState({
        progress: `${index + 1}/${ maxFeaturesAux }`,
        progressNow: index + 1,
      })

      const stop = this.state.stops[index];
      const newStop = { ...stop };

      const result = await reverse({ lng: stop.geometry.coordinates[0], lat: stop.geometry.coordinates[1] });
      if (result && result.address) {
        newStop.properties[nameProperty] = result.address.Address;
      }

      newStops.push(newStop);
    }

    this.setState({
      stops: newStops,
      downloadResultButtonDisabled: false,
      inProgress: false
    })
  }

  _downloadResults() {
    const geojson = {
      "type": "FeatureCollection",
      "features": this.state.stops
    }

    const folder = "result";

    const filename = "updated_" + this.state.file.name;

    downloadShapefile(geojson, folder, filename);
  }

  _handleFileChange(event) {
    this.setState({
      file: event.target.files[0],
      loadButtonDisabled: false
    });
  };

  _handleFileLoad() {
    if (this.state.file !== null) {
      const reader = new window.FileReader()
      reader.onload = e => {
        const arrayBuff = reader.result
        shp(arrayBuff).then(geojson => {
          this.setState({
            stops: geojson.features,
            stopsProperties: Object.keys(geojson.features[0].properties),
            startButtonDisabled: false
          });
        })
      }
      reader.readAsArrayBuffer(this.state.file)
    }
  };

  render() {
    return (
      <ManagerPage
        ref='page'
        title='Nombrar paradas'>
        <Grid fluid>
          <Row style={{ marginBottom: '20px' }}>
            <Col xs={12}>
              <h1>
                <LinkContainer className='pull-right' to={{ pathname: '/home' }}>
                  <Button>Atrás</Button>
                </LinkContainer>
                <Icon type='arrow-right' /> Agregar nombres a una lista de paradas
              </h1>
            </Col>
          </Row>

          <Row style={{ marginBottom: 20 }}>
            <Col xs={4} md={4}>
              <label htmlFor='shapefile'>Cargar archivo shapefile: </label>
            </Col>
            <Col xs={8} md={8}>
              <input
                id='shapefile'
                name='shapefile'
                type="file"
                accept='.zip'
                onChange={this._handleFileChange}
              />
            </Col>
          </Row>

          <Row>
            <Col>
              <Button
                onClick={this._handleFileLoad}
                style={{ width: "100%" }}
                disabled={this.state.loadButtonDisabled}>1. Cargar Archivo</Button>
            </Col>
          </Row>

          <Row>
            <Col>
              <div style={{ overflowX: "auto", maxHeight: "500px" }}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      {this.state.stopsProperties.map((property, index) => (
                        <th key={index}>{property}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.stops.map((stop, index) => (
                      <tr key={index}>
                        {this.state.stopsProperties.map((property, indexProp) => (
                          <td key={indexProp}>{stop.properties[property]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>

          <Row style={{ marginTop: 20 }}>
            <Col>
              <Button
                style={{ width: "100%" }}
                disabled={this.state.startButtonDisabled}
                onClick={this._nameStops}>2. Nombrar paradas</Button>
            </Col>
          </Row>

          <Row style={{ marginTop: 20 }}>
            <Col>
              <Button
                style={{ width: "100%" }}
                disabled={this.state.downloadResultButtonDisabled}
                onClick={this._downloadResults}>3. Descargar resultados</Button>
            </Col>
          </Row>
        </Grid>

        {this.state.inProgress &&
          <Modal
            show={true}
            backdrop="static"
            keyboard={false}
            size="lg"
          >
            <Modal.Header>
              <Modal.Title>Progreso</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <ProgressBar 
                min={this.state.progressMin}
                max={this.state.progressMax}
                now={this.state.progressNow}
                label={this.state.progress}
              />
            </Modal.Body>
          </Modal>
        }
      </ManagerPage>
    )
  }
}
