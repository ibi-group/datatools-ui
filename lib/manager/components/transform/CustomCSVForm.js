// @flow

// $FlowFixMe Flow is outdated
import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import { parseString } from '@fast-csv/parse'

import { getComponentMessages } from '../../../common/util/config'

type Props = {
  buttonText?: string,
  csvData?: ?string,
  headerText?: string,
  hideSaveButton?: boolean,
  inputIsSame?: boolean,
  name?: string,
  onChangeCsvData: ({target: {name?: string, value: string}}) => void,
  onSaveCsvData: () => void,
  placeholder?: string,
  validateHeaders?: boolean
}
const CustomCSVForm = (props: Props) => {
  const [errorCount, setErrorCount] = useState(0)

  const {
    buttonText,
    csvData,
    headerText,
    hideSaveButton,
    inputIsSame,
    name,
    onChangeCsvData,
    onSaveCsvData,
    placeholder
  } = props

  useEffect(() => {
  // Default to true
    const validateHeaders = props.validateHeaders !== undefined ? props.validateHeaders : true
    setErrorCount(0)

    parseString(csvData, { headers: validateHeaders })
      .on('error', _ => setErrorCount(errorCount + 1))
  }, [csvData])

  const numLines = !csvData ? 0 : csvData.split(/\r*\n/).length
  const messages = getComponentMessages('CustomCSVForm')

  const csvIsValid = errorCount === 0

  return (
    <div>
      <label
        htmlFor='csvData'
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          flexDirection: 'column'
        }}
      >
        {headerText}
        {numLines < 600000 && <textarea
          id='csvData'
          name={name}
          onChange={onChangeCsvData}
          placeholder={
            placeholder || `stop_id,stop_code,stop_name,stop_lat,stop_lon\n1234567,188390987,Broad Ave,33.98768,-87.72686`
          }
          style={{
            fontFamily: 'monospace',
            fontSize: 'x-small',
            height: '80px',
            overflow: 'auto',
            whiteSpace: 'pre',
            width: '400px'
          }}
          value={csvData} />}
      </label>
      <div style={{marginBottom: '10px'}}>
        <input
          name='file'
          type='file'
          onChange={(e) => {
            // TODO: use useCallback
            // https://github.com/ibi-group/datatools-ui/pull/986#discussion_r1362276889
            if (e.target && e.target.files.length > 0) {
              onChangeCsvData({target: {name, value: messages('uploading')}})
              const reader = new FileReader()
              reader.onload = fileContents => {
                onChangeCsvData({target: {name, value: fileContents.target.result}})
              }
              reader.readAsText(e.target.files[0])
            }
          }}
        />
        {!hideSaveButton && <Button
          bsSize='xsmall'
          disabled={!csvIsValid || inputIsSame}
          onClick={onSaveCsvData}
          style={{marginRight: '5px'}}
        >
          {buttonText}
        </Button>}
        <small>{messages('numLines').replace('%numLines%', numLines.toString())}</small>
        {!csvIsValid && <small style={{paddingLeft: '1ch', color: 'red'}}>{messages('csvInvalid')}</small>}
      </div>
    </div>
  )
}

export default CustomCSVForm
