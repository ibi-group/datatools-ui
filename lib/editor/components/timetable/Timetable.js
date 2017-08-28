import React, {Component, PropTypes} from 'react'
import {Button} from 'react-bootstrap'
import {ArrowKeyStepper} from 'react-virtualized/dist/commonjs/ArrowKeyStepper'
import {ScrollSync} from 'react-virtualized/dist/commonjs/ScrollSync'

import TimetableGrid from './TimetableGrid'
import Loading from '../../../common/components/Loading'
import {getHeaderColumns, isTimeFormat} from '../../util/timetable'

export default class Timetable extends Component {
  static propTypes = {
    columns: PropTypes.array,
    data: PropTypes.array
  }

  state = {
    activeCell: null // 'rowNum-colNum', e.g. 0-1
  }

  updateScroll = (scrollToRow, scrollToColumn) => this.keyStepper.setScrollIndexes({scrollToRow, scrollToColumn})

  setActiveCell = (activeCell) => this.setState({activeCell})

  cellValueInvalid = (col, value, previousValue) => isTimeFormat(col.type) && value >= 0 && value < previousValue

  render () {
    const {addNewRow, timetable, scrollToRow, scrollToColumn, updateCellValue} = this.props
    const {columns, trips: data, selected, hideDepartureTimes} = timetable
    // if no columns (and no data), page is still loading
    if (columns.length === 0 && data.length === 0) {
      return (
        <div style={{marginTop: '20px'}}>
          <Loading />
        </div>
      )
    } else if (data.length === 0) {
      // if no data, then no trips have been created
      return (
        <div>
          <p className='text-center lead'>
            No trips for calendar.
            {' '}
            <Button
              bsStyle='success'
              onClick={addNewRow}>
              Add new trip.
            </Button>
          </p>
        </div>
      )
    }
    const {activeCell} = this.state
    const columnCount = hideDepartureTimes ? getHeaderColumns(columns).length : columns.length
    return (
      <ScrollSync>
        {(syncProps) => {
          // syncProps include the following: { clientHeight, clientWidth, onScroll, scrollHeight, scrollLeft, scrollTop, scrollWidth }
          return (
            <div>
              <ArrowKeyStepper
                columnCount={columnCount}
                mode={'cells'}
                ref={ArrowKeyStepper => { this.keyStepper = ArrowKeyStepper }}
                disabled={activeCell !== null}
                scrollToColumn={scrollToColumn} // initial value
                scrollToRow={scrollToRow} // initial value
                rowCount={data.length}>
                {(stepperProps) => (
                  // stepperProps include: { onSectionRendered, scrollToColumn, scrollToRow }
                  <TimetableGrid
                    activeCell={activeCell}
                    data={data}
                    selected={selected}
                    updateScroll={this.updateScroll}
                    updateCellValue={updateCellValue}
                    columns={columns}
                    hideDepartureTimes={hideDepartureTimes}
                    setActiveCell={this.setActiveCell}
                    {...this.props}
                    {...stepperProps}
                    {...syncProps} />
                )}
              </ArrowKeyStepper>
            </div>
          )
        }}
      </ScrollSync>
    )
  }
}
