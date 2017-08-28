import React from 'react'
import { Grid, Row, Col } from 'react-bootstrap'

import ManagerPage from '../../common/components/ManagerPage'
import CreateSign from '../components/CreateSign'
import VisibleSignsList from '../containers/VisibleSignsList'
import GlobalGtfsFilter from '../../gtfs/containers/GlobalGtfsFilter'
import GtfsMapSearch from '../../gtfs/components/gtfsmapsearch'

export default class SignsViewer extends React.Component {
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }
  render () {
    const {
      activeFeeds,
      createSign,
      fetched,
      onStopClick,
      project,
      user
    } = this.props
    const createDisabled = project && user
      ? !user.permissions.hasProjectPermission(project.organizationId, project.id, 'edit-etid')
      : true
    return (
      <ManagerPage
        ref='page'
        title='eTID Config'
        >
        <Grid fluid>
          <Row>
            <Col xs={12}>
              <CreateSign
                disabled={createDisabled}
                fetched={fetched}
                createSign={createSign} />
            </Col>
          </Row>
          <Row>
            <Col xs={12} sm={6}>
              <VisibleSignsList />
            </Col>
            <Col xs={12} sm={6}>
              <Row>
                <Col xs={12}>
                  <GlobalGtfsFilter permissionFilter='edit-etid' />
                </Col>
              </Row>
              <GtfsMapSearch
                feeds={activeFeeds}
                onStopClick={onStopClick}
                popupAction='Create Sign for' />
            </Col>
          </Row>
        </Grid>
      </ManagerPage>
    )
  }
}
