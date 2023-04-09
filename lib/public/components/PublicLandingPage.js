// @flow

import React, { Component } from 'react'
import { Button, Grid, Row, Col } from 'react-bootstrap'
import {LinkContainer} from 'react-router-bootstrap'

import { DEFAULT_DESCRIPTION, DEFAULT_LOGO, DEFAULT_TITLE } from '../../common/constants'
import { getConfigProperty, isModuleEnabled } from '../../common/util/config'
import type {Props as ContainerProps} from '../containers/ActivePublicLandingPage'
import type {ManagerUserState} from '../../types/reducers'

import PublicPage from './PublicPage'

type Props = ContainerProps & {
  user: ManagerUserState
}

export default class PublicLandingPage extends Component<Props> {
  render () {
    const appTitle = getConfigProperty('application.title') || DEFAULT_TITLE
    const appDescription = getConfigProperty('application.description') || DEFAULT_DESCRIPTION
    const logoLarge = getConfigProperty('application.logo_large') || DEFAULT_LOGO
    return (
      <PublicPage ref='publicPage'>
        <Grid>
          <Row>
            <Col style={{textAlign: 'center'}} xs={12}>
              <img alt='App logo' src={logoLarge} style={{maxWidth: '256px'}} />
              <h1>{appTitle}</h1>
            </Col>
          </Row>
          <Row>
            <Col style={{textAlign: 'center', marginTop: '15px'}} xs={12}>
              <p className='lead'>
                {this.props.user.profile
                  ? <LinkContainer to='/home'>
                    <Button bsSize='large'>
                      Iniciar
                    </Button>
                  </LinkContainer>
                  : <span>
                    {appDescription}
                  </span>
                }
              </p>
              {!isModuleEnabled('enterprise') && <p>
                Conoce más de esta herramienta{' '}
                <a href='https://data-tools-docs.ibi-transit.com/en/latest/'>aquí</a>.
              </p>}
              <p>
                {!this.props.user.profile
                  ? <LinkContainer to='/login'>
                    <Button bsSize='large'>Iniciar sesión</Button>
                  </LinkContainer>
                  : null
                }
              </p>
            </Col>
          </Row>
        </Grid>
        <footer className='landing-footer'>
          <div className='container'>
            <p className='text-center text-muted' style={{marginTop: 10, marginBottom: 0}}>
              <span role='img' title='Copyright' aria-label='copyright'>
                &copy;
              </span>{' '}
              <a href='https://conveyal.com'>Conveyal</a>{'\n'}
            </p>
          </div>
        </footer>
      </PublicPage>
    )
  }
}
