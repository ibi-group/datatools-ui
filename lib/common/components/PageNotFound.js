import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Grid, Row, Col} from 'react-bootstrap'

import ManagerPage from './ManagerPage'
import PublicPage from '../../public/components/PublicPage'
import {Link} from 'react-router'
class PageNotFound extends Component {
  render () {
    const {user} = this.props
    // return content in public wrapper or manager app wrapper depending on whether user logged in
    const component = user.profile ? ManagerPage : PublicPage
    return React.createElement(component, {reg: 'page'},
      <Grid>
        <Row>
          <Col xs={12}>
            <h1>Page Not Found.</h1>
            <p>Go to <Link to={`/${user.profile ? 'home' : ''}`}>home page</Link></p>
          </Col>
        </Row>
      </Grid>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user
  }
}

const mapDispatchToProps = {}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PageNotFound)
