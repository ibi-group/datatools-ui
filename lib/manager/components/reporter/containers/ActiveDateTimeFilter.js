import { connect } from 'react-redux'

import DateTimeFilter from '../components/DateTimeFilter'
import { updateDateTimeFilter } from '../../../../gtfs/actions/filter'

const mapStateToProps = (state, ownProps) => {
  return {
    dateTime: state.gtfs.filter.dateTimeFilter
  }
}

const mapDispatchToProps = {
  updateDateTimeFilter
}

const ActiveDateTimeFilter = connect(
  mapStateToProps,
  mapDispatchToProps
)(DateTimeFilter)

export default ActiveDateTimeFilter
