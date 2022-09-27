// @flow

import * as React from 'react'
import { Button, OverlayTrigger } from 'react-bootstrap'

type Props = {
  active?: boolean,
  children: React.Node,
  onClick?: any => any,
  onDeselect?: any => any,
  tooltip?: React.Node,
  value: string | number | boolean
}

export default class OptionButton extends React.Component<Props> {
  _onClick = () => {
    const { active, onClick, onDeselect, value } = this.props
    if (!active) {
      if (onClick) {
        onClick(value)
      }
    } else {
      if (onDeselect) {
        onDeselect(value)
      }
    }
  }

  render () {
    const { children, tooltip, onDeselect, ...other } = this.props
    const button = (
      <Button
        {...other}
        href='#' // required for button width to appear correctly
        onClick={this._onClick}>
        {children}
      </Button>
    )
    if (tooltip) {
      return (
        <OverlayTrigger
          placement='bottom'
          overlay={tooltip}>
          {button}
        </OverlayTrigger>
      )
    } else {
      return button
    }
  }
}
