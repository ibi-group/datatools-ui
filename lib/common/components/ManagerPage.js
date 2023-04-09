// @flow

import * as React from 'react'

import CurrentStatusMessage from '../containers/CurrentStatusMessage'
import CurrentStatusModal from '../containers/CurrentStatusModal'
import ActiveSidebar from '../containers/ActiveSidebar'
import ActiveSidebarNavItem from '../containers/ActiveSidebarNavItem'
import PageContent from '../containers/PageContent'
import { getConfigProperty, isModuleEnabled } from '../util/config'

import ConfirmModal from './ConfirmModal'
import SelectFileModal from './SelectFileModal'
import Title from './Title'
import InfoModal from './InfoModal'

type Props = {
  children?: React.Node,
  title?: string
}

export default class ManagerPage extends React.Component<Props> {
  showInfoModal (props: any) {
    this.refs.infoModal.open(props)
  }

  showConfirmModal (props: any) {
    this.refs.confirmModal.open(props)
  }

  showSelectFileModal (props: any) {
    this.refs.selectFileModal.open(props)
  }

  isActive (path: string) {
    return window.location.pathname.split('/')[1] === path
  }

  render () {
    const {title} = this.props
    const homeIsActive = this.isActive('home') || this.isActive('feed') || this.isActive('project')
    const appTitle = getConfigProperty('application.title') || 'Data Tools'
    const changelogUrl: ?string = getConfigProperty('application.changelog_url')
    const docsUrl: ?string = getConfigProperty('application.docs_url')
    const supportEmail: ?string = getConfigProperty('application.support_email')
    return (
      <div>
        <Title>{`${appTitle}${title ? ` - ${title}` : ''}`}</Title>
        <CurrentStatusMessage />
        <ConfirmModal ref='confirmModal' />
        <InfoModal ref='infoModal' />
        <SelectFileModal ref='selectFileModal' />
        <CurrentStatusModal ref='statusModal' />
        <ActiveSidebar>
          <ActiveSidebarNavItem
            icon='home'
            label='Home'
            link={`/home`}
            active={homeIsActive} />
          {isModuleEnabled('alerts')
            ? <ActiveSidebarNavItem
              icon='exclamation-circle'
              label='Alerts'
              link={`/alerts`}
              active={this.isActive('alerts')} />
            : null
          }
        </ActiveSidebar>
        <PageContent>
          <div
            style={{
              padding: '20px',
              paddingBottom: '40px',
              minHeight: '100%',
              marginBottom: '-40px',
              // minHeight: '500px',
              position: 'relative'
            }}
          >
            {this.props.children}
          </div>

          <footer className='manager-footer'>
            <div className='container'>
              <p className='text-center text-muted' style={{marginTop: 10, marginBottom: 0}}>
                <span role='img' title='Copyright' aria-label='copyright'>
                  &copy;
                </span>{' '}
                <a href='https://conveyal.com'>Conveyal</a>{'\n'}
              </p>
            </div>
          </footer>
        </PageContent>

      </div>
    )
  }
}
