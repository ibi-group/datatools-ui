import Icon from '@conveyal/woonerf/components/icon'
import React, {PropTypes, Component} from 'react'
import ReactDOM from 'react-dom'
import {Panel, Row, Col, Button, ButtonGroup, InputGroup, FormControl, ListGroup, ListGroupItem} from 'react-bootstrap'

import {getComponentMessages, getMessage} from '../../common/util/config'
import CreateUser from './CreateUser'
import UserRow from './UserRow'

export default class UserList extends Component {
  static propTypes = {
    createUser: PropTypes.func,
    deleteUser: PropTypes.func,
    fetchProjectFeeds: PropTypes.func,
    isFetching: PropTypes.bool,
    page: PropTypes.number,
    perPage: PropTypes.number,
    projects: PropTypes.array,
    saveUser: PropTypes.func,
    setPage: PropTypes.func,
    setUserPermission: PropTypes.func,
    token: PropTypes.string,
    userCount: PropTypes.number,
    users: PropTypes.array,
    userSearch: PropTypes.func
  }

  state = {}

  _clearSearch = () => {
    ReactDOM.findDOMNode(this.refs.searchInput).value = ''
    this.props.userSearch('')
  }

  _decrementPage = () => {
    this.props.setPage(this.props.page - 1)
  }

  _incrementPage = () => {
    this.props.setPage(this.props.page + 1)
  }

  _onSearchKeyUp = e => {
    if (e.keyCode === 13) this.userSearch()
  }

  userSearch = () => {
    this.props.userSearch(ReactDOM.findDOMNode(this.refs.searchInput).value)
  }

  render () {
    const {
      creatingUser,
      organizations,
      page,
      perPage,
      userCount,
      projects,
      fetchProjectFeeds,
      createUser,
      isFetching,
      users,
      saveUser,
      deleteUser,
      token
    } = this.props
    const headerStyle = {
      fontSize: '18px',
      marginLeft: '12px'
    }

    const messages = getComponentMessages('UserList')
    const minUserIndex = (page * perPage) + 1
    const maxUserIndex = Math.min((page + 1) * perPage, userCount)
    const maxPage = Math.ceil(userCount / perPage) - 1
    // const isApplicationAdmin = creatingUser.permissions.isApplicationAdmin()
    // const orgToOption = organization => ({organization, value: organization.id, label: organization.name})
    return (
      <div>
        <Row style={{ marginBottom: '18px' }}>
          <Col xs={12}>
            <ButtonGroup>
              <Button
                disabled={page <= 0}
                onClick={this._decrementPage}>
                <Icon type='arrow-left' />
              </Button>
              <Button
                disabled={page >= maxPage}
                onClick={this._incrementPage}>
                <Icon type='arrow-right' />
              </Button>
            </ButtonGroup>
            {userCount > 0
              ? <span style={headerStyle}>{getMessage(messages, 'showing')} {minUserIndex } - {maxUserIndex} {getMessage(messages, 'of')} {userCount}</span>
              : <span style={headerStyle}>(No results to show)</span>
            }
          </Col>
        </Row>
        <Panel
          header={
            <Row>
              <Col xs={10} className='form-inline'>
                <InputGroup ref='foo'>
                  <FormControl type='text'
                    ref='searchInput'
                    placeholder={getMessage(messages, 'search')}
                    onKeyUp={this._onSearchKeyUp} />
                  <InputGroup.Addon>
                    <Icon
                      type='remove'
                      style={{ cursor: 'pointer' }}
                      onClick={this._clearSearch} />
                  </InputGroup.Addon>
                </InputGroup>
                <Button bsStyle='primary'
                  style={{marginLeft: '8px'}}
                  onClick={this.userSearch}>
                  <Icon type='search' />
                </Button>
                {/* TODO: add filter for organization */}
                {/* isApplicationAdmin &&
                  <FormGroup style={{marginLeft: '8px', width: '200px'}}>
                    <Select
                      value={this.state.organization && orgToOption(this.state.organization)}
                      options={organizations.map(orgToOption)}
                      onChange={value => this.setState({organization: value ? value.organization : null})}
                      placeholder={getMessage(messages, 'filterByOrg')} />
                  </FormGroup>
                */}
              </Col>
              <Col xs={2}>
                <CreateUser
                  projects={projects}
                  organizations={organizations}
                  creatingUser={creatingUser}
                  fetchProjectFeeds={fetchProjectFeeds}
                  createUser={createUser.bind(this)} />
              </Col>
            </Row>
          }>
          <ListGroup fill>
            {isFetching
            ? <ListGroupItem style={{ fontSize: '18px', textAlign: 'center' }}>
              <Icon className='fa-2x fa-spin' type='refresh' />
            </ListGroupItem>
            : users.map((user, i) => {
              return <UserRow
                projects={projects}
                organizations={organizations}
                creatingUser={creatingUser}
                user={user}
                key={i}
                fetchProjectFeeds={fetchProjectFeeds}
                // setUserPermission={setUserPermission}
                saveUser={saveUser.bind(this)}
                deleteUser={deleteUser.bind(this)}
                token={token} />
            })
          }
          </ListGroup>
        </Panel>
      </div>
    )
  }
}
