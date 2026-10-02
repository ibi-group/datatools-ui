// @flow

import React from 'react'

import { getComponentMessages } from '../../common/util/config'
import type { EditorValidationIssue } from '../util/validation/common'

const VALIDATION_ERROR_LIMIT = 3

const ExceptionValidationErrorsList = ({validationErrors}: {validationErrors: Array<EditorValidationIssue>}) => {
  const messages = getComponentMessages('ExceptionValidationErrorsList')
  const excessValidationErrors = validationErrors.length - VALIDATION_ERROR_LIMIT

  return (
    <ul style={{listStyleType: 'none', paddingLeft: '0'}}>
      {validationErrors.map((err, index) => {
        if (index < VALIDATION_ERROR_LIMIT) {
          return (
            <li style={{color: 'darkred', margin: '5px 0px'}}>
              {err.reason}
            </li>
          )
        }
      })}
      {excessValidationErrors > 0 && (
        <li style={{color: 'darkred'}}>
          {messages('andOtherErrors').replace('%errors%', excessValidationErrors.toString())}
        </li>
      )}
    </ul>
  )
}

export default ExceptionValidationErrorsList
