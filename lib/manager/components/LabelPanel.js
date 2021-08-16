// @flow
import Icon from '@conveyal/woonerf/components/icon'
import React, { Component } from 'react'
import { Panel } from 'react-bootstrap'

import FeedLabel from '../../common/components/FeedLabel'
import type { ManagerUserState } from '../../types/reducers'

import LabelEditorModal from './LabelEditorModal'

export type Props = {
  large?: boolean,
  project?: any,
  user: ManagerUserState,
};

export default class LabelPanel extends Component<Props> {
  _onClickNewLabel = () => this.refs.newLabelModal.open();

  render () {
    const { large, project, user } = this.props

    // make sure there is a valid
    // project we can add labels tobefore continuing
    if (!project || !project.labels || !project.id) {
      return null
    }

    const { labels, id: projectId } = project

    const projectAdmin =
      user && user.permissions && user.permissions.isProjectAdmin(projectId)

    let labelBody = (
      <div className='noLabelsMessage'>
        There are no labels in this project.
      </div>
    )
    if (labels.length > 0) {
      labelBody = labels.map((label) =>
        <FeedLabel editable key={label.id} label={label} />)
    }

    return (
      <Panel header={<h3><Icon type={'tag'} />{' '}Labels</h3>}>
        <div className={`feedLabelContainer ${large ? 'large' : ''} grid`}>
          <LabelEditorModal ref='newLabelModal' projectId={projectId} />
          {projectAdmin && (
            <button
              className='labelActionButton'
              onClick={this._onClickNewLabel}
            >
              Add a new label
            </button>
          )}
          {labelBody}
        </div>
      </Panel>
    )
  }
}
