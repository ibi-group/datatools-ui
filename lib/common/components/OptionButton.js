import React, {PropTypes, Component} from 'react'
import {Button} from 'react-bootstrap'

export default class OptionButton extends Component {
  static propTypes = {
    active: PropTypes.bool,
    onClick: PropTypes.func,
    value: PropTypes.any.isRequired
  }

  _onClick = () => {
    const {active, onClick, value} = this.props
    if (!active) {
      onClick && onClick(value)
    }
  }

  render () {
    return (
      <Button
        {...this.props}
        href='#' // required for button width to appear correctly
        onClick={this._onClick}>
        {this.props.children}
      </Button>
    )
  }
}
