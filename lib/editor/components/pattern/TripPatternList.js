import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Collapse, Table } from 'react-bootstrap'

import Loading from '../../../common/components/Loading'
import TripPatternViewer from './TripPatternViewer'
import TripPatternListControls from './TripPatternListControls'

export default class TripPatternList extends Component {
  static propTypes = {
    stops: PropTypes.array,

    updateActiveEntity: PropTypes.func.isRequired,
    saveActiveEntity: PropTypes.func.isRequired,
    updateEditSetting: PropTypes.func.isRequired,
    resetActiveEntity: PropTypes.func.isRequired,
    setActiveEntity: PropTypes.func.isRequired,
    setActiveStop: PropTypes.func.isRequired,
    patternEdited: PropTypes.bool.isRequired,
    status: PropTypes.object.isRequired,
    cloneEntity: PropTypes.func.isRequired,
    deleteEntity: PropTypes.func.isRequired,
    newGtfsEntity: PropTypes.func.isRequired,
    undoActiveTripPatternEdits: PropTypes.func,

    showConfirmModal: PropTypes.func,

    editSettings: PropTypes.object,
    entity: PropTypes.object,
    activeEntity: PropTypes.object,
    feedSource: PropTypes.object,
    mapState: PropTypes.object,

    subEntityId: PropTypes.string,
    currentPattern: PropTypes.object
  }

  render () {
    const { activeEntity, activePatternId } = this.props
    if (!activeEntity.tripPatterns) {
      return <Loading />
    }
    const sidePadding = '5px'
    const panelWidth = '300px'
    const panelStyle = {
      width: panelWidth,
      height: '85%',
      position: 'absolute',
      left: '0px',
      overflowY: 'scroll',
      zIndex: 99,
      paddingRight: '1px',
      paddingLeft: sidePadding
    }
    return (
      <div style={panelStyle}>
        <TripPatternListControls {...this.props} />
        <div
          style={{
            height: '100%',
            overflowY: 'scroll'
          }}>
          <Table hover>
            <tbody>
              {activeEntity.tripPatterns
                ? activeEntity.tripPatterns.map((pattern) => (
                  <PatternRow
                    pattern={pattern}
                    key={pattern.id}
                    active={activePatternId && pattern.id === activePatternId}
                    route={activeEntity}
                    {...this.props} />
                ))
                : <tr><td><Icon className='fa-spin' type='refresh' /></td></tr>
              }
            </tbody>
          </Table>
        </div>
      </div>
    )
  }
}

class PatternRow extends Component {
  static propTypes = {
    active: PropTypes.bool,
    feedSource: PropTypes.object,
    pattern: PropTypes.object,
    route: PropTypes.object,
    setActiveEntity: PropTypes.func
  }
  _onKeyDown = (e) => {
    if (document.activeElement === e.target && e.which === 13) {
      this._selectRow()
    }
  }

  _selectRow = () => {
    const {active, feedSource, pattern, route, setActiveEntity} = this.props
    if (active) setActiveEntity(feedSource.id, 'route', route, 'trippattern')
    else setActiveEntity(feedSource.id, 'route', route, 'trippattern', pattern)
  }

  render () {
    const {active, pattern} = this.props
    const rowStyle = {
      paddingTop: 5,
      paddingBottom: 5
    }
    const activeColor = '#fff'
    const activeRowStyle = {
      backgroundColor: activeColor,
      paddingTop: 5,
      paddingBottom: 5
    }
    const patternName = `${`${pattern.name.length > 29 ? pattern.name.substr(0, 29) + '...' : pattern.name}`} ${pattern.patternStops ? `(${pattern.patternStops.length} stops)` : ''}`
    return (
      <tr style={rowStyle}>
        <td style={active ? activeRowStyle : rowStyle}>
          <div
            className='small'
            role='button'
            tabIndex={0}
            title={pattern.name}
            onClick={this._selectRow}
            onKeyDown={this._onKeyDown}>
            <Icon type={active ? 'caret-down' : 'caret-right'} />
            {pattern.name ? ` ${patternName}` : ' [Unnamed]'}
          </div>
          <Collapse
            in={active}
            style={{borderRight: '1px solid #ddd'}}>
            {active && pattern
              ? <TripPatternViewer {...this.props} />
              : <div />
            }
          </Collapse>
        </td>
      </tr>
    )
  }
}
