// @flow

import React, {Component} from 'react'
import {
  Row,
  Col,
  Button,
  ButtonGroup,
  FormControl,
  FormGroup,
  Badge,
  ControlLabel
} from 'react-bootstrap'

import * as alertActions from '../actions/alerts'
import * as visibilityFilterActions from '../actions/visibilityFilter'
import AlertPreview from './AlertPreview'
import Loading from '../../common/components/Loading'
import OptionButton from '../../common/components/OptionButton'
import { getFeedId } from '../../common/util/modules'
import toSentenceCase from '../../common/util/text'
import { FILTERS, SORT_OPTIONS } from '../util'

import type {Props as ContainerProps} from '../containers/VisibleAlertsList'
import type {Alert, Feed} from '../../types'
import type {AlertFilter} from '../../types/reducers'

type Props = ContainerProps & {
  alerts: Array<Alert>,
  deleteAlert: typeof alertActions.deleteAlert,
  editAlert: typeof alertActions.editAlert,
  editableFeeds: Array<Feed>,
  feeds: Array<Feed>,
  fetched: boolean,
  filterCounts: {[string]: number},
  isFetching: boolean,
  publishableFeeds: Array<Feed>,
  setAlertAgencyFilter: typeof visibilityFilterActions.setAlertAgencyFilter,
  setAlertSort: typeof visibilityFilterActions.setAlertSort,
  setVisibilityFilter: typeof visibilityFilterActions.setVisibilityFilter,
  setVisibilitySearchText: typeof visibilityFilterActions.setVisibilitySearchText,
  visibilityFilter: AlertFilter
}

export default class AlertsList extends Component<Props> {
  _onAgencyFilterChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.props.setAlertAgencyFilter(evt.target.value)
  }

  _clearFilters = () => {
    this.props.setAlertAgencyFilter('')
    this.props.setVisibilitySearchText('')
  }

  _onSearchChange = (evt: SyntheticInputEvent<HTMLInputElement>) =>
    this.props.setVisibilitySearchText(evt.target.value)

  _onSortChange = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    const values: Array<string> = evt.target.value.split(':')
    const sort = {
      type: values[0],
      direction: values[1]
    }
    this.props.setAlertSort(sort)
  }

  render () {
    const {
      alerts,
      deleteAlert,
      editableFeeds,
      editAlert,
      feeds,
      fetched,
      filterCounts,
      isFetching,
      publishableFeeds,
      setVisibilityFilter,
      visibilityFilter
    } = this.props
    const {sort} = visibilityFilter
    const hasFilter = !!(visibilityFilter.searchText || visibilityFilter.feedId)
    return (
      <div>
        <Row>
          <Col xs={12}>
            <FormGroup>
              <FormControl
                type='text'
                placeholder='Search Alerts'
                onChange={this._onSearchChange}
                value={visibilityFilter.searchText || ''} />
            </FormGroup>
          </Col>
        </Row>
        {/* Alert filters */}
        <Row>
          <Col xs={12}>
            <FormGroup>
              <ButtonGroup justified>
                {FILTERS.map(f => (
                  <OptionButton
                    active={visibilityFilter.filter === f}
                    onClick={setVisibilityFilter}
                    value={f}
                    key={f}>
                    {toSentenceCase(f)}{' '}
                    <Badge
                      style={{backgroundColor: '#babec0'}}>
                      {filterCounts[f]}
                    </Badge>
                  </OptionButton>
                ))}
              </ButtonGroup>
            </FormGroup>
            <FormGroup
              className='form-inline pull-right'
              controlId='formControlsSelectMultiple'>
              <ControlLabel>Sort by</ControlLabel>
              {'  '}
              <FormControl
                componentClass='select'
                value={sort && `${sort.type}:${sort.direction}`}
                onChange={this._onSortChange}>
                {SORT_OPTIONS.map(option => (
                  <option
                    key={option.value}
                    value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormControl>
            </FormGroup>
            <FormGroup
              className='form-inline'
              controlId='formControlsSelectMultiple'>
              <ControlLabel>Agency</ControlLabel>
              {'  '}
              <FormControl
                componentClass='select'
                value={visibilityFilter.feedId}
                onChange={this._onAgencyFilterChange}>
                <option value='ALL'>All</option>
                {feeds.map(fs => (
                  <option key={fs.id} value={getFeedId(fs)}>{fs.name}</option>
                ))}
              </FormControl>
            </FormGroup>
          </Col>
        </Row>
        {/* List of alerts */}
        <Row>
          <Col xs={12}>
            {isFetching || !fetched
              ? <Loading />
              : alerts.length
                ? alerts.map(alert => (
                  <AlertPreview
                    alert={alert}
                    deleteAlert={deleteAlert}
                    editAlert={editAlert}
                    editableFeeds={editableFeeds}
                    key={alert.id}
                    publishableFeeds={publishableFeeds}
                  />
                ))
                : <p className='lead text-center'>
                  No alerts found.
                  {hasFilter
                    ? <Button
                      bsStyle='link'
                      onClick={this._clearFilters}>Clear filters</Button>
                    : null
                  }
                </p>
            }
          </Col>
        </Row>
      </div>
    )
  }
}
