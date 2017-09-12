import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Button } from 'react-bootstrap'

export default class CreateAlert extends Component {
  static propTypes = {
    createSign: PropTypes.func,
    disabled: PropTypes.bool,
    fetched: PropTypes.bool
  }
  render () {
    const {
      createSign,
      disabled,
      fetched
    } = this.props
    const createDisabled = disabled != null
      ? disabled || !fetched
      : false
    return (
      <Button
        bsStyle='primary'
        bsSize='large'
        disabled={createDisabled}
        onClick={createSign}
        className='pull-right'>
        {fetched
          ? 'New Configuration'
          : <span>Fetching configurations <Icon className='fa-spin' type='refresh' /></span>
        }
      </Button>
    )
  }
}
