// @flow

import React from 'react'

import {FARESV2_COMPONENTS} from '../util/gtfs'
import {getEditorTable} from '../util'

function FaresV2FileRow ({active, component, onClick}) {
  const table = getEditorTable(component)
  const name = table ? table.name : component
  const className = active
    ? 'fares-v2-file-selector-row active'
    : 'fares-v2-file-selector-row'

  return (
    <button
      aria-current={active ? 'page' : undefined}
      className={className}
      data-test-id={`fares-v2-file-${component}-button`}
      onClick={onClick}
      type='button'>
      {name}
    </button>
  )
}

export default function FaresV2FileSelector ({
  activeComponent,
  width,
  feedSource,
  setActiveEntity
}) {
  return (
    <div
      className='fares-v2-file-selector'
      style={{flexBasis: `${width}px`, width: `${width}px`}}>
      <div className='fares-v2-file-selector-heading'>Fares v2 files</div>
      {FARESV2_COMPONENTS.map(component => (
        <FaresV2FileRow
          active={activeComponent === component}
          component={component}
          key={component}
          onClick={() => setActiveEntity(feedSource.id, component)}
        />
      ))}
    </div>
  )
}
