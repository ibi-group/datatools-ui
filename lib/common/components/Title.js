// @flow

import {Component} from 'react'

type Props = {
  children: string
}

export default class Title extends Component<Props> {
  componentWillMount () {
    document.title = this.props.children
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.children !== this.props.children) {
      document.title = nextProps.children
    }
  }

  render () {
    return null
  }
}
