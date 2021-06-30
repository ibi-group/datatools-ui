// @flow

import Icon from '@conveyal/woonerf/components/icon'
import * as React from 'react'
import {MenuItem as BsMenuItem} from 'react-bootstrap'

/**
 * Simple wrapper around Bootstrap's menu item to inject a checkmark if the item
 * is selected.
 */
const MenuItem = ({children, selected, ...menuItemProps}: {children?: React.Node, selected?: boolean}) => (
  <BsMenuItem {...menuItemProps}>
    {selected
      ? <Icon
        style={{
          left: '2px',
          marginTop: '3px',
          position: 'absolute'
        }}
        type='check'
      />
      : null
    }
    {children}
  </BsMenuItem>
)

export default MenuItem
