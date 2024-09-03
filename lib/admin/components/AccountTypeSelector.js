// @flow

import React from 'react'
import { ControlLabel, FormControl, FormGroup } from 'react-bootstrap'
import { connect } from 'react-redux'

import { getAccountTypes } from '../../common/util/user'
import type { AccountTypes } from '../../types'
import type { AppState } from '../../types/reducers'

type Props = {
  accountType?: ?string,
  accountTypes: AccountTypes,
  alwaysVisible?: boolean,
  id?: ?string,
  onChanged: (e: SyntheticInputEvent<HTMLInputElement>) => void
}

/**
 * This redux-connected component wraps a selector for the configured different account types.
 */
function AccountTypeSelector ({
  accountType,
  accountTypes,
  alwaysVisible,
  id,
  onChanged
}: Props) {
  const accountTypeKeys = Object.keys(accountTypes)
  const hasDefaultKey = accountTypeKeys.includes('default')
  const accountTypeUnknown = accountType && !accountTypeKeys.includes(accountType)

  // Display account type dropdown if more than one account types are configured, unless forced to display.
  return (accountTypeKeys.length > 1 || alwaysVisible) ? (
    <FormGroup controlId={id}>
      <ControlLabel>Account type</ControlLabel>
      <FormControl
        componentClass='select'
        name='accountType'
        onChange={onChanged}
        value={accountType || (hasDefaultKey ? 'default' : null)}
      >
        {/* If account is unknown, show it but don't let the user change back to that value. */}
        {accountTypeUnknown && (
          <option disabled value={accountType}>Non configuré ({accountType})</option>
        )}
        {accountTypeKeys.map(key => (
          <option key={key} value={key}>{accountTypes[key].name}</option>
        ))}
      </FormControl>
    </FormGroup>
  ) : null
}

// Connect to redux store
const mapStateToProps = (state: AppState) => {
  return {
    accountTypes: getAccountTypes(state)
  }
}

export default connect(mapStateToProps)(AccountTypeSelector)
