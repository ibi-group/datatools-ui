import Icon from '@conveyal/woonerf/components/icon'
import Immutable from 'immutable'
import React, {Component, PropTypes} from 'react'
import {Button, FormControl} from 'react-bootstrap/lib'
import {Table, Column} from 'react-virtualized/dist/commonjs/Table'
import {AutoSizer} from 'react-virtualized/dist/commonjs/AutoSizer'

import {getConfigProperty} from '../../common/util/config'
import EntityListButtons from './EntityListButtons'
import EntityListSecondaryActions from './EntityListSecondaryActions'

export default class EntityList extends Component {
  static propTypes = {
    activeComponent: PropTypes.string.isRequired,
    activeEntity: PropTypes.object,
    activeEntityId: PropTypes.string,
    deleteEntity: PropTypes.func.isRequired,
    enterTimetableEditor: PropTypes.func,
    entities: PropTypes.array,
    feedSource: PropTypes.object,
    list: PropTypes.instanceOf(Immutable.List),
    newGtfsEntity: PropTypes.func.isRequired,
    setActiveEntity: PropTypes.func.isRequired,
    updateActiveEntity: PropTypes.func.isRequired,
    updateEntitySort: PropTypes.func,
    width: PropTypes.number.isRequired
  }

  state = {}

  componentWillReceiveProps (nextProps) {
    let fromIndex, toIndex
    // set state indexes to undefined when active table (component) changes
    if (nextProps.activeComponent !== this.props.activeComponent) {
      this.setState({fromIndex, toIndex})
    }
  }

  _getRowStyle = ({index}) => {
    const {fromIndex, toIndex} = this.state
    const activeColor = '#F2F2F2'
    const rowStyle = {
      borderBottom: 'solid 1px #ddd',
      cursor: 'pointer',
      outline: 'none'
    }
    const isSelected = typeof fromIndex !== 'undefined' &&
      typeof toIndex !== 'undefined' &&
      index >= fromIndex &&
      index <= toIndex
    if (this._getRow({index}) && (this._getRow({index}).isActive || isSelected)) {
      rowStyle.backgroundColor = activeColor
    }
    return rowStyle
  }

  updateIndexes = (fromIndex, toIndex) => {
    this.setState({fromIndex, toIndex})
  }

  _getRow = ({index}) => this.props.list.get(index)

  _onChangeSort = evt => this.props.updateEntitySort({key: evt.target.value})

  _onClickTimetableEditor = () => this.props.enterTimetableEditor()

  _onClickNew = () => this.props.newGtfsEntity(this.props.feedSource.id, this.props.activeComponent)

  _onRowClick = ({event, index}) => {
    const {shiftKey} = event
    const {activeComponent, activeEntity, feedSource, list, setActiveEntity} = this.props
    let fromIndex, toIndex

    // handle selection of multiple items (for multiple delete, merge, etc.)
    if (shiftKey && activeEntity && !this._getRow({index}).isActive) {
      const selectedIndex = list.findIndex(e => e.id === activeEntity.id)
      fromIndex = selectedIndex > index ? index : selectedIndex
      toIndex = selectedIndex < index ? index : selectedIndex
      setActiveEntity(feedSource.id, activeComponent)
    } else if (this._getRow({index}).isActive) {
      setActiveEntity(feedSource.id, activeComponent)
    } else {
      setActiveEntity(feedSource.id, activeComponent, this._getRow({index}))
    }
    this.setState({fromIndex, toIndex})
  }
  // TODO: add hover to row rendering
  // _rowRenderer (props) {
  //
  // }
  render () {
    const {
      tableView,
      width,
      activeEntity,
      activeComponent,
      hasRoutes,
      feedSource,
      sort,
      list
    } = this.props
    const createDisabled = list.findIndex(e => e.id === 'new') !== -1
    const sidePadding = '5px'
    const panelWidth = !tableView ? `${width}px` : '100%'
    const panelStyle = {
      width: panelWidth,
      height: '100%',
      position: 'absolute',
      left: '0px',
      zIndex: 1,
      backgroundColor: 'white',
      paddingRight: '0px',
      paddingLeft: sidePadding
    }
    const HEADER_HEIGHT = 80
    const headerStyle = {
      paddingRight: sidePadding,
      marginBottom: '5px',
      height: `${HEADER_HEIGHT}px`,
      paddingTop: sidePadding
    }
    let activeIndex
    if (activeEntity) {
      activeIndex = list.findIndex(e => e.id === activeEntity.id)
    }
    const entityList = list.size
    ? <AutoSizer disableWidth>
      {({ height }) => (
        <Table
          width={width - 5}
          height={height - HEADER_HEIGHT - 45} // some magical number that seems to work
          key={`${feedSource.id}-${activeComponent}-table`}
          disableHeader
          headerHeight={20}
          rowHeight={25}
          style={{outline: 'none'}}
          scrollToIndex={activeIndex}
          sortBy={sort.key}
          sortDirection={sort.direction}
          rowClassName='noselect'
          rowStyle={this._getRowStyle}
          rowCount={list.size}
          onRowClick={this._onRowClick}
          rowGetter={this._getRow}>
          <Column
            label='Name'
            dataKey='name'
            className='small entity-list-row'
            style={{outline: 'none'}}
            width={width - 5} />
          {/* Add hidden columns to allow for sorting of list */}
          {list.size && Object.keys(list.get(0)).map(key => {
            return (
              <Column
                key={key}
                label={key}
                dataKey={key}
                style={{display: 'none'}}
                width={0} />
            )
          })}
        </Table>
      )}
    </AutoSizer>
      : <div style={{marginTop: '20px'}} className='text-center'>
        <Button
          bsSize='small'
          disabled={createDisabled}
          onClick={this._onClickNew}>
          <Icon type='plus' /> Create first {activeComponent === 'scheduleexception' ? 'exception' : activeComponent}
        </Button>
      </div>
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          {/* Entity list sort key select */}
          {getConfigProperty('application.dev') && <FormControl
            onChange={this._onChangeSort}
            value={sort.key}
            componentClass='select'>
            {list.size && Object.keys(list.get(0)).map(key => (
              <option value={key} key={key}>{key}</option>
            ))}
          </FormControl>}
          <EntityListButtons
            fromIndex={this.state.fromIndex}
            toIndex={this.state.toIndex}
            list={list}
            updateIndexes={this.updateIndexes}
            {...this.props} />
          {activeComponent === 'calendar' || activeComponent === 'scheduleexception'
            ? <Button
              style={{marginTop: '10px'}}
              block
              disabled={!hasRoutes}
              onClick={this._onClickTimetableEditor}>
              <Icon type='calendar' /> Edit schedules
            </Button>
            : null
          }
          {/* Table view button */}
        </div>
        <EntityListSecondaryActions {...this.props} />
        {!tableView
          ? entityList
          : null // GtfsTable fully removed from repo, last available at fe29528569f5f64c23a49d2af0bd224f3d63d010
        }
      </div>
    )
  }
}
