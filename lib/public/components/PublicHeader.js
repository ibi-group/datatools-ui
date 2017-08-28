import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import { Grid, Row, Col, Button, Glyphicon, ButtonToolbar } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'

import { isModuleEnabled } from '../../common/util/config'

export default class PublicHeader extends Component {
  static propTypes = {
    loginHandler: PropTypes.func,
    logoutHandler: PropTypes.func,
    resetPassword: PropTypes.func,
    title: PropTypes.string,
    username: PropTypes.string
  }

  _onClickCreateAccount = () => browserHistory.push('/signup')

  render () {
    return (
      <Grid><Row style={{ marginBottom: 20, marginTop: 40 }}>
        {/* Title Column */}
        <Col xs={6}>
          <h1 style={{ marginTop: 0 }}>{this.props.title}</h1>
        </Col>
        {/* Button Column */}
        <Col xs={6} style={{ paddingTop: 2 }}>
          <ButtonToolbar className='pull-right'>
            {/* TODO: Add Language Selector */}
            {/* "Log In" Button or User Dropdown */}
            {this.props.username
              ? <LinkContainer to='/home'>
                <Button>
                  <span><img alt='User' height={20} width={20} src={this.props.userPicture} /> My dashboard</span>
                </Button>
              </LinkContainer>
              : <Button
                bsStyle='primary'
                onClick={this.props.loginHandler}>
                <Glyphicon glyph='log-in' /> Log In
              </Button>
            }
            {/* "Create Account" Button (only show if no active user) */}
            {!this.props.username && !isModuleEnabled('enterprise')
              ? <Button
                bsStyle='success'
                onClick={this._onClickCreateAccount}>
                <Glyphicon glyph='plus' /> Create Account
              </Button>
              : null
            }
            {/* "Log out" Button */}
            {this.props.username
              ? <Button
                bsStyle='primary'
                onClick={this.props.logoutHandler}>
                <Icon type='sign-out' /> Log Out</Button>
              : null
            }
          </ButtonToolbar>
        </Col>
      </Row></Grid>
    )
  }
}
