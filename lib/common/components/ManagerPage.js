// @flow

import * as React from 'react'

import { getComponentMessages, getConfigProperty, isModuleEnabled } from '../../common/util/config'
import CurrentStatusMessage from '../containers/CurrentStatusMessage'
import CurrentStatusModal from '../containers/CurrentStatusModal'
import ActiveSidebar from '../containers/ActiveSidebar'
import ActiveSidebarNavItem from '../containers/ActiveSidebarNavItem'
import PageContent from '../containers/PageContent'

import ConfirmModal from './ConfirmModal'
import InfoModal from './InfoModal'
import SelectFileModal from './SelectFileModal'
import Title from './Title'

type Props = {
  children?: React.Node,
  itemToLock?: string,
  title?: string
}

export default class ManagerPage extends React.Component<Props> {
  messages = getComponentMessages('ManagerPage')

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
    const {itemToLock, title} = this.props
    const homeIsActive = this.isActive('home') || this.isActive('feed') || this.isActive('project')
    const appTitle = getConfigProperty('application.title') || this.messages('datatools')
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
        <CurrentStatusModal itemToLock={itemToLock} ref='statusModal' />
        <ActiveSidebar>
          <ActiveSidebarNavItem
            icon='home'
            label={this.messages('home')}
            link={`/home`}
            active={homeIsActive} />
          {isModuleEnabled('alerts')
            ? <ActiveSidebarNavItem
              icon='exclamation-circle'
              label={this.messages('alerts')}
              link={`/alerts`}
              active={this.isActive('alerts')} />
            : null
          }
        </ActiveSidebar>
        <PageContent>
          <div
            style={{
              padding: '20px',
              paddingBottom: '140px',
              minHeight: '100%',
              marginBottom: '-140px',
              // minHeight: '500px',
              position: 'relative'
            }}
          >
            {this.props.children}
          </div>

          <footer className='manager-footer'>
            <div className='container'>
              <ul className='list-inline text-center text-muted'>
                {changelogUrl && <li><a href={changelogUrl}>{this.messages('changelog')}</a></li>}
                {docsUrl && <li><a href={docsUrl}>{this.messages('guide')}</a></li>}
                {supportEmail && <li><a href={`mailto:${supportEmail}`}>{this.messages('contact')}</a></li>}
              </ul>
              <p className='text-center text-muted'>
                <span role='img' title={this.messages('copyright')} aria-label='copyright'>
                  &copy;
                </span>{' '}
                <a href='https://www.ibigroup.com'>IBI Group</a>
              </p>
            </div>
          </footer>
        </PageContent>

      </div>
    )
  }
}
