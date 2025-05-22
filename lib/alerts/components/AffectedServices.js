// @flow

import React, {Component} from 'react'
import {
  Panel,
  Label as BsLabel,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  Button
} from 'react-bootstrap'

import * as activeAlertActions from '../actions/activeAlert'
import { isExtensionEnabled } from '../../common/util/config'
import GtfsSearch from '../../gtfs/components/gtfs-search'
import type {Alert, AlertEntity, Feed} from '../../types'

import AffectedEntity from './AffectedEntity'

type Props = {
  activeFeeds: Array<Feed>,
  addActiveEntity: typeof activeAlertActions.addActiveEntity,
  alert: Alert,
  deleteActiveEntity: typeof activeAlertActions.deleteActiveEntity,
  sortedFeeds: Array<Feed>,
  updateActiveEntity: typeof activeAlertActions.updateActiveEntity
}

export default class AffectedServices extends Component<Props> {
  _onAddMode = () => {
    const {addActiveEntity, sortedFeeds} = this.props
    // default value is Tram
    addActiveEntity(
      'MODE',
      {gtfsType: 0, name: 'Tram/LRT'},
      sortedFeeds[0]
    )
  }

  _onAddAgency = () => {
    const {addActiveEntity, sortedFeeds} = this.props
    // default value is first entry
    addActiveEntity('AGENCY', sortedFeeds[0], null)
  }

  _onSelectEntity = (value: any) => {
    const {addActiveEntity} = this.props
    if (typeof value !== 'undefined' && value !== null) {
      if (value.stop) {
        addActiveEntity('STOP', value.stop, value.agency)
      } else if (value.route) {
        addActiveEntity('ROUTE', value.route, value.agency)
      }
    }
  }

  render () {
    const {
      activeFeeds,
      alert,
      deleteActiveEntity,
      sortedFeeds,
      updateActiveEntity
    } = this.props
    return (
      <Panel>
        <Panel.Heading><Panel.Title componentClass='h3'>
          <ServicesHeader entities={alert.affectedEntities} />}>
        </Panel.Title></Panel.Heading>
        <ListGroup>
          <ListGroupItem>
            <Row>
              <Col xs={5}>
                <Button
                  onClick={this._onAddAgency}
                  style={{marginRight: '5px'}}>
                  Add Agency
                </Button>
                {!isExtensionEnabled('mtc') &&
                  <Button
                    onClick={this._onAddMode}>
                    Add Mode
                  </Button>
                }
              </Col>
              <Col xs={7}>
                <GtfsSearch
                  clearable
                  entities={['stops', 'routes']}
                  feeds={activeFeeds}
                  limit={100}
                  onChange={this._onSelectEntity}
                  placeholder='Add stop/route' />
              </Col>
            </Row>
          </ListGroupItem>
          {alert.affectedEntities
            .sort((a, b) => b.id.localeCompare(a.id)) // reverse sort by entity id
            .map((entity) => (
              <AffectedEntity
                activeFeeds={activeFeeds}
                deleteActiveEntity={deleteActiveEntity}
                entity={entity}
                feeds={sortedFeeds}
                key={entity.id}
                updateActiveEntity={updateActiveEntity}
              />
            ))}
        </ListGroup>
      </Panel>
    )
  }
}

const entityTypes = [
  {
    singular: 'agency',
    plural: 'agencies'
  },
  {
    singular: 'route',
    plural: 'routes'
  },
  {
    singular: 'stop',
    plural: 'stops'
  },
  {
    singular: 'mode',
    plural: 'modes'
  }
]

class ServicesHeader extends Component<{entities: Array<AlertEntity>}> {
  render () {
    const {entities} = this.props
    const summary = entityTypes
      .map(t => {
        const count = entities.filter(e => e.type === t.singular.toUpperCase()).length
        return count
          ? <span key={t.singular}> <BsLabel
            bsStyle={t.singular === 'agency' || t.singular === 'mode'
              ? 'warning'
              : 'default'
            }>
            {`${count} ${count > 1 ? t.plural : t.singular}`}
          </BsLabel> </span>
          : null
      })
      .filter(c => c !== null)
    return (
      <span>
        <b>Alert applies to:</b>{' '}
        {summary.length ? summary : <span>[make selection below]</span>}
      </span>
    )
  }
}
