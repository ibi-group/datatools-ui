// @flow

import React, { Component } from 'react'
import Icon from '@conveyal/woonerf/components/icon'
import { Col, ListGroup, Panel, Row, ListGroupItem, Label as BsLabel } from 'react-bootstrap'

import { getComponentMessages } from '../../common/util/config'
import type { FeedVersion, TableTransformResult } from '../../types'

type Props = {
  version: FeedVersion,
}

export default class TransformationsViewer extends Component<Props> {
  messages = getComponentMessages('TransformationsViewer')
  _getBadge (transformResult: TableTransformResult) {
    switch (transformResult.transformType) {
      case 'TABLE_MODIFIED':
        return <BsLabel bsStyle='primary'>{this.messages('tableModified')}</BsLabel>
      case 'TABLE_ADDED':
        return <BsLabel bsStyle='success'>{this.messages('tableAdded')}</BsLabel>
      case 'TABLE_REPLACED':
        return <BsLabel bsStyle='warning'>{this.messages('tableReplaced')}</BsLabel>
      case 'TABLE_DELETED':
        return <BsLabel bsStyle='danger'>{this.messages('tableDeleted')}</BsLabel>
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
          <ListGroupItem key={res.tableName}>
            <h4 style={{marginTop: '5px'}}>{res.tableName} {badge}</h4>
            <Row style={{maxWidth: '950px', textAlign: 'center'}}>
              {/* Use toString on numbers to make flow happy */}
              <Col xs={3}><Icon type='plus-square' />{this.messages('rowsAdded').replace('%rows%', res.addedCount.toString())}</Col>
              <Col xs={3}><Icon type='minus-square' />{this.messages('rowsDeleted').replace('%rows%', res.deletedCount.toString())}</Col>
              <Col xs={3}><Icon type='exchange' />{this.messages('rowsUpdated').replace('%rows%', res.updatedCount.toString())}</Col>
              <Col xs={3}><Icon type='user-plus' />{this.messages('columnsAdded').replace('%columns%', res.customColumnsAdded.toString())}</Col>
            </Row>
          </ListGroupItem>
        )
      })
      return (
        <Panel>
          <Panel.Heading><Panel.Title componentClass='h3'>{this.messages('transformationsTitle')}</Panel.Title></Panel.Heading>
          <ListGroup>
            {transformContent}
          </ListGroup>
        </Panel>
      )
    } else {
      return <h3>{this.messages('noTransformationApplied')}</h3>
    }
  }
}
