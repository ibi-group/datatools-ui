import React, {Component, PropTypes} from 'react'
import update from 'react-addons-update'
import {Button} from 'react-bootstrap'
import clone from 'lodash.clonedeep'
import objectPath from 'object-path'

import { isTimeFormat } from '../../util/timetable'
import TimetableHeader from './TimetableHeader'
import Timetable from './Timetable'

export default class TimetableEditor extends Component {
  static propTypes = {
    route: PropTypes.object,
    activePatternId: PropTypes.string,
    activeScheduleId: PropTypes.string,
    feedSource: PropTypes.object,
    saveTripsForCalendar: PropTypes.func,
    tableData: PropTypes.object
  }

  state = {
    activeCell: null, // 'rowNum-colNum', e.g. 0-1
    // rows: [{block: 0, gtfsTripId: 'trp', tripHeadsign: 'trip'}],
    edited: [],
    selected: [],
    offsetSeconds: 0
  }

  _onResize = () => this.setState({width: window.innerWidth, height: window.innerHeight})

  _createNewCalendar = (e) => this.props.setActiveEntity(this.props.feedSource.id, 'calendar', {id: 'new'})

  componentWillMount () {
    this._onResize()
  }

  componentDidMount () {
    window.addEventListener('resize', this._onResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._onResize)
  }

  constructNewRow = (toClone = null) => {
    const activePattern = this.props.route && this.props.route.tripPatterns ? this.props.route.tripPatterns.find(p => p.id === this.props.activePatternId) : null
    const newRow = toClone ? clone(toClone) || {} : {}
    if (toClone) {
      objectPath.set(newRow, 'id', 'new')
      objectPath.set(newRow, 'gtfsTripId', null)
      return newRow
    }
    // set starting time for first arrival
    let cumulativeTravelTime = !toClone ? 0 : objectPath.get(newRow, `stopTimes.0.arrivalTime`)

    // TODO: auto-add offset to any new trip?  No, for now. Add toggle/checkbox that allows for this.
    // cumulativeTravelTime += this.props.timetable.offset

    for (let i = 0; i < activePattern.patternStops.length; i++) {
      const stop = activePattern.patternStops[i]
      // if stopTime null/undefined, set as new object
      if (!objectPath.get(newRow, `stopTimes.${i}`)) {
        objectPath.set(newRow, `stopTimes.${i}`, {})
      }
      objectPath.set(newRow, `stopTimes.${i}.stopId`, stop.stopId)
      cumulativeTravelTime += +stop.defaultTravelTime

      // only set time if timepoint set to true or null
      // if (stop.timepoint === null || stop.timepoint) {
      objectPath.set(newRow, `stopTimes.${i}.arrivalTime`, cumulativeTravelTime)
      // }
      cumulativeTravelTime += +stop.defaultDwellTime
      // if (stop.timepoint === null || stop.timepoint) {
      objectPath.set(newRow, `stopTimes.${i}.departureTime`, cumulativeTravelTime)
      // }
    }
    for (let i = 0; i < this.props.timetable.columns.length; i++) {
      const col = this.props.timetable.columns[i]
      if (isTimeFormat(col.type)) {
        // TODO: add default travel/dwell times to new rows
        // objectPath.ensureExists(newRow, col.key, 0)
      } else {
        objectPath.ensureExists(newRow, col.key, null)
      }
    }
    // important: set id to "new"
    objectPath.set(newRow, 'id', 'new')
    objectPath.set(newRow, 'gtfsTripId', null)
    objectPath.set(newRow, 'useFrequency', activePattern.useFrequency)
    objectPath.set(newRow, 'feedId', this.props.feedSource.id)
    objectPath.set(newRow, 'patternId', activePattern.id)
    objectPath.set(newRow, 'routeId', activePattern.routeId)
    objectPath.set(newRow, 'calendarId', this.props.activeScheduleId)

    return newRow
  }

  duplicateRows = (indexArray) => {
    // const {activePattern, activeScheduleId} = this.props
    const arrayAscending = indexArray.sort((a, b) => {
      return a - b
    })
    const lastIndex = this.props.timetable.trips.length - 1
    for (var i = 0; i < arrayAscending.length; i++) {
      const index = arrayAscending[i]
      const toClone = this.props.timetable.trips[index]
      const newRow = this.constructNewRow(toClone)
      const stateUpdate = {
        activeCell: {$set: null},
        scrollToRow: {$set: lastIndex + arrayAscending.length}, // increment selected row
        scrollToColumn: {$set: 0}
      }
      // TODO: replace addNewTrip with func that saves trip via POST
      // this.props.addNewTrip(activePattern.feedId, activePattern, activeScheduleId, newRow)
      this.props.addNewTrip(newRow)
      this.setState(update(this.state, stateUpdate))
    }
  }

