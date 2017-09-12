import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Grid, Row, Col, Button, ButtonToolbar, Jumbotron} from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'
import objectPath from 'object-path'

import ManagerPage from '../../common/components/ManagerPage'
import RecentActivity from './RecentActivity'
import UserAccountInfoPanel from './UserAccountInfoPanel'
import FeedSourcePanel from './FeedSourcePanel'
import HomeProjectDropdown from './HomeProjectDropdown'
import {getConfigProperty} from '../../common/util/config'
import {defaultSorter} from '../../common/util/util'

export default class UserHomePage extends Component {
  static propTypes = {
    user: PropTypes.object,
    projects: PropTypes.array,
    project: PropTypes.object,
    onComponentMount: PropTypes.func,
    logoutHandler: PropTypes.func,
    fetchProjectFeeds: PropTypes.func,
    visibilityFilter: PropTypes.object,
    searchTextChanged: PropTypes.func,
    visibilityFilterChanged: PropTypes.func
  }

  state = {}

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  componentWillReceiveProps (nextProps) {
    const nextId = objectPath.get(nextProps, 'project.id')
    const id = objectPath.get(this.props, 'project.id')
    if (nextId && nextId !== id && !nextProps.project.feedSources) {
      this.props.fetchProjectFeeds(nextProps.project.id)
    }
  }

  componentWillUnmount () {
    this.setState({showLoading: true})
  }

  render () {
    const {
      projects,
      project,
      user,
      logoutHandler,
      visibilityFilter,
      searchTextChanged,
      visibilityFilterChanged
    } = this.props
    // const projectCreationDisabled = !this.props.user.permissions.isApplicationAdmin()
    const visibleProjects = projects.sort(defaultSorter)
    const activeProject = project
    const sortByDate = (a, b) => {
      if (a.date < b.date) return 1
      if (a.date > b.date) return -1
      return 0
    }

    return (
      <ManagerPage ref='page'>
        <Grid fluid>
          {this.state.showLoading ? <Icon className='fa-5x fa-spin' type='refresh' /> : null}
          <Row>
            <Col md={8} xs={12}>
              {/* Top Welcome Box */}
              <Jumbotron style={{ padding: 30 }}>
                <h2>Welcome to {getConfigProperty('application.title')}!</h2>
                <p>Manage, edit, validate and deploy your data in a streamlined workflow.</p>
                <ButtonToolbar>
                  <Button
                    bsStyle='primary'
                    bsSize='large'
                    href={getConfigProperty('application.docs_url')}>
                    <Icon type='info-circle' /> Take a Tour
                  </Button>
                  <LinkContainer to='/'>
                    <Button bsStyle='default' bsSize='large'>
                      <Icon type='globe' /> Explore feeds
                    </Button>
                  </LinkContainer>
                </ButtonToolbar>
              </Jumbotron>
              {/* Recent Activity List */}
              <h3 style={{ marginTop: 0, paddingBottom: 5, borderBottom: '2px solid #ddd' }}>
                <Icon type='comments-o' /> Recent Activity
              </h3>
              {user.recentActivity && user.recentActivity.length
                ? user.recentActivity.sort(sortByDate).map(item => {
                  return <RecentActivity item={item} />
                })
                : <span>No Recent Activity for your subscriptions.</span>
              }
            </Col>
            <Col md={4} xs={12}>
              <UserAccountInfoPanel
                user={user}
                // organization={organization}
                logoutHandler={logoutHandler} />
              <HomeProjectDropdown
                activeProject={activeProject}
                user={user}
                visibleProjects={visibleProjects} />
              <FeedSourcePanel
                activeProject={activeProject}
                visibilityFilter={visibilityFilter}
                searchTextChanged={searchTextChanged}
                user={user}
                visibilityFilterChanged={visibilityFilterChanged} />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
