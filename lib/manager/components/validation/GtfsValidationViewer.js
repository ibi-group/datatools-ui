// @flow

import Icon from '@conveyal/woonerf/components/icon'
import moment from 'moment'
import React, {Component} from 'react'
import {
  Alert,
  Label,
  ListGroup,
  Table,
  ListGroupItem,
  Panel,
  Col,
  Row
} from 'react-bootstrap'

import Loading from '../../../common/components/Loading'
import OptionButton from '../../../common/components/OptionButton'
import {isExtensionEnabled} from '../../../common/util/config'
import toSentenceCase from '../../../common/util/to-sentence-case'
import {
  BLOCKING_ERROR_TYPES,
  getTableFatalExceptions,
  isErrorCountFetched
} from '../../util/version'

import ValidationErrorItem from './ValidationErrorItem'

import type {Props as FeedVersionViewerProps} from '../version/FeedVersionViewer'
import type {ValidationResult} from '../../../types'

const DEFAULT_LIMIT = 10

export type Props = FeedVersionViewerProps & {
  validationResult: ValidationResult
}

type State = {
  active: ?string,
  limit: number,
  offset: number
}

export default class GtfsValidationViewer extends Component<Props, State> {
  state = {
    active: null,
    offset: 0,
    limit: DEFAULT_LIMIT
  }

  componentWillMount () {
    if (!isErrorCountFetched(this.props.validationResult)) {
      this.props.fetchValidationIssueCount(this.props.version)
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    if (
      isErrorCountFetched(this.props.validationResult) &&
      !isErrorCountFetched(nextProps.validationResult)
    ) {
      // If the validation error count was overwritten by fetching feed versions,
      // refetch the issue count.
      this.props.fetchValidationIssueCount(this.props.version)
    }
  }

  _onClickErrorType = (errorType: string) => {
    const {version: feedVersion, fetchValidationErrors} = this.props
    const {active, limit, offset} = this.state
    const {error_counts: errorCounts} = feedVersion.validationResult
    if (active === errorType) {
      // Close error type category
      this.setState({active: null})
    } else {
      const category = errorCounts.find(c => c.type === errorType)
      if (!category) {
        console.warn(`Error type=${errorType} not found`, feedVersion)
        return
      }
      if (!category.errors || category.errors.length === 0) {
        // Fetch errors and reset active error type, limit, and offset
        this.setState({active: errorType})
        fetchValidationErrors({feedVersion, errorType, offset, limit})
      } else {
        // Do not fetch errors if first batch has already been fetched.
        // reset active error type, limit, and offset
        this.setState({active: errorType, offset: 0})
      }
    }
  }

  _onClickLoadMoreErrors = (errorType: string) => {
    const {version: feedVersion, fetchValidationErrors} = this.props
    const {limit} = this.state
    const {error_counts: errorCounts} = feedVersion.validationResult
    if (!errorCounts) {
      console.warn('Error counts not found for validation result', feedVersion)
      return
    }
    const category = errorCounts.find(c => c.type === errorType)
    if (!category) {
      console.warn(`Error type=${errorType} not found`, feedVersion)
      return
    }
    // Update offset based on number of errors already fetched
    const offset = category.errors.length
    this.setState({offset})
    fetchValidationErrors({feedVersion, errorType, offset, limit})
  }

  render () {
    const {
      validationResult: result,
      version
    } = this.props
    const tableFatalExceptions = getTableFatalExceptions(version)
    const {active} = this.state
    const dateFormat = 'MMM. DD, YYYY'
    const timeFormat = 'h:MMa'
    const hasValidation = isErrorCountFetched(result)
    const versionHasErrors = hasValidation &&
      result.error_counts &&
      result.error_counts.length

    let validationContent = null
    if (!hasValidation) { // Validation not retreived yet
      validationContent = (
        <ListGroup fill>
          <ListGroupItem className='validation-item'>
            Retrieving Validation...
          </ListGroupItem>
        </ListGroup>
      )
    } else if (versionHasErrors) {
      validationContent = result.error_counts.map((category, index) => {
        const errorTypeIsActive = active === category.type
        const firstError = category.errors && category.errors[0]
        let multiTyped = false
        firstError && category.errors.forEach(e => {
          if (e.entity_type !== firstError.entity_type) multiTyped = true
        })
        const tableType = category.type.indexOf('TABLE') !== -1
        // Check to see if this is a blocking issue (MTC-only) preventing
        // the version from being published.
        const isBlockingIssue = isExtensionEnabled('mtc') &&
          BLOCKING_ERROR_TYPES.indexOf(category.type) !== -1
        const includeEntityType = tableType || multiTyped
        return (
          <ListGroup key={index} fill>
            <ListGroupItem>
              <Row
                className='list-group-item-heading'
                // FIXME
                onClick={() => this._onClickErrorType(category.type)}
                style={{cursor: 'pointer'}}>
                <Col xs={12}>
                  <h4>
                    <Icon type={errorTypeIsActive ? 'caret-down' : 'caret-right'} />
                    {toSentenceCase(category.type.replace(/_/g, ' '))}
                    {' '}
                    {isBlockingIssue && <Label bsStyle='danger'>BLOCKING</Label>}
                    <span className='pull-right text-warning'>
                      <Icon type='exclamation-triangle' /> {category.count}
                    </span>
                  </h4>
                </Col>
              </Row>
            </ListGroupItem>
            {/* Render list of errors */}
            <Panel collapsible bsClass='' expanded={errorTypeIsActive}>
              <ListGroupItem>
                <strong>Description:</strong> {category.message}
              </ListGroupItem>
              <Table striped hover fill className='table-fixed'>
                <thead><tr>
                  <th>Line #</th>
                  {includeEntityType && <th>Entity type</th>}
                  <th>{firstError && !includeEntityType ? firstError.entity_type : 'Entity'} ID</th>
                  <th>Bad value</th>
                  <th>Action</th>
                </tr></thead>
                {category.errors
                  ? category.errors.map((error, index) => (
                    <ValidationErrorItem
                      {...this.props}
                      version={version}
                      multipleEntityTypes={includeEntityType}
                      error={error}
                      index={index}
                      key={index} />
                  ))
                  : <Loading />
                }
              </Table>
            </Panel>
            {errorTypeIsActive &&
              category.errors &&
              category.errors.length < category.count
              ? <ListGroupItem className='validation-item'>
                <OptionButton
                  value={category.type}
                  onClick={this._onClickLoadMoreErrors}>
                  Load more
                </OptionButton>
              </ListGroupItem>
              : errorTypeIsActive
                ? <ListGroupItem className='validation-item'>
                  <span className='text-muted'>No more errors of this type</span>
                </ListGroupItem>
                : null
            }
          </ListGroup>
        )
      })
    } else { // No errors found
      validationContent = (
        <ListGroup fill>
          <ListGroupItem className='validation-item'>
            No validation errors!
          </ListGroupItem>
        </ListGroup>
      )
    }

    return (
      <div>
        <h2 style={{marginTop: '0px'}}>
          {version.name}{' '}
          <small>
            {moment(version.updated).format(dateFormat + ', ' + timeFormat)}
          </small>
        </h2>
        {tableFatalExceptions.length > 0 &&
          <Alert bsStyle='danger'>
            <Icon type='exclamation-triangle' />{' '}
            <strong>Fatal exception:</strong>{' '}
            {tableFatalExceptions
              .map(e => `${e.tableName}: ${e.fatalException}`)
              .join(', ')
            }
          </Alert>
        }
        <Panel header={<h2>Validation errors</h2>}>
          {validationContent}
        </Panel>
      </div>
    )
  }
}
