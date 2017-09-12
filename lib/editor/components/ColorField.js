import React, {PropTypes, Component} from 'react'
import {FormGroup} from 'react-bootstrap'
import SketchPicker from 'react-color/lib/components/sketch/Sketch'

import ClickOutside from '../../common/components/ClickOutside'

export default class ColorField extends Component {
  static propTypes = {
    field: PropTypes.object,
    formProps: PropTypes.object,
    label: PropTypes.any,
    onChange: PropTypes.func,
    value: PropTypes.number
  }

  state = {
    color: {r: '241', g: '112', b: '19', a: '1'} // default color
  }

  _handleClick = (e) => {
    e.preventDefault()
    this.setState({ open: !this.state.open })
  }

  _handleClose = () => {
    this.setState({ open: !this.state.open })
  }

  render () {
    const {formProps, label, value} = this.props
    const hexColor = value !== null ? `#${value}` : '#000000'
    const colorStyle = {
      width: '36px',
      height: '20px',
      borderRadius: '2px',
      background: hexColor
    }
    const styles = {
      swatch: {
        padding: '5px',
        marginRight: '30px',
        background: '#fff',
        borderRadius: '4px',
        display: 'inline-block',
        cursor: 'pointer'
      },
      popover: {
        position: 'absolute',
        zIndex: '200'
      },
      cover: {
        position: 'fixed',
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    }
    return (
      <FormGroup {...formProps}>
        {label}
        <button
          style={styles.swatch}
          onClick={this._handleClick}>
          <div style={colorStyle} />
        </button>
        {this.state.open
          ? <ClickOutside
            onClickOutside={this._handleClose}>
            <SketchPicker
              color={hexColor}
              onChange={this.props.onChange || this.onChange} />
          </ClickOutside>
          : null
        }
      </FormGroup>
    )
  }
}
