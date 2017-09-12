import React, { PropTypes, Component } from 'react'
import { Row, Col, ButtonGroup, FormControl, FormGroup, Badge, ControlLabel } from 'react-bootstrap'

import AlertPreview from './AlertPreview'
import Loading from '../../common/components/Loading'
import OptionButton from '../../common/components/OptionButton'
import { getFeedId } from '../../common/util/modules'
import toSentenceCase from '../../common/util/to-sentence-case'
import { FILTERS, SORT_OPTIONS } from '../util'

export default class AlertsList extends Component {
  static propTypes = {
    agencyFilterChanged: PropTypes.func,
    alerts: PropTypes.array,
    editableFeeds: PropTypes.array,
    feeds: PropTypes.array,
    fetched: PropTypes.bool,
    filterCounts: PropTypes.object,
    isFetching: PropTypes.bool,
    onDeleteClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onZoomClick: PropTypes.func,
    publishableFeeds: PropTypes.array,
    searchTextChanged: PropTypes.func,
    sortChanged: PropTypes.func,
    visibilityFilter: PropTypes.object,
    visibilityFilterChanged: PropTypes.func
  }

  _onAgencyFilterChange = (evt) => {
    this.props.agencyFilterChanged(evt.target.value)
  }

  _onSearchChange = evt => this.props.searchTextChanged(evt.target.value)

  _onSortChange = (evt) => {
    const values = evt.target.value.split(':')
    const sort = {
      type: values[0],
      direction: values[1]
    }
    this.props.sortChanged(sort)
  }

  render () {
    const {
      alerts,
      editableFeeds,
      feeds,
      fetched,
      filterCounts,
      isFetching,
      onDeleteClick,
      onEditClick,
      onZoomClick,
      publishableFeeds,
      visibilityFilter,
      visibilityFilterChanged
    } = this.props
    const {sort} = visibilityFilter
    return (
      <div>
        <Row>
          <Col xs={12}>
            <FormGroup>
              <FormControl
                type='text'
                placeholder='Search Alerts'
                onChange={this._onSearchChange}
                defaultValue={visibilityFilter.searchText} />
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
                    onClick={visibilityFilterChanged}
                    value={f}
                    key={f}>
                    {toSentenceCase(f)} <Badge style={{backgroundColor: '#babec0'}}>{filterCounts[f]}</Badge>
                  </OptionButton>
                ))}
              </ButtonGroup>
            </FormGroup>
            <FormGroup className='form-inline pull-right' controlId='formControlsSelectMultiple'>
              <ControlLabel>Sort by</ControlLabel>
              {'  '}
              <FormControl
                componentClass='select'
                value={sort && `${sort.type}:${sort.direction}`}
                onChange={this._onSortChange}>
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </FormControl>
            </FormGroup>
            <FormGroup className='form-inline' controlId='formControlsSelectMultiple'>
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
                  key={alert.id}
                  editableFeeds={editableFeeds}
                  publishableFeeds={publishableFeeds}
                  onEditClick={onEditClick}
                  onZoomClick={onZoomClick}
                  onDeleteClick={onDeleteClick} />
              ))
              : <p className='lead text-center'>No alerts found.</p>
            }
          </Col>
        </Row>
      </div>
    )
  }
}
