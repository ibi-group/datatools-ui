import React, {PropTypes, Component} from 'react'
import {Label} from 'react-bootstrap'
import moment from 'moment'

export default class VersionDateLabel extends Component {
  static propTypes = {
    validationJob: PropTypes.object,
    version: PropTypes.object
  }
  render () {
    const {validationJob, version} = this.props
    const {validationSummary: summary} = version
    if (validationJob) return null
    if (!summary) return null
    const now = +moment().startOf('day')
    const start = +moment(summary.startDate)
    const end = +moment(summary.endDate)
    const future = start > now
    const expired = end < now
    const bsStyle = future ? 'info' : expired ? 'danger' : 'success'
    const text = future ? 'future' : expired ? 'expired' : 'active'
    return (
      <Label
        bsStyle={bsStyle}>
        {text}
      </Label>
    )
  }
}
