import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import {Row, ButtonGroup, FormControl, FormGroup, Badge} from 'react-bootstrap'
import toSentenceCase from 'to-sentence-case'

import SignPreview from './SignPreview'
import {FILTERS} from '../util'
import OptionButton from '../../common/components/OptionButton'

export default class SignsList extends Component {
  static propTypes = {
    signs: PropTypes.array,
    visibilityFilter: PropTypes.object,
    isFetching: PropTypes.bool,
    editableFeeds: PropTypes.array,
    publishableFeeds: PropTypes.array,

    onEditClick: PropTypes.func,
    onZoomClick: PropTypes.func,
    onDeleteClick: PropTypes.func,

    searchTextChanged: PropTypes.func,
    visibilityFilterChanged: PropTypes.func
  }

  _onSearchChange = evt => this.props.searchTextChanged(evt.target.value)

  render () {
    const sortedSigns = this.props.signs.sort((a, b) => {
      if (a.id < b.id) return -1
      if (a.id > b.id) return 1
      return 0
    })

    return (
      <div>
        <Row>
          <FormGroup>
            <FormControl
              type='text'
              placeholder='Search Signs'
              onChange={this._onSearchChange}
              defaultValue={this.props.visibilityFilter.searchText} />
          </FormGroup>
        </Row>
        <Row>
          <ButtonGroup justified>
            {FILTERS.map(f => (
              <OptionButton
                active={this.props.visibilityFilter.filter === f}
                onClick={this.props.visibilityFilterChanged}
                value={f}
                key={f}>
                {toSentenceCase(f)} <Badge style={{backgroundColor: '#babec0'}}>{this.props.filterCounts[f]}</Badge>
              </OptionButton>
            ))}
          </ButtonGroup>
          <div className='form-group'>&nbsp;</div>
        </Row>
        <Row>
          {this.props.isFetching
            ? <p className='text-center'><Icon className='fa-5x fa-spin' type='refresh' /></p>
            : sortedSigns.length
            ? sortedSigns.map((sign) => (
              <SignPreview
                sign={sign}
                key={sign.id}
                editableFeeds={this.props.editableFeeds}
                publishableFeeds={this.props.publishableFeeds}
                onEditClick={this.props.onEditClick}
                onZoomClick={this.props.onZoomClick}
                onDeleteClick={this.props.onDeleteClick} />
            ))
            : <p className='lead text-center'>No signs found.</p>
          }
        </Row>
      </div>
    )
  }
}
