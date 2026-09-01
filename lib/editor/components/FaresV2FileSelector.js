// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React from 'react'
import {connect} from 'react-redux'

import {setActiveEntity} from '../actions/active'
import {FARESV2_COMPONENTS} from '../util/gtfs'
import {getFaresV2AggregateStatus} from '../selectors'
import type {AppState} from '../../types/reducers'
import {getEditorTable} from '../util'
import type {Feed} from '../../types'
import type {FaresV2FileStatus} from '../selectors'

const STATUS_DISPLAY = {
  empty: {className: 'empty', icon: 'circle-o', label: 'No data'},
  invalid: {className: 'invalid', icon: 'exclamation-circle', label: 'Needs attention'},
  unknown: {className: 'unknown', icon: 'question-circle', label: 'Unavailable'},
  valid: {className: 'valid', icon: 'check-circle', label: 'Valid'}
}

type RowProps = {
  active: boolean,
  component: string,
  fileStatus: FaresV2FileStatus,
  onClick: () => any
}

function FaresV2FileRow ({active, component, fileStatus, onClick}: RowProps) {
  const table = getEditorTable(component)
  const name = table ? table.name : component
  const {invalidRowCount, rowCount, status} = fileStatus
  const statusDisplay = STATUS_DISPLAY[status]
  const rowLabel = `${rowCount} ${rowCount === 1 ? 'row' : 'rows'}`
  const invalidRowLabel = `${invalidRowCount} ${invalidRowCount === 1 ? 'row needs' : 'rows need'} edits`
  const statusSummary = status === 'invalid'
    ? `${statusDisplay.label}, ${invalidRowLabel}`
    : `${statusDisplay.label}, ${rowLabel}`
  const className = [
    'fares-v2-file-selector-row',
    active ? 'active' : ''
  ].filter(Boolean).join(' ')

  return (
    <button
      aria-current={active ? 'page' : undefined}
      aria-label={`${name}: ${statusSummary}`}
      className={className}
      data-test-id={`fares-v2-file-${component}-button`}
      onClick={onClick}
      type='button'>
      <span className='fares-v2-file-selector-row-content'>
        <span className='fares-v2-file-selector-row-name'>{name}</span>
        <span className={`fares-v2-file-selector-row-status ${statusDisplay.className}`}>
          <Icon type={statusDisplay.icon} /> {statusDisplay.label}
        </span>
        {status === 'invalid'
          ? <span className='fares-v2-file-selector-row-meta'>{invalidRowLabel}</span>
          : status === 'loading'
            ? null
            : <span className='fares-v2-file-selector-row-meta'>{rowLabel}</span>}
      </span>
    </button>
  )
}

type Props = {
  activeComponent: string,
  faresV2Statuses: Array<FaresV2FileStatus>,
  feedSource: Feed,
  setActiveEntity: typeof setActiveEntity,
  width: number
}

function FaresV2FileSelector ({
  activeComponent,
  width,
  feedSource,
  setActiveEntity,
  faresV2Statuses
}: Props) {
  return (
    <div
      className='fares-v2-file-selector'
      style={{flexBasis: `${width}px`, width: `${width}px`}}>
      <div className='fares-v2-file-selector-heading'>Fares v2 files</div>
      {FARESV2_COMPONENTS.map(component => {
        const fileStatus = faresV2Statuses.find(status => status.component === component)
        if (!fileStatus) {
          return undefined
        }
        return (
          <FaresV2FileRow
            active={activeComponent === component}
            component={component}
            fileStatus={fileStatus}
            key={component}
            onClick={() => setActiveEntity(feedSource.id, component)} />
        )
      })}
    </div>
  )
}

const mapStateToProps = (state: AppState) => {
  return {
    faresV2Statuses: getFaresV2AggregateStatus(state)
  }
}

const mapDispatchToProps = {
  setActiveEntity
}

export default connect(mapStateToProps, mapDispatchToProps)(FaresV2FileSelector)
