// @flow

import moment from 'moment'
import React, {Component} from 'react'
import {Row, Col, Tabs, Tab, ListGroupItem} from 'react-bootstrap'
import numeral from 'numeral'

import * as versionsActions from '../../actions/versions'
import {getComponentMessages, isModuleEnabled} from '../../../common/util/config'
import Patterns from '../reporter/containers/Patterns'
import Routes from '../reporter/containers/Routes'
import Stops from '../reporter/containers/Stops'
import Timetables from '../reporter/containers/Timetables'
import ServicePerModeChart from '../validation/ServicePerModeChart'
import TripsChart from '../validation/TripsChart'
import FeedVersionAccessibility from './FeedVersionAccessibility'

import type {Element} from 'react'

import type {FeedVersion} from '../../../types'

type Props = {
  feedVersionIndex: number,
  fetchValidationIssueCount: typeof versionsActions.fetchValidationIssueCount,
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
          <Tab eventKey={'feed'} title='Summary'>
            <Row>
              {countFields.map(c => (
                <Col xs={2} className='text-center' key={c}>
                  <p
                    title={`${version.validationSummary[c]}`}
                    style={{marginBottom: '0px', fontSize: '200%'}}>
                    {numeral(version.validationSummary[c]).format('0 a')}
                  </p>
                  <p style={{marginBottom: '0px'}}>{this.messages(c)}</p>
                </Col>
              ))}
              <Col xs={2} className='text-center'>
                <p
                  title={daysActive}
                  style={{marginBottom: '0px', fontSize: '200%'}}>
                  {numeral(daysActive).format('0 a')}
                </p>
                <p style={{marginBottom: '0px'}}>{this.messages('daysActive')}</p>
              </Col>
            </Row>
            <div style={{marginTop: '10px'}}>
              <Row>
                <Col xs={12}>
                  <p className='lead text-center'>Number of trips per date.</p>
                </Col>
              </Row>
              <TripsChart validationResult={version.validationResult} />
              <Row>
                <Col xs={12}>
                  <p className='lead text-center'>Service hours per date by mode.</p>
                </Col>
              </Row>
              <ServicePerModeChart validationResult={version.validationResult} />
            </div>
          </Tab>
          <Tab eventKey={'routes'} title='Routes'>
            <Routes
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={tableOptions} />
          </Tab>
          <Tab eventKey={'patterns'} title='Patterns'>
            <Patterns
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={tableOptions} />
          </Tab>
          <Tab eventKey={'stops'} title='Stops'>
            <Stops
              version={version}
              selectTab={this.props.selectTab}
              tableOptions={{...tableOptions, search: true}} />
          </Tab>
          <Tab eventKey={'timetables'} title='Timetables'>
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
