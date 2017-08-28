import React from 'react'
import moment from 'moment'
import { Grid, Row, Col, Glyphicon } from 'react-bootstrap'
import BootstrapTable from 'react-bootstrap-table/lib/BootstrapTable'
import TableHeaderColumn from 'react-bootstrap-table/lib/TableHeaderColumn'
import { Link, browserHistory } from 'react-router'
import RegionSearch from './RegionSearch'

import PublicPage from './PublicPage'
import FeedsMap from './FeedsMap'
import { isExtensionEnabled, getComponentMessages, getMessage } from '../../common/util/config'

export default class PublicFeedsViewer extends React.Component {
  state = {}

  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  _onChangeRegion = (evt) => {
    if (evt && evt.region) {
      this.setState({
        position: [evt.region.lat, evt.region.lon],
        bounds: [[evt.region.north, evt.region.east], [evt.region.south, evt.region.west]]
      })
    }
    if (evt && evt.feed) {
      browserHistory.push('/public/feed/' + evt.feed.id)
    } else if (evt == null) {
      this.setState({position: null, bounds: null})
    }
  }

  _onFeedClick = (feedId) => browserHistory.push('/public/feed/' + feedId)

  render () {
    if (!this.props.projects) {
      return <PublicPage />
    }
    const feeds = []
    return (
      <PublicPage ref='publicPage'>
        <Grid>
          <Row>
            <Col xs={12} sm={6} md={4}>
              <RegionSearch
                feeds={feeds}
                limit={100}
                entities={['regions', 'feeds']}
                minimumInput={0}
                bsSize='large'
                clearable
                onChange={this._onChangeRegion} />
            </Col>
          </Row>
        </Grid>
        <FeedsMap
          projects={this.props.projects}
          onFeedClick={this._onFeedClick}
          bounds={this.state.bounds} />
        <Grid>
          <Row>
            <Col xs={12}>
              {isExtensionEnabled('mtc')
                ? null
                : <PublicFeedsTable projects={this.props.projects} />
              }
            </Col>
          </Row>
        </Grid>
      </PublicPage>
    )
  }
}

class PublicFeedsTable extends React.Component {
  feedFormat (cell, row) {
    return cell ? <Link to={'/public/feed/' + row.id}>{cell}</Link> : ''
  }

  dateFormat (cell, row) {
    return cell ? moment(cell).format('MMMM Do YYYY, h:mm a') : ''
  }

  urlFormat (cell, row) {
    return cell ? <a href={cell}><Glyphicon glyph='new-window' /></a> : ''
  }

  dateSort (a, b, order) {
    return b.lastUpdated - a.lastUpdated
  }
  render () {
    const feeds = []
    const messages = getComponentMessages('PublicFeedsTable')
    return (
      <BootstrapTable
        data={feeds}
        pagination
        striped
        hover
        search>
        <TableHeaderColumn isKey dataSort hidden dataField='id'>Feed ID</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='name' dataFormat={this.feedFormat}>{getMessage(messages, 'name')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='region'>{getMessage(messages, 'region')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='state'>{getMessage(messages, 'stateProvince')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='country'>{getMessage(messages, 'country')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='lastUpdated' sortFunc={this.dateSort}>{getMessage(messages, 'lastUpdated')}</TableHeaderColumn>
        <TableHeaderColumn dataSort dataField='lastUpdated' hidden>last_update</TableHeaderColumn>
        <TableHeaderColumn dataField='url' dataFormat={this.urlFormat}>{getMessage(messages, 'link')}</TableHeaderColumn>
      </BootstrapTable>
    )
  }
}
