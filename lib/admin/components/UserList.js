// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  ButtonGroup,
  Col,
  DropdownButton,
  InputGroup,
  FormControl,
  ListGroupItem,
  Panel,
  Row,
  Table
} from 'react-bootstrap'

import * as adminActions from '../actions/admin'
import MenuItem from '../../common/components/MenuItem'
import { getComponentMessages } from '../../common/util/config'
import * as feedActions from '../../manager/actions/feeds'
import * as managerUserActions from '../../manager/actions/user'
import type { Organization, Project, UserProfile } from '../../types'
import type { AppState, ManagerUserState } from '../../types/reducers'

import UserRow from './UserRow'
import CreateUser from './CreateUser'

type Props = {
  createUser: typeof adminActions.createUser,
  creatingUser: ManagerUserState,
  deleteUser: typeof adminActions.deleteUser,
  fetchProjectFeeds: typeof feedActions.fetchProjectFeeds,
  fetchUsers: typeof adminActions.fetchUsers,
  isFetching: boolean,
  organizations: Array<Organization>,
  page: number,
  perPage: number,
  projects: Array<Project>,
  setUserPage: typeof adminActions.setUserPage,
  setUserPerPage: typeof adminActions.setUserPerPage,
  setUserQueryString: typeof adminActions.setUserQueryString,
  token: string,
  updateUserData: typeof managerUserActions.updateUserData,
  userCount: number,
  users: Array<UserProfile>
}

type State = {
  searchText: string
}

class UserList extends Component<Props, State> {
  messages = getComponentMessages('UserList')
  state = {
    searchText: ''
  }

  _clearSearch = () => {
    this.setState({searchText: ''})
    // Pass empty string to update search results
    // because the new state will not have taken effect yet.
    this._performSearch('')
  }

  _decrementPage = () => {
    this._setPage(this.props.page - 1)
  }

  _incrementPage = () => {
    this._setPage(this.props.page + 1)
  }

  _onSearchTextChange = (e: SyntheticInputEvent<HTMLInputElement>) =>
    this.setState({searchText: e.target.value})

