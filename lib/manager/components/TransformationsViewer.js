// @flow

import React, { Component } from 'react'
import Icon from '@conveyal/woonerf/components/icon'
import { Col, ListGroup, Panel, Row, ListGroupItem, Label as BsLabel } from 'react-bootstrap'

import type { FeedVersion, TableTransformResult } from '../../types'

type Props = {
  version: FeedVersion,
}

export default class TransformationsViewer extends Component<Props> {
  _getBadge (transformResult: TableTransformResult) {
    switch (transformResult.transformType) {
      case 'TABLE_MODIFIED':
        return <BsLabel bsStyle='primary'>Table Modified</BsLabel>
      case 'TABLE_ADDED':
        return <BsLabel bsStyle='success'>Table Added</BsLabel>
      case 'TABLE_REPLACED':
        return <BsLabel bsStyle='warning'>Table Replaced</BsLabel>
      case 'TABLE_DELETED':
        return <BsLabel bsStyle='danger'>Table Deleted</BsLabel>
    }
  }

  render () {
    const {
      version
    } = this.props

    if (version.feedTransformResult && version.feedTransformResult.tableTransformResults) {
      const {tableTransformResults} = version.feedTransformResult
      const transformContent = tableTransformResults.map(res => {
        const badge = this._getBadge(res)
        return (
          <ListGroupItem key={res.tableName} style={{maxWidth: '720px'}}>
            <h4 style={{marginTop: '5px'}}>{res.tableName} {badge}</h4>
            <Row style={{textAlign: 'center'}}>
              <Col xs={4}><Icon type='plus-square' />Rows added: {res.addedCount}</Col>
              <Col xs={4}><Icon type='minus-square' />Rows deleted: {res.deletedCount}</Col>
              <Col xs={4}><Icon type='exchange' />Rows updated: {res.updatedCount}</Col>
            </Row>
          </ListGroupItem>
        )
      })
      return (
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h3'>Transformations</Panel.Title></Panel.Heading>
          <ListGroup>
            {transformContent}
          </ListGroup>
        </Panel>
      )
    } else {
      return <h3>No transformations applied.</h3>
    }
  }
}
