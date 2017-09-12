import React, {Component, PropTypes} from 'react'
import { LinkContainer } from 'react-router-bootstrap'

import { Row, Col, Panel, ListGroup, ListGroupItem } from 'react-bootstrap'
import GeneralSettings from './GeneralSettings'
import DeploymentSettings from './DeploymentSettings'
import { isModuleEnabled, getComponentMessages, getMessage } from '../../common/util/config'

export default class ProjectSettings extends Component {
  static propTypes = {
    project: PropTypes.object,
    projectEditDisabled: PropTypes.bool,
    updateProjectSettings: PropTypes.func,
    deleteProject: PropTypes.func
  }
  render () {
    const {
      project,
      projectEditDisabled,
      activeSettingsPanel,
      updateProjectSettings,
      deleteProject
    } = this.props
    const messages = getComponentMessages('ProjectSettings')
    const activePanel = !activeSettingsPanel
      ? <GeneralSettings
        project={project}
        updateProjectSettings={updateProjectSettings}
        deleteProject={deleteProject}
        editDisabled={projectEditDisabled} />
      : <DeploymentSettings
        project={project}
        updateProjectSettings={updateProjectSettings}
        editDisabled={projectEditDisabled} />
    return (
      <Row>
        <Col xs={12} sm={3}>
          <Panel>
            <ListGroup fill>
              <LinkContainer to={`/project/${project.id}/settings`}><ListGroupItem>{getMessage(messages, 'general.title')}</ListGroupItem></LinkContainer>
              {isModuleEnabled('deployment')
                ? <LinkContainer to={`/project/${project.id}/settings/deployment`}><ListGroupItem>{getMessage(messages, 'deployment.title')}</ListGroupItem></LinkContainer>
                : null
              }
            </ListGroup>
          </Panel>
        </Col>
        <Col xs={12} sm={7}>
          {activePanel}
        </Col>
      </Row>
    )
  }
}
