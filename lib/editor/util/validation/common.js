// @flow

/**
 * Construct an EditorValidationIssue for the field name and reason (defaults to
 * empty field message).
 */
export function validationIssue (reason: string, field: string) {
  return {field, invalid: true, reason}
}

export type EditorValidationIssue = {
  field: string,
  invalid: boolean,
  reason: string
}
