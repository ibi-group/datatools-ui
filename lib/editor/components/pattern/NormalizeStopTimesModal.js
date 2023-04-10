// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Alert, Button, ControlLabel, FormControl, Modal } from 'react-bootstrap'

import * as tripPatternActions from '../../actions/tripPattern'
import type { GtfsStop, Pattern } from '../../../types'

type Props = {
  activePattern: Pattern,
  normalizeStopTimes: typeof tripPatternActions.normalizeStopTimes,
  onClose: any,
  show: boolean,
  stops: Array<GtfsStop>
}

type State = { patternStopIndex: number, show: boolean }

export default class NormalizeStopTimesModal extends Component<Props, State> {
  state = {
    patternStopIndex: 0, // default to zeroth pattern stop
    show: false
  }

  _onClickNormalize = () => {
    const { activePattern, normalizeStopTimes } = this.props
    normalizeStopTimes(activePattern.id, this.state.patternStopIndex)
  }

  _onChangeStop = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({patternStopIndex: +evt.target.value})
  }

  _onClose = () => {
    this.setState({ show: false })
    this.props.onClose()
  }

  render () {
    const { Body, Footer, Header, Title } = Modal
    const { activePattern, stops } = this.props
    return (
      <Modal show={this.props.show || this.state.show} onHide={this._onClose}>
        <Header>
          <Title>¿Normalizar los tiempos de parada?</Title>
        </Header>
        <Body>
          <p>
            La normalización de los tiempos de parada sobrescribirá los tiempos de llegada y 
            salida para <strong>todos los viajes</strong> en este patrón para ajustarse a los
            tiempos de viaje y permanencia predeterminados definidos para las paradas del patrón.
          </p>
          <ControlLabel>Seleccione la parada del patrón inicial:</ControlLabel>
          <FormControl
            value={this.state.patternStopIndex}
            componentClass='select'
            onChange={this._onChangeStop}>
            {activePattern.patternStops.map((patternStop, index) => {
              const stop = stops.find(s => s.stop_id === patternStop.stopId)
              if (!stop) return null
              return (
                <option
                  value={index}
                  key={index}>
                  {index + 1} - {stop.stop_name}
                </option>
              )
            }
            )}
          </FormControl>
          <br />
          <Alert bsStyle='warning'>
            {this.state.patternStopIndex === 0
              // TODO: figure out how yml messages with html tags can be rendered
              // correctly.
              ? <span>
                Se normalizarán los tiempos de parada para 
                <strong>todas las paradas del patrón</strong>.
              </span>
              : <span>
                Los tiempos de parada para <strong>la parada {this.state.patternStopIndex + 1}{' '} 
                hasta la parada final</strong> se normalizarán (cualquier tiempo de 
                parada anterior no se modificará).
              </span>
            }
          </Alert>
          <Alert bsStyle='info'>
            <h5><Icon type='info-circle' /> Notas de uso</h5>
            <small>
              Esta función es útil cuando cambian los tiempos de viaje para una o 
              más paradas de patrón. Tomemos, por ejemplo, un patrón que se ha desviado 
              para viajar una distancia más larga, se ha agregado (o eliminado) una parada 
              o se ha introducido una escala a mitad del viaje. Una vez que haya ajustado 
              los tiempos de viaje para tener en cuenta estos cambios, puede normalizar los 
              tiempos de parada para alinearlos con los tiempos de viaje actualizados que 
              se reflejan en las paradas del patrón.
              <hr />
              <strong>Nota:</strong> tiempo de viaje entre paradas para viajes a lo largo 
              del día (por ejemplo, debido a velocidades de viaje más lentas durante el 
              pico de la mañana). Sobrescribe TODOS los tiempos de parada para viajes en 
              este patrón con los valores de parada del patrón.
            </small>
          </Alert>
        </Body>
        <Footer>
          <Button
            bsStyle='primary'
            onClick={this._onClickNormalize}
          >
            Normalizar los tiempos de parada
          </Button>
          <Button
            onClick={this._onClose}>
            Cerrar
          </Button>
        </Footer>
      </Modal>
    )
  }
}
