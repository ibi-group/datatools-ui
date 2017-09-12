import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Button } from 'react-bootstrap'
import { updateStar } from '../../manager/actions/user'
import { connect } from 'react-redux'

import { getComponentMessages, getMessage } from '../util/config'

class StarButton extends Component {
  static propTypes = {
    isStarred: PropTypes.bool
  }

  _onClick = () => {
    const {dispatch, isStarred, user, target} = this.props
    dispatch(updateStar(user.profile, target, !isStarred))
  }

  render () {
    const {isStarred} = this.props
    const messages = getComponentMessages('StarButton')

    return (
      <Button
        onClick={this._onClick}>
        {isStarred
          ? <span><Icon type='star-o' /> {getMessage(messages, 'unstar')}</span>
          : <span><Icon type='star' /> {getMessage(messages, 'star')}</span>
        }
      </Button>
    )
  }
}

export default connect()(StarButton)
