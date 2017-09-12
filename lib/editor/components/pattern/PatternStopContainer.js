import React, { Component, PropTypes } from 'react'
import update from 'react/lib/update'
import { shallowEqual } from 'react-pure-render'
import PatternStopCard from './PatternStopCard'
import { DropTarget, DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'

/*  This component and its child components (Card.js) are based on the react-dnd sortable
    example found here: http://gaearon.github.io/react-dnd/examples-sortable-cancel-on-drop-outside.html
*/
const cardTarget = {
  drop () {}
}

class PatternStopContainer extends Component {
  static propTypes = {
    connectDropTarget: PropTypes.func.isRequired,
    activePattern: PropTypes.object.isRequired,
    updateActiveEntity: PropTypes.func,
    stops: PropTypes.array,
    cardStyle: PropTypes.object,
    patternEdited: PropTypes.bool.isRequired,
    addStopToPattern: PropTypes.func.isRequired,
    removeStopFromPattern: PropTypes.func.isRequired,
    saveActiveEntity: PropTypes.func.isRequired,
    setActiveEntity: PropTypes.func.isRequired
  }

  state = {
    cards: this.props.activePattern.patternStops
  }

  componentWillReceiveProps (nextProps) {
    // Updates cards when pattern stops order changes (does not account for changes to default travel/dwell times)
    if (nextProps.activePattern.patternStops && !shallowEqual(nextProps.activePattern.patternStops, this.props.activePattern.patternStops)) {
      this.setState({cards: nextProps.activePattern.patternStops})
    }
  }

  dropCard = () => {
    const patternStops = [...this.state.cards]
    const pattern = Object.assign({}, this.props.activePattern)
    pattern.patternStops = patternStops
    this.props.updateActiveEntity(this.props.activePattern, 'trippattern', {patternStops})
    this.props.saveActiveEntity('trippattern')
  }

  moveCard = (id, atIndex) => {
    const { card, index } = this.findCard(id)
    this.setState(update(this.state, {
      cards: {
        $splice: [
          [index, 1],
          [atIndex, 0, card]
        ]
      }
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
      cardStyle,
      connectDropTarget,
      patternStop,
      saveActiveEntity,
      feedSource,
      patternEdited,
      setActiveStop,
      status,
      stops,
      updateActiveEntity,
      addStopToPattern,
      removeStopFromPattern,
      setActiveEntity
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
          const stop = stops && stops.find(st => st.id === card.stopId)
          cumulativeTravelTime += card.defaultDwellTime + card.defaultTravelTime
          return (
            <PatternStopCard
              key={card.id}
              id={card.id}
              index={i}
              style={cardStyle}
              cumulativeTravelTime={cumulativeTravelTime}
              stop={stop}
              status={status}
              feedSource={feedSource}
              activePattern={activePattern}
              patternEdited={patternEdited}
              updateActiveEntity={updateActiveEntity}
              saveActiveEntity={saveActiveEntity}
              addStopToPattern={addStopToPattern}
              removeStopFromPattern={removeStopFromPattern}
              setActiveEntity={setActiveEntity}
              patternStop={card}
              moveCard={this.moveCard}
              findCard={this.findCard}
              dropCard={this.dropCard}
              active={patternStop.id === card.id || (stopNotFound && patternStop.index === i)} // fallback to index if/when id changes
              setActiveStop={setActiveStop} />
          )
        })}
      </div>
    )
  }
}

// TODO: Verify correct order
export default DragDropContext(HTML5Backend)(DropTarget('card', cardTarget, (connect) => ({connectDropTarget: connect.dropTarget()}))(PatternStopContainer))