  addNewRow = (blank = false, scroll = false) => {
    // const {activePattern, activeScheduleId} = this.props
    // set blank to true if there are no rows to clone
    blank = blank || this.props.timetable.trips.length === 0
    const lastIndex = this.props.timetable.trips.length - 1
    const clone = blank ? null : this.props.timetable.trips[lastIndex]
    const newRow = this.constructNewRow(clone)

    const stateUpdate = {
      activeCell: {$set: null},
      scrollToRow: {$set: lastIndex + 1}, // increment selected row
      scrollToColumn: {$set: 0}
    }
    // TODO: replace addNewTrip with func that saves trip via POST
    // this.props.addNewTrip(activePattern.feedId, activePattern, activeScheduleId, newRow)
    this.props.addNewTrip(newRow)
    if (scroll) {
      this.setState(update(this.state, stateUpdate))
    }
  }

  removeSelectedRows = () => {
    const indexes = []
    const tripsToDelete = []
    const newRows = [...this.props.timetable.trips]
    const selectedDescending = this.props.timetable.selected.sort((a, b) => {
      return b - a
    })
    // loop over selected array in descending order to ensure that indexes operates on indexes in reverse
    for (var i = 0; i < selectedDescending.length; i++) {
      const rowIndex = selectedDescending[i]

      // removed.push([this.props.selected[i], 1])
      const row = newRows[rowIndex]
      if (row.id === 'new') {
        indexes.push([rowIndex, 1])
      } else {
        tripsToDelete.push(row)
      }
    }
    if (tripsToDelete.length > 0) {
      this.props.deleteTripsForCalendar(this.props.feedSource.id, this.props.activePattern, this.props.activeScheduleId, tripsToDelete)
    }
    this.props.removeTrips(indexes)
    this.props.toggleAllRows(false)
  }

  saveEditedTrips = (pattern, activeScheduleId) => {
    const trips = []
    const tripIndexes = []
    for (var i = 0; i < this.props.timetable.edited.length; i++) {
      const rowIndex = this.props.timetable.edited[i]
      if (tripIndexes.indexOf(rowIndex) === -1) {
        const trip = this.props.timetable.trips[rowIndex]
        if (trip) {
          trips.push(trip)
          tripIndexes.push(rowIndex)
        }
      }
    }
    this.props.saveTripsForCalendar(this.props.feedSource.id, pattern, activeScheduleId, trips)
      .then((errorIndexes) => {
        console.log('errors for trips', errorIndexes)
        const edited = []
        for (var i = 0; i < errorIndexes.length; i++) {
          edited.push(this.props.timetable.edited[errorIndexes[i]])
        }
        console.log(edited)
        const stateUpdate = {
          edited: {$set: edited}
        }
        this.setState(update(this.state, stateUpdate))
      })
  }

  isDataValid (col, value, previousValue) {
    if (isTimeFormat(col.type)) {
      return value && value >= 0 && value < previousValue
    } else {
      return true
    }
  }

  render () {
    const {activePattern, activeSchedule, toggleAllRows, toggleRowSelection} = this.props
    const {height, scrollToColumn, scrollToRow} = this.state

    const panelStyle = {
      backgroundColor: 'white',
      paddingRight: '5px',
      paddingLeft: '5px'
    }
    const HEADER_HEIGHT = 118
    return (
      <div
        style={panelStyle}
        className='timetable-editor'>
        <TimetableHeader
          activePattern={activePattern}
          removeSelectedRows={this.removeSelectedRows}
          addNewRow={this.addNewRow}
          duplicateRows={this.duplicateRows}
          saveEditedTrips={this.saveEditedTrips}
          {...this.props} />
        {activeSchedule
          ? <Timetable
            style={{height: `${height - HEADER_HEIGHT - 50}px`}}
            constructNewRow={this.constructNewRow}
            addNewRow={this.addNewRow}
            toggleRowSelection={toggleRowSelection}
            toggleAllRows={toggleAllRows}
            scrollToRow={scrollToRow}
            scrollToColumn={scrollToColumn}
            {...this.props} />
          : <p className='lead text-center'>
            {activePattern
              ? <span>
                Choose a calendar to edit timetables or
                {' '}
                <Button
                  bsStyle='success'
                  onClick={this._createNewCalendar}
                  >create a new one
                </Button>
              </span>
              : <span>Choose a trip pattern.</span>
            }
          </p>
        }
      </div>
    )
  }
}
