import React, {Component, PropTypes} from 'react'
import { Panel, Label, ListGroup, ListGroupItem, Row, Col, Button } from 'react-bootstrap'

import AffectedEntity from './AffectedEntity'
import { isExtensionEnabled } from '../../common/util/config'
import GtfsSearch from '../../gtfs/components/gtfssearch'

export default class AffectedServices extends Component {
  static propTypes = {
    activeFeeds: PropTypes.array,
    alert: PropTypes.object,
    entityUpdated: PropTypes.func,
    newEntityId: PropTypes.number,
    onAddEntityClick: PropTypes.func,
    onDeleteEntityClick: PropTypes.func,
    sortedFeeds: PropTypes.array
  }
  _onAddMode = (evt) => {
    const {newEntityId, onAddEntityClick, sortedFeeds} = this.props
    // default value is Tram
    onAddEntityClick('MODE', {gtfsType: 0, name: 'Tram/LRT'}, sortedFeeds[0], newEntityId)
  }

  _onAddAgency = (evt) => {
    const {newEntityId, onAddEntityClick, sortedFeeds} = this.props
    // default value is first entry
    onAddEntityClick('AGENCY', sortedFeeds[0], null, newEntityId)
  }

  _onSelectEntity = (evt) => {
    if (typeof evt !== 'undefined' && evt !== null) {
      if (evt.stop) {
        this.props.onAddEntityClick('STOP', evt.stop, evt.agency, this.props.newEntityId)
      } else if (evt.route) {
        this.props.onAddEntityClick('ROUTE', evt.route, evt.agency, this.props.newEntityId)
      }
    }
  }

  render () {
    const {sortedFeeds, alert, activeFeeds, onDeleteEntityClick, entityUpdated} = this.props
    return (
      <Panel
        header={<ServicesHeader entities={alert.affectedEntities} />}>
        <ListGroup fill>
          <ListGroupItem>
            <Row>
              <Col xs={5}>
                <Button
                  style={{marginRight: '5px'}}
                  onClick={this._onAddAgency}>
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
                  feeds={activeFeeds}
                  placeholder='Add stop/route'
                  limit={100}
                  entities={['stops', 'routes']}
                  clearable
                  onChange={this._onSelectEntity} />
              </Col>
            </Row>
          </ListGroupItem>
          {alert.affectedEntities
            .sort((a, b) => b.id - a.id) // reverse sort by entity id
            .map((entity) => (
              <AffectedEntity
                entity={entity}
                key={entity.id}
                activeFeeds={activeFeeds}
                feeds={sortedFeeds}
                onDeleteEntityClick={onDeleteEntityClick}
                entityUpdated={entityUpdated} />
            ))}
        </ListGroup>
      </Panel>
    )
  }
}

class ServicesHeader extends Component {
  render () {
    const { entities } = this.props
    const counts = [
      {
        singular: 'agency',
        plural: 'agencies',
        count: entities.filter(e => e.type === 'AGENCY').length
      },
      {
        singular: 'route',
        plural: 'routes',
        count: entities.filter(e => e.type === 'ROUTE').length
      },
      {
        singular: 'stop',
        plural: 'stops',
        count: entities.filter(e => e.type === 'STOP').length
      },
      {
        singular: 'mode',
        plural: 'modes',
        count: entities.filter(e => e.type === 'MODE').length
      }
    ]
    const summary = counts
      .map(c => {
        return c.count
          ? <span key={c.singular}> <Label
            bsStyle={c.singular === 'agency' || c.singular === 'mode' ? 'warning' : 'default'}>
            {`${c.count} ${c.count > 1 ? c.plural : c.singular}`}
          </Label> </span>
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
