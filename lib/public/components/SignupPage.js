import React, {Component, PropTypes} from 'react'
import { Grid, Row, Col, Button, FormControl, FormGroup, ControlLabel } from 'react-bootstrap'

import PublicPage from './PublicPage'

export default class SignupPage extends Component {
  static propTypes = {
    signupHandler: PropTypes.func
  }

  _onChange = ({target}) => this.setState({[target.name]: target.value})

  _onClickSignUp = (evt) => {
    this.props.signupHandler(this.state)
  }

  render () {
    const email = (
      <FormGroup controlId='formControlsEmail'>
        <ControlLabel>Email</ControlLabel>
        <FormControl
          type='email'
          name='email'
          placeholder='user@example.com'
          onChange={this._onChange} />
      </FormGroup>
    )
    const password = (
      <FormGroup controlId='formControlsPassword'>
        <ControlLabel>Password</ControlLabel>
        <FormControl
          type='password'
          name='password'
          placeholder='password'
          onChange={this._onChange} />
      </FormGroup>
    )
    return (
      <PublicPage ref='publicPage'>
        <Grid>
          <Row>
            <Col xs={12}>
              <h2>
                Create an account
              </h2>
            </Col>
          </Row>
          <Row>
            <Col xs={4}>
              <form>
                <p>
                  Already have an account?
                  {' '}
                  <Button
                    href='#'
                    bsStyle='link'
                    onClick={this.props.loginHandler}>
                    Sign in
                  </Button>
                </p>
                {/* username */}
                {email}
                {password}
                <Button
                  bsStyle='primary'
                  onClick={this._onClickSignUp}>
                  Sign up!
                </Button>
              </form>
            </Col>
          </Row>
        </Grid>
      </PublicPage>
    )
  }
}
