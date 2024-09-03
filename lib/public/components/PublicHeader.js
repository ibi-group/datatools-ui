// @flow

import type { Auth0ContextInterface } from '@auth0/auth0-react'
import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Button, ButtonToolbar, Col, Glyphicon, Grid, Row } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

import * as userActions from '../../manager/actions/user'
import type { Props as ContainerProps } from '../containers/ActivePublicHeader'
import { AUTH0_DISABLED } from '../../common/constants'

type Props = ContainerProps & {
  auth0: Auth0ContextInterface,
  logout: typeof userActions.logout,
  title: string,
  userPicture: ?string,
  username: ?string
}

export default class PublicHeader extends Component<Props> {
  _onLogoutClick = () => {
    this.props.logout(this.props.auth0)
  }

  render () {
    const {username, userPicture} = this.props
    return (
      <Grid>
        <Row style={{marginBottom: 20, marginTop: 40}}>
          {/* Button Column */}
          <Col xs={12} style={{paddingTop: 2}}>
            <ButtonToolbar className='pull-right'>
              {/* TODO: Add Language Selector */}
              {/* "Log In" Button or User Dropdown */}
              {username
                ? (
                  <LinkContainer to='/home'>
                    <Button>
                      <span>
                        <img
                          alt='User'
                          height={20}
                          width={20}
                          src={userPicture}
                        />{' '}
                        Mon tableau de bord
                      </span>
                    </Button>
                  </LinkContainer>
                )
                : (
                  <LinkContainer to='/login'>
                    <Button
                      bsStyle='link'
                      data-test-id='header-log-in-button'
                    >
                      <Glyphicon glyph='log-in' /> Connexion
                    </Button>
                  </LinkContainer>
                )
              }
              {/* "Log out" Button (unless auth is disabled) */}
              {username && !AUTH0_DISABLED && (
                <Button bsStyle='link' onClick={this._onLogoutClick}>
                  <Icon type='sign-out' /> Déconnexion
                </Button>
              )}
            </ButtonToolbar>
          </Col>
        </Row>
      </Grid>
    )
  }
}
