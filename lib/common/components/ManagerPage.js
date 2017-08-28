import React, {Component, PropTypes} from 'react'

import CurrentStatusMessage from '../containers/CurrentStatusMessage'
import CurrentStatusModal from '../containers/CurrentStatusModal'
import ConfirmModal from './ConfirmModal'
import SelectFileModal from './SelectFileModal'
import Title from './Title'
import InfoModal from './InfoModal'
import ActiveSidebar from '../containers/ActiveSidebar'
import ActiveSidebarNavItem from '../containers/ActiveSidebarNavItem'
import PageContent from '../containers/PageContent'

import { getConfigProperty, isModuleEnabled } from '../util/config'

export default class ManagerPage extends Component {
  static propTypes = {
    title: PropTypes.string
  }

  showInfoModal (props) {
    this.refs.infoModal.open(props)
  }
  showConfirmModal (props) {
    this.refs.confirmModal.open(props)
  }
  showSelectFileModal (props) {
    this.refs.selectFileModal.open(props)
  }
  isActive (path) {
    return window.location.pathname.split('/')[1] === path
  }
  render () {
    const subtitle = this.props.title ? ` - ${this.props.title}` : ''
    return (
      <div>
        <Title>{`${getConfigProperty('application.title')}${subtitle}`}</Title>
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
            active={this.isActive('home') || this.isActive('feed') || this.isActive('project')} />
          {isModuleEnabled('alerts')
            ? <ActiveSidebarNavItem
              icon='exclamation-circle'
              label='Alerts'
              link={`/alerts`}
              active={this.isActive('alerts')} />
            : null
          }
          {isModuleEnabled('sign_config')
            ? <ActiveSidebarNavItem
              icon='television'
              label='eTID Config'
              link={`/signs`}
              active={this.isActive('signs')} />
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

          <footer
            className='footer'
            style={{
              position: 'relative',
              bottom: 0,
              width: '100%',
              marginTop: '40px',
              height: '100px',
              backgroundColor: '#f5f5f5'
            }}
          >
            <div className='container'>
              <ul className='list-inline text-center text-muted'>
                <li><a href={getConfigProperty('application.changelog_url')}>Changelog</a></li>
                <li><a href={getConfigProperty('application.docs_url')}>Guide</a></li>
                <li><a href={`mailto:${getConfigProperty('application.support_email')}`}>Contact</a></li>
              </ul>
              <p className='text-center text-muted'><span role='img' title='Copyright' aria-label='copyright'>&copy;</span> <a href='http://conveyal.com'>Conveyal</a></p>
            </div>
          </footer>
        </PageContent>

      </div>
    )
  }
}
