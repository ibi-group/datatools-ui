// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button } from 'react-bootstrap'

import * as activeActions from '../../actions/active'
import * as mapActions from '../../actions/map'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import VirtualizedEntitySelect from '../VirtualizedEntitySelect'
import {getEntityBounds, getEntityName} from '../../util/gtfs'
import type {Pattern, GtfsStop, Feed, ControlPoint, Coordinates} from '../../../types'
import type {EditorStatus, EditSettingsUndoState, MapState} from '../../../types/reducers'

import PatternStopContainer from './PatternStopContainer'
import NormalizeStopTimesModal from './NormalizeStopTimesModal'
import AddPatternStopDropdown from './AddPatternStopDropdown'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  controlPoints: Array<ControlPoint>,
  editSettings: EditSettingsUndoState,
  feedSource: Feed,
  mapState: MapState,
  normalizeStopTimes: typeof tripPatternActions.normalizeStopTimes,
  patternEdited: boolean,
  patternSegments: Array<Coordinates>,
  patternStop: {id: ?any, index: ?number},
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  status: EditorStatus,
  stops: Array<GtfsStop>,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity,
  updateEditSetting: typeof activeActions.updateEditSetting,
  updateMapSetting: typeof mapActions.updateMapSetting,
  updatePatternGeometry: typeof mapActions.updatePatternGeometry,
  updatePatternStops: typeof tripPatternActions.updatePatternStops,
  updateShapesAfterPatternReorder: typeof stopStrategiesActions.updateShapesAfterPatternReorder
}

type State = {
  patternStopCandidate: ?GtfsStop,
  showNormalizeStopTimesModal: boolean
 }

export default class PatternStopsPanel extends Component<Props, State> {
  state = {
    showNormalizeStopTimesModal: false,
    patternStopCandidate: null
  }

  _toggleAddStopsMode = () => {
    const {editSettings, updateEditSetting} = this.props
    // Clear stop candidate (if defined).
    this.setState({patternStopCandidate: null})
    updateEditSetting({
      setting: 'addStops',
      value: !editSettings.present.addStops
    })
  }

  _clickNormalizeStopTimes = () =>
    this.setState({showNormalizeStopTimesModal: true})

  _onCloseModal = () => this.setState({showNormalizeStopTimesModal: false})

  _selectStop = (input: any) => {
    if (!input) {
      // Clear stop candidate if input is cleared.
      this.setState({patternStopCandidate: null})
      return
    }
    const stop: GtfsStop = input.entity
    // Zoom to stop candidate
    this.props.updateMapSetting({bounds: getEntityBounds(stop), target: +stop.id})
    this.setState({patternStopCandidate: stop})
  }

  render () {
    const {
      addStopToPattern,
      activePattern,
      editSettings,
      mapState,
      patternStop,
      feedSource,
      patternEdited,
      controlPoints,
      patternSegments,
      updatePatternGeometry,
      removeStopFromPattern,
      saveActiveGtfsEntity,
      setActiveEntity,
      setActiveStop,
      status,
      stops,
      updateActiveGtfsEntity,
      updatePatternStops,
      updateShapesAfterPatternReorder
    } = this.props
    const {addStops} = editSettings.present
    const {patternStopCandidate} = this.state
    const patternHasStops = activePattern.patternStops &&
      activePattern.patternStops.length > 0
    return (
      <div>
        <NormalizeStopTimesModal
          activePattern={activePattern}
          normalizeStopTimes={this.props.normalizeStopTimes}
          onClose={this._onCloseModal}
          show={this.state.showNormalizeStopTimesModal}
          stops={stops}
        />
        <h4 className='line'>
          Arrêts
          {' '}
          ({activePattern.patternStops ? activePattern.patternStops.length : 0})
        </h4>
        <div style={{width: '100%'}}>
          <Button
            disabled={!patternHasStops}
            onClick={this._clickNormalizeStopTimes}
            style={{marginBottom: '5px'}}
            className='pull-right'
            block
            bsSize='small'
            title={!patternHasStops ? 'Vous devez ajouter des arrêts avant de normaliser.' : ''}
          >
            <Icon type='clock-o' />{' '}
            Normaliser les temps d'arrêt
          </Button>
          <Button
            onClick={this._toggleAddStopsMode}
            className='pull-right'
            bsSize='small'>
            {addStops
              ? <span><Icon type='times' /> Annuler</span>
              : <span><Icon type='plus' /> Ajouter un arrêt</span>
            }
          </Button>
          <small className='pull-right' style={{margin: '5px'}}>
            {addStops && mapState.zoom && mapState.zoom <= 14
              ? 'Zoomer pour voir les arrêts'
              : `Ajouter des arrêts depuis la carte`
            }
          </small>
        </div>
        {/* List of pattern stops */}
        <div id='pattern-stop-list-header'>
          <div className='pull-left' style={{width: '50%'}}>
            <p className='small' style={{marginBottom: '0px'}}>
              <strong>Séquence d'arrêts</strong>
            </p>
          </div>
          <div className='pull-right' style={{width: '50%'}}>
            <p style={{marginBottom: '0px'}} className='small text-right'>
              <strong>Temps de voyage</strong>
            </p>
          </div>
          <div className='clearfix' />
        </div>
        {patternHasStops
          ? <PatternStopContainer
            stops={stops}
            activePattern={activePattern}
            patternStop={patternStop}
            controlPoints={controlPoints}
            patternSegments={patternSegments}
            updatePatternStops={updatePatternStops}
            updatePatternGeometry={updatePatternGeometry}
            updateShapesAfterPatternReorder={updateShapesAfterPatternReorder}
            status={status}
            updateActiveGtfsEntity={updateActiveGtfsEntity}
            saveActiveGtfsEntity={saveActiveGtfsEntity}
            addStopToPattern={addStopToPattern}
            removeStopFromPattern={removeStopFromPattern}
            setActiveEntity={setActiveEntity}
            feedSource={feedSource}
            patternEdited={patternEdited}
            setActiveStop={setActiveStop} />
          : <small className='text-warning'>
            <Icon type='exclamation-triangle' />{' '}
            La circulation n'a aucun arrêt.
          </small>
        }
        {/* Add stop selector */}
        <div style={{marginTop: '10px'}}>
          {addStops
            ? <div className='pattern-stop-card'>
              <VirtualizedEntitySelect
                component={'stop'}
                entities={stops}
                onChange={this._selectStop} />
              {patternStopCandidate
                ? <div style={{
                  textAlign: 'center',
                  marginTop: '5px'
                }}>
                  <p>{getEntityName(patternStopCandidate)}</p>
                  <AddPatternStopDropdown
                    activePattern={activePattern}
                    block
                    addStopToPattern={addStopToPattern}
                    label="Ajouter l'arrêt à la fin"
                    stop={patternStopCandidate}
                    style={{marginBotton: '10px'}}
                  />
                </div>
                : null
              }
              <div style={{marginTop: '5px'}}>
                <Button
                  bsSize='small'
                  bsStyle='default'
                  block
                  onClick={this._toggleAddStopsMode}>
                  <Icon type='times' /> Annuler
                </Button>
              </div>
            </div>
            : <Button
              block
              bsSize='small'
              data-test-id='add-stop-by-name-button'
              onClick={this._toggleAddStopsMode}
            >
              <Icon type='plus' /> Ajouter un arrêt par son nom
            </Button>
          }
        </div>
      </div>
    )
  }
}
