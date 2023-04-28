// @flow

import toLower from 'lodash/toLower'
import upperFirst from 'lodash/upperFirst'

export default function toSentenceCase (s: string): string {
  return upperFirst(toLower(s))
}

/**
 * This method takes a string like expires_in_7days and ensures
 * that 7days is replaced with 7 days
 */
// $FlowFixMe flow needs to learn about new es2021 features!
export function spaceOutNumbers (s: string): string {
  return s.replaceAll('_', ' ')
    .split(/(?=[1-9])/)
    .join(' ')
    .toLowerCase()
}
