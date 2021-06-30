// @flow

import Icon from '@conveyal/woonerf/components/icon'
import * as React from 'react'
import { Dropdown } from 'react-bootstrap'

import MenuItem from '../../../common/components/MenuItem'
import VersionRetrievalBadge from './VersionRetrievalBadge'

import type { FeedVersion } from '../../../types'

type Props = {
  dropdownProps: any,
  extraOptions?: ?Array<{onClick: () => void, text: string}>,
  header?: string,
  itemFormatter: (FeedVersion, ?FeedVersion) => React.Node,
  title: React.Node,
  // Indicates which version is active in the feed version navigator.
  version?: FeedVersion,
  versions: ?Array<FeedVersion>
}

export const DefaultItemFormatter = (version: FeedVersion, activeVersion: ?FeedVersion) => (
  <MenuItem
    eventKey={version.version}
    key={version.id}
    selected={Boolean(activeVersion && version.id === activeVersion.id)}
  >
    {activeVersion && version.id === activeVersion.id
      ? <Icon
        style={{
          left: '2px',
          marginTop: '3px',
          position: 'absolute'
        }}
        type='check' />
      : null
    }
    {version.version}. {version.name}{' '}
    <VersionRetrievalBadge version={version} />
  </MenuItem>
)

export default function VersionSelectorDropdown (props: Props) {
  const {
    dropdownProps,
    extraOptions,
    header,
    itemFormatter,
    title,
    version,
    versions
  } = props
  const versionsSorted = versions
    ? versions.slice(0).reverse()
    : []
  return (
    <Dropdown
      {...dropdownProps}
    >
      <Dropdown.Toggle>
        {title}
      </Dropdown.Toggle>
      <Dropdown.Menu className='scrollable-dropdown'>
        {header ? <MenuItem header>{header}</MenuItem> : null}
        {versionsSorted.length > 0
          ? versionsSorted.map((v, i) => itemFormatter(v, version))
          : <MenuItem disabled>No versions available</MenuItem>}

        {extraOptions && <MenuItem divider />}
        {extraOptions && extraOptions.map((option, i) => (
          <MenuItem key={i} onClick={option.onClick}>{option.text}</MenuItem>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

VersionSelectorDropdown.defaultProps = {
  dropdownProps: {
    onSelect: (key: number | string) => console.log(`selected ${key}`)
  },
  itemFormatter: DefaultItemFormatter
}
