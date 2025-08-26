// @flow

import { Component } from 'react'

import { getAppName } from '../../common/util/config'

type Props = {
  subTitle?: ?string
}

function makeTitle (subTitle?: ?string): string {
  return `${getAppName()}${subTitle ? ` - ${subTitle}` : ''}`
}

export default class Title extends Component<Props> {
  componentWillMount () {
    document.title = makeTitle(this.props.subTitle)
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.subTitle !== this.props.subTitle) {
      document.title = makeTitle(this.props.subTitle)
    }
  }

  render () {
    return null
  }
}
