import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Button } from 'react-bootstrap'

export default class CreateAlert extends Component {
  static propTypes = {
    createAlert: PropTypes.func,
    disabled: PropTypes.bool,
    fetched: PropTypes.bool,
    style: PropTypes.object
  }
  render () {
    const {
      createAlert,
      disabled,
      fetched,
      style
    } = this.props
    const createDisabled = disabled != null
      ? disabled || !fetched
      : false
    return (
      <Button
        bsStyle='primary'
        bsSize='large'
        style={style}
        disabled={createDisabled}
        onClick={createAlert}
        className='pull-right'>
        {fetched
          ? 'New Alert'
          : <span>Fetching alerts <Icon className='fa-spin' type='refresh' /></span>
        }
      </Button>
    )
  }
}
