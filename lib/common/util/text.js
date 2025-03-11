// @flow

import toLower from 'lodash/toLower'
import upperFirst from 'lodash/upperFirst'

export default function toSentenceCase (s: string): string {
  return upperFirst(toLower(s))
}
