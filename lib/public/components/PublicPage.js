// @flow

import React, {Component, type Node} from 'react'

import CurrentStatusMessage from '../../common/containers/CurrentStatusMessage'
import ConfirmModal from '../../common/components/ConfirmModal'
import SelectFileModal from '../../common/components/SelectFileModal'
import Title from '../../common/components/Title'
import ActivePublicHeader from '../containers/ActivePublicHeader'

type Props = {
  children?: Node
}

export default class PublicPage extends Component<Props> {
  showConfirmModal (props: any) {
    this.refs.confirmModal.open(props)
  }

  showSelectFileModal (props: any) {
    this.refs.selectFileModal.open(props)
  }

  render () {
    return (
      <div>
        <Title />
        <ActivePublicHeader />
        {this.props.children}
        <CurrentStatusMessage />
        <ConfirmModal ref='confirmModal' />
        <SelectFileModal ref='selectFileModal' />
      </div>
    )
  }
}