  _onSearchTextKeyUp = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
    switch (e.keyCode) {
      case 13: // ENTER
        return this._userSearch()
      default:
        break
    }
  }

  _setPage (pageNumber: number) {
    const { fetchUsers, setUserPage } = this.props
    setUserPage(pageNumber)
    fetchUsers()
  }

  _setUserPerPage = (perPage: number) => {
    const { fetchUsers, setUserPerPage } = this.props
    setUserPerPage(perPage)
    fetchUsers()
  }

  _userSearch = () => {
    // Note: unable to inline because _userSearch is passed an HTML event object
    // that we don't use.
    this._performSearch()
  }

  _performSearch = (text?: string) => {
    const { fetchUsers, setUserPage, setUserQueryString } = this.props
    setUserPage(0)
    // Must check `text` against undefined in the function call below.
    // With `text || this.state.searchText || ''`, the search does not properly reset.
    setUserQueryString(text !== undefined ? text : (this.state.searchText || ''))
    fetchUsers()
  }

  render () {
    const {
      createUser,
      creatingUser,
      deleteUser,
      fetchProjectFeeds,
      isFetching,
      organizations,
      page,
      perPage,
      projects,
      token,
      updateUserData,
      userCount,
      users
    } = this.props
    const headerStyle = {
      fontSize: '18px',
      marginLeft: '12px'
    }

    const minUserIndex = (page * perPage) + 1
    const maxUserIndex = Math.min((page + 1) * perPage, userCount)
    const maxPage = Math.ceil(userCount / perPage) - 1
    return (
      <div>
        <Row style={{ marginBottom: '18px' }}>
          <Col xs={12}>
            <ButtonGroup>
              <Button
                disabled={page <= 0}
                onClick={this._decrementPage}
              >
                <Icon type='arrow-left' />
              </Button>
              <Button
                disabled={page >= maxPage}
                onClick={this._incrementPage}
              >
                <Icon type='arrow-right' />
              </Button>
            </ButtonGroup>
            {userCount > 0
              ? <span style={headerStyle}>
                {this.messages('showing')}{' '}
                {minUserIndex } - {maxUserIndex}{' '}
                {this.messages('of')} {userCount}
              </span>
              : <span style={headerStyle}>{this.messages('noResults')}</span>
            }
            <div className='pull-right'>
              {this.messages('perPage')}{' '}
              <DropdownButton
                id='per-page-dropdown'
                onSelect={this._setUserPerPage}
                title={perPage}
              >
                {// Render users per page options.
                  [10, 25, 50, 100].map(val =>
                    <MenuItem selected={val === perPage} key={`option-${val}`} eventKey={val}>
                      {val}
                    </MenuItem>
                  )
                }
              </DropdownButton>
            </div>
          </Col>
        </Row>
        <Panel>
          <Panel.Heading>
            <Row>
              <Col xs={10} className='form-inline'>
                <InputGroup ref='foo'>
                  <FormControl
                    data-test-id='search-user-input'
                    onChange={this._onSearchTextChange}
                    onKeyUp={this._onSearchTextKeyUp}
                    placeholder={this.messages('search')}
                    type='text'
                    value={this.state.searchText}
                  />
                  <InputGroup.Button>
                    <Button
                      onClick={this._clearSearch}
                    >
                      <Icon type='remove' />
                    </Button>
                    <Icon
                      onClick={this._clearSearch}
                      style={{ cursor: 'pointer' }}
                      type='remove'
                    />
                  </InputGroup.Button>
                </InputGroup>
                <Button
                  data-test-id='submit-user-search-button'
                  onClick={this._userSearch}
                  style={{marginLeft: '8px'}}
                >
                  <Icon type='refresh' />
                </Button>
              </Col>
              <Col xs={2}>
                <CreateUser
                  createUser={createUser.bind(this)}
                  creatingUser={creatingUser}
                  fetchProjectFeeds={fetchProjectFeeds}
                  organizations={organizations}
                  projects={projects}
                />
              </Col>
            </Row>
          </Panel.Heading>
          {/* Skip using <Panel.Body> because it will introduce unnecessary padding around the table. */}
          {isFetching
            ? (
              <ListGroupItem style={{ fontSize: '18px', textAlign: 'center' }}>
                <Icon className='fa-2x fa-spin' type='refresh' />
              </ListGroupItem>
            )
            : (
              <Table data-test-id='user-list'>
                <thead>
                  <tr>
                    <th />
                    <th>{this.messages('headings.user')}</th>
                    <th>{this.messages('headings.accountType')}</th>
                    <th>{this.messages('headings.projects')}</th>
                    <th>{this.messages('headings.lastLogin')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      creatingUser={creatingUser}
                      deleteUser={deleteUser}
                      fetchProjectFeeds={fetchProjectFeeds}
                      key={user.user_id}
                      organizations={organizations}
                      projects={projects}
                      token={token}
                      updateUserData={updateUserData}
                      user={user}
                    />
                  ))}
                </tbody>
              </Table>
            )
          }
        </Panel>
      </div>
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: {}) => {
  const { isFetching, data: users, page, perPage, userCount } = state.admin.users
  const { data: organizations } = state.admin.organizations
  return {
    creatingUser: state.user,
    isFetching,
    organizations,
    page,
    perPage,
    projects: state.projects.all,
    token: state.user.token || 'token-invalid',
    userCount,
    users
  }
}

const {fetchProjectFeeds} = feedActions
const {updateUserData} = managerUserActions
const {
  createUser,
  deleteUser,
  fetchUsers,
  setUserPage,
  setUserPerPage,
  setUserQueryString
} = adminActions

const mapDispatchToProps = {
  createUser,
  deleteUser,
  fetchProjectFeeds,
  fetchUsers,
  setUserPage,
  setUserPerPage,
  setUserQueryString,
  updateUserData
}

export default connect(mapStateToProps, mapDispatchToProps)(UserList)
