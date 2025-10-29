// CSV validation errors for transformations.
// Values are keys to YAML error messages.
const CSV_VALIDATION_ERRORS = {
  CSV_MUST_HAVE_NAME: 'csvMissingName',
  CSV_NAME_CONTAINS_TXT: 'csvNameContainsTxt',
  TABLE_MUST_BE_DEFINED: 'undefinedTable',
  UNDEFINED_CSV_DATA: 'undefinedCSVData'
}

export default CSV_VALIDATION_ERRORS
