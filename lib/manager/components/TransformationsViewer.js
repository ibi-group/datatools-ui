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
        return <BsLabel bsStyle='primary'>Tabla modificada</BsLabel>
      case 'TABLE_ADDED':
        return <BsLabel bsStyle='success'>Tabla añadida</BsLabel>
      case 'TABLE_REPLACED':
        return <BsLabel bsStyle='warning'>Tabla Reemplazada</BsLabel>
      case 'TABLE_DELETED':
        return <BsLabel bsStyle='danger'>Tabla eliminada</BsLabel>
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
              <Col xs={4}><Icon type='plus-square' />Filas añadidas: {res.addedCount}</Col>
              <Col xs={4}><Icon type='minus-square' />Filas eliminadas: {res.deletedCount}</Col>
              <Col xs={4}><Icon type='exchange' />Filas actualizadas: {res.updatedCount}</Col>
            </Row>
          </ListGroupItem>
        )
      })
      return (
        <Panel header={<h3>Transformaciones</h3>}>
          <ListGroup>
            {transformContent}
          </ListGroup>
        </Panel>
      )
    } else {
      return <h3>No se aplicaron transformaciones.</h3>
    }
  }
}
