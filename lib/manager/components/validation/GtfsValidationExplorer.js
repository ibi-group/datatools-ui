import React, {Component, PropTypes} from 'react'
import { Row, Col, Tabs, Tab } from 'react-bootstrap'

import IssuesMap from './IssuesMap'
import IsochroneMap from './IsochroneMap'
import GtfsValidationSummary from './GtfsValidationSummary'
import TripsChart from './TripsChart'

export default class GtfsValidationExplorer extends Component {
  static propTypes = {
    version: PropTypes.object
  }

  state = {
    activeTab: 'issues'
  }

  componentWillMount () {
    if (this.props.version && !this.props.version.validationResult) {
      this.props.fetchValidationResult(this.props.version)
    }
  }

  componentWillReceiveProps (nextProps) {
    if (this.props.version && nextProps && nextProps.version &&
        this.props.version.id !== nextProps.version.id &&
        !nextProps.version.validationResult) {
      this.props.fetchValidationResult(nextProps.version)
    }
  }

  _onFetchValidationResult = () => this.props.fetchValidationResult(this.props.version)

  render () {
    const {fetchIsochrones, version} = this.props

    if (!version || !version.validationResult) {
      return null
    }

    const tabRowStyle = { marginTop: '20px' }

    return (
      <Row>
        <Col xs={12}>
          <Tabs id='validation-explorer-tabs'
            activeKey={this.state.activeTab}
            animation={false}
            onSelect={(key) => {
              this.setState({activeTab: key})
              setTimeout(() => {
                const map = this.refs[key + '-map']
                if (map) map.initializeMap()
              }, 100) // Adjust timeout to tab transition
            }}>
            <Tab eventKey='issues' title='Validation Issues'>
              <Row style={tabRowStyle}>
                <Col xs={7}>
                  <IssuesMap
                    ref='issues-map'
                    version={version}
                    initialized />
                </Col>
                <Col xs={5}>
                  <GtfsValidationSummary
                    validationResult={version.validationResult}
                    version={version}
                    fetchValidationResult={this._onFetchValidationResult} />
                </Col>
              </Row>
            </Tab>

            <Tab eventKey='isochrones' title='Accessibility Explorer'>
              <Row style={tabRowStyle}>
                <Col xs={12}>
                  <IsochroneMap
                    ref='isochrones-map'
                    fetchIsochrones={fetchIsochrones}
                    version={version} />
                </Col>
              </Row>
            </Tab>

            <Tab eventKey='time' title='Time-based Validation'>
              <Row style={tabRowStyle}>
                <Col xs={12}>
                  <TripsChart
                    data={version.validationResult.tripsPerDate} />
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    )
  }
}
