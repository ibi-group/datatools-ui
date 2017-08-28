import React, {PropTypes, Component} from 'react'
import { Nav, NavItem } from 'react-bootstrap'

import VirtualizedEntitySelect from './VirtualizedEntitySelect'

export default class EntityListSecondaryActions extends Component {
  static propTypes = {
    activeComponent: PropTypes.string,
    activeEntity: PropTypes.object,
    entities: PropTypes.array,
    feedSource: PropTypes.object,
    setActiveEntity: PropTypes.func
  }

  _onChangeEntity = (value) => {
    const {activeComponent, feedSource, setActiveEntity} = this.props
    if (!value) {
      setActiveEntity(feedSource.id, activeComponent)
    } else {
      setActiveEntity(feedSource.id, activeComponent, value.entity)
    }
  }

  _onSelectCalendar = () => {
    if (this.props.activeComponent !== 'calendar') {
      this.props.setActiveEntity(this.props.feedSource.id, 'calendar')
    }
  }

  // allow for ellipsis overflow rendering
  _optionRenderer = ({ focusedOption, focusedOptionIndex, focusOption, key, labelKey, option, options, selectValue, style, valueArray }) => {
    const className = ['VirtualizedSelectOption']
    if (option === focusedOption) {
      className.push('VirtualizedSelectFocusedOption')
    }
    if (option.disabled) {
      className.push('VirtualizedSelectDisabledOption')
    }
    const events = option.disabled
      ? {}
      : {
        onClick: () => selectValue(option),
        onMouseOver: () => focusOption(option)
      }
    return (
      <div
        key={key}
        className={className.join(' ')}
        style={{
          cursor: 'pointer',
          ...style
        }}
        {...events}>
        <span
          title={option.label}
          style={{
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            width: this.props.width,
            overflow: 'hidden'
          }}>
          {option.label}
        </span>
      </div>
    )
  }

  _onSelectException = () => {
    if (this.props.activeComponent !== 'scheduleexception') {
      this.props.setActiveEntity(this.props.feedSource.id, 'scheduleexception')
    }
  }

  render () {
    const {
      activeComponent,
      activeEntity,
      entities
    } = this.props
    switch (activeComponent) {
      case 'calendar':
      case 'scheduleexception':
        return (
          <Nav
            style={{marginBottom: '5px'}}
            bsStyle='pills'
            justified
            activeKey={activeComponent}
            onSelect={this.handleSelect}>
            <NavItem
              eventKey={'calendar'}
              onClick={this._onSelectCalendar}>
              Calendars
            </NavItem>
            <NavItem
              eventKey={'scheduleexception'}
              onClick={this._onSelectException}>
              Exceptions
            </NavItem>
          </Nav>
        )
      case 'route':
      case 'stop':
        return (
          <VirtualizedEntitySelect
            value={activeEntity && activeEntity.id}
            optionRenderer={this._optionRenderer}
            component={activeComponent}
            entities={entities}
            onChange={this._onChangeEntity} />
        )
      default:
        return null
    }
  }
}
