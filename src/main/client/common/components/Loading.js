import React from 'react'
import { Row, Col } from 'react-bootstrap'
import {Icon} from '@conveyal/woonerf'


export default class Loading extends React.Component {

  render () {
    return (
      <Row>
        <Col xs={12}>
          <p className='text-center'><Icon className='fa-5x fa-spin' type='refresh' /></p>
        </Col>
      </Row>
    )
  }
}
