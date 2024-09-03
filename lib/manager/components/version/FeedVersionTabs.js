// @flow

import moment from 'moment'
import React, {Component} from 'react'
import {Col, ListGroupItem, Row, Tab, Tabs} from 'react-bootstrap'
import numeral from 'numeral'
import type {Element} from 'react'

import {getComponentMessages, isModuleEnabled} from '../../../common/util/config'
import Patterns from '../reporter/containers/Patterns'
import Routes from '../reporter/containers/Routes'
import Stops from '../reporter/containers/Stops'
import Timetables from '../reporter/containers/Timetables'
import ServicePerModeChart from '../validation/ServicePerModeChart'
import TripsChart from '../validation/TripsChart'
import type {FeedVersion} from '../../../types'

import FeedVersionAccessibility from './FeedVersionAccessibility'
import DeltaStat from './DeltaStat'

type Props = {
  comparedVersion?: FeedVersion,
  feedVersionIndex: number,
  isochroneBand: any,
  onChangeIsochroneBand: number => void,
  selectTab: string => void,
  tab: string,
  version: FeedVersion
}

export default class FeedVersionTabs extends Component<Props> {
  messages = getComponentMessages('FeedVersionTabs')

  _onClickTab = (key: string) => {
    if (this.props.tab !== key) {
      this.props.selectTab(key)
    }
  }

  renderValidatorTabs = (
    version: any,
    feedVersionIndex: number,
    isochroneBand: any,
    onChangeIsochroneBand: number => void
  ) => {
    type ValidatorTab = {
      component: Element<*>,
      key: string,
      title: string
    }
    const VALIDATOR_TABS: Array<ValidatorTab> = []
    if (isModuleEnabled('validator')) {
      // Show accessibility isochrones if validator enabled
      VALIDATOR_TABS.push({
        title: 'Accessibility',
        key: 'accessibility',
        component: <FeedVersionAccessibility
          isochroneBand={isochroneBand}
          changeIsochroneBand={onChangeIsochroneBand}
          version={version} />
      })
    }
    return (VALIDATOR_TABS.map(t => (
      <Tab eventKey={t.key} title={t.title} key={t.key}>
        {t.component}
      </Tab>
    )): Array<Element<*>>)
  }

  render () {
    const {
      // FIXME: prop drilling.
      comparedVersion,
      feedVersionIndex,
      isochroneBand,
      onChangeIsochroneBand,
      tab,
      version
    } = this.props
    const tableOptions = {
      striped: true,
      hover: true,
      exportCSV: true,
      pagination: true,
      options: {
        paginationShowsTotal: true,
        sizePerPageList: [10, 20, 50, 100]
      }
    }
    const timeTableOptions = {...tableOptions}
    // Add default page zie for timetable options
    timeTableOptions.options = {...timeTableOptions.options, sizePerPage: 50}
    const countFields = ['agencyCount', 'routeCount', 'stopCount', 'tripCount', 'stopTimesCount']
    const daysActive = moment(version.validationSummary.endDate)
      .diff(moment(version.validationSummary.startDate), 'days')
    return (
      <ListGroupItem>
        {/* Tabs - Summary, Routes, Patterns, Stops, (Validation, Accessibility, Timeline) */}
        <Tabs
          activeKey={tab}
          onSelect={this._onClickTab}
          id='validator-tabs'
          bsStyle='pills'
          unmountOnExit>
          <Tab eventKey={'feed'} title='Résumé'>
            <Row>
              {countFields.map(c => {
                const summary = version.validationSummary
                const value = summary[c] || 0
                const diff = comparedVersion ? (value - (comparedVersion.validationSummary[c] || 0)) : 0
                return (
                  <Col xs={2} className='text-center' key={c}>
                    <span title={`${value}`} style={{ fontSize: '200%' }}>
                      {numeral(value).format('0a')}
                      {comparedVersion &&
                        // Apply a zero-width to superscript so that `value`
                        // above always appears centered.
                        <sup
                          style={{
                            display: 'inline-block',
                            marginLeft: '3px',
                            width: 0
                          }}
                        >
                          <DeltaStat
                            comparedVersionIndex={comparedVersion.version}
                            diff={diff}
                            style={{fontSize: '50%', padding: '0 0.2em 0.1em'}}
                            type={c} />
                        </sup>}
                    </span>
                    <p style={{marginBottom: '0px'}}>{this.messages(c)}</p>
                  </Col>
                )
              })}
              <Col xs={2} className='text-center'>
                <p
                  title={daysActive}
                  style={{marginBottom: '0px', fontSize: '200%'}}>
                  {numeral(daysActive).format('0a')}
                </p>
                <p style={{marginBottom: '0px'}}>{this.messages('daysActive')}</p>
              </Col>
            </Row>
            <div style={{marginTop: '10px'}}>
              <Row>
                <Col xs={12}>
                  <p className='lead text-center'>Nombre de trajets par jour</p>
                </Col>
              </Row>
              <TripsChart validationResult={version.validationResult} />
              <Row>
                <Col xs={12}>
                  <p className='lead text-center'>Heures de service par jour et par moyen de transport</p>
                </Col>
              </Row>
              <ServicePerModeChart validationResult={version.validationResult} />
            </div>
          </Tab>
          <Tab eventKey={'routes'} title='Itinéraires'>
            <Routes
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={tableOptions} />
          </Tab>
          <Tab eventKey={'patterns'} title='Circulations'>
            <Patterns
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={tableOptions} />
          </Tab>
          <Tab eventKey={'stops'} title='Arrêts'>
            <Stops
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={{...tableOptions, search: true}} />
          </Tab>
          <Tab eventKey={'timetables'} title='Fiches horaires'>
            <Timetables
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={timeTableOptions} />
          </Tab>
          {this.renderValidatorTabs(version, feedVersionIndex, isochroneBand, onChangeIsochroneBand)}
        </Tabs>
      </ListGroupItem>
    )
  }
}
