// @flow

import React, {Component} from 'react'
import update from 'react-addons-update'
import { shallowEqual } from 'react-pure-render'
import { DropTarget, DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

import * as activeActions from '../../actions/active'
import * as stopStrategiesActions from '../../actions/map/stopStrategies'
import * as tripPatternActions from '../../actions/tripPattern'
import type {GtfsStop, Feed, Pattern, PatternStop} from '../../../types'

import PatternStopCard from './PatternStopCard'

type Props = {
  activePattern: Pattern,
  addStopToPattern: typeof stopStrategiesActions.addStopToPattern,
  feedSource: Feed,
  patternEdited: boolean,
  patternStop: {id: ?any, index: ?number},
  removeStopFromPattern: typeof stopStrategiesActions.removeStopFromPattern,
  saveActiveGtfsEntity: typeof activeActions.saveActiveGtfsEntity,
  setActiveEntity: typeof activeActions.setActiveEntity,
  setActiveStop: typeof tripPatternActions.setActiveStop,
  status: any,
  stops: Array<GtfsStop>,
  updateActiveGtfsEntity: typeof activeActions.updateActiveGtfsEntity,
  updatePatternStops: typeof tripPatternActions.updatePatternStops,
  updateShapesAfterPatternReorder: typeof stopStrategiesActions.updateShapesAfterPatternReorder
}

type State = {
  cards: Array<PatternStop>,
  updatedPatternStopSequence: number
}

const cardTarget = {
  drop () {}
}

/**
 * This component and its child components (Card.js) are based on the react-dnd
 * sortable example found here: http://gaearon.github.io/react-dnd/examples-sortable-cancel-on-drop-outside.html
 */
class PatternStopContainer extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      cards: this.props.activePattern.patternStops
    })
  }

  componentWillReceiveProps (nextProps) {
    // Updates cards when pattern stops order changes (does not account for changes to default travel/dwell times)
    if (nextProps.activePattern.patternStops && !shallowEqual(nextProps.activePattern.patternStops, this.props.activePattern.patternStops)) {
      this.setState({cards: nextProps.activePattern.patternStops})
    }
  }

  /**
   * Triggered when a dragged card is dropped finally dropped into a resting
   * place. This updates the pattern stops based on the current cards state.
   */
  dropCard = () => {
    const {
      activePattern,
      updateShapesAfterPatternReorder
    } = this.props
    // Update the modified pattern segments and update the control points with appropriate shape_dist_traveled values.
    // This method also saves the trip pattern to preserve changes
    updateShapesAfterPatternReorder(activePattern, [...this.state.cards], this.state.updatedPatternStopSequence)
  }

  moveCard = (id, atIndex) => {
    const {card, index} = this.findCard(id)
    this.setState(update(this.state, {
      cards: {
        $splice: [
          [index, 1],
          [atIndex, 0, card]
        ]
      },
      updatedPatternStopSequence: {$set: card.stopSequence}
    }))
  }

  findCard = (id) => {
    const { cards } = this.state
    const card = cards.filter((c, i) => c.id === id)[0]
    return {
      card,
      index: cards.indexOf(card)
    }
  }

  render () {
    const {
      activePattern,
      addStopToPattern,
      // $FlowFixMe
      connectDropTarget,
      feedSource,
      patternEdited,
      patternStop,
      removeStopFromPattern,
      saveActiveGtfsEntity,
      setActiveEntity,
      setActiveStop,
      status,
      stops,
      updateActiveGtfsEntity,
      updatePatternStops
    } = this.props
    const { cards } = this.state
    if (!stops) return null
    const stopNotFound = activePattern.patternStops.findIndex(ps => ps.id === patternStop.id) === -1

    let cumulativeTravelTime = 0
    return connectDropTarget(
      <div>
        {cards.map((card, i) => {
          if (!card) {
            return null
          }
          const stop = stops && stops.find(st => st.stop_id === card.stopId)
          cumulativeTravelTime += card.defaultDwellTime + card.defaultTravelTime
          return (
            // $FlowFixMe
            <PatternStopCard
              active={patternStop.id === card.id || (stopNotFound && patternStop.index === i)}
              activePattern={activePattern}
              addStopToPattern={addStopToPattern}
              cumulativeTravelTime={cumulativeTravelTime}
              dropCard={this.dropCard}
              feedSource={feedSource}
              findCard={this.findCard}
              id={card.id}
              index={i}
              key={card.id}
              moveCard={this.moveCard}
              patternEdited={patternEdited}
              patternStop={card}
              removeStopFromPattern={removeStopFromPattern}
              saveActiveGtfsEntity={saveActiveGtfsEntity}
              setActiveEntity={setActiveEntity}
              setActiveStop={setActiveStop}
              status={status}
              stop={stop}
              updateActiveGtfsEntity={updateActiveGtfsEntity} // fallback to index if/when id changes
              updatePatternStops={updatePatternStops} />
          )
        })}
      </div>
    )
  }
}

const dropTargetCollect = (connect) => ({connectDropTarget: connect.dropTarget()})

export default DragDropContext(HTML5Backend)(DropTarget('card', cardTarget, dropTargetCollect)(PatternStopContainer))
