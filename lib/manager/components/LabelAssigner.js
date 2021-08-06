// @flow

import React from 'react'
import { connect } from 'react-redux'

import { updateFeedSource } from '../actions/feeds'
import FeedLabel from '../../common/components/FeedLabel'
import type { Feed, Project } from '../../types'

type Props = {
 feedSource: Feed,
 project: Project,
 updateFeedSource: Function
}
type State = {
  updatedLabelIds: Array<string>
}

/**
 * Displays all labels of a project, and renders feed labels along with checkboxes.
 * Each label which is of a feed source is checked. Will keep track of changes made
 * and save changes as the component unmounts
 */
class LabelAssigner extends React.Component<Props, State> {
  state = {
    updatedLabelIds: []
  }

  componentDidMount = () => {
    const { feedSource } = this.props
    this.setState({
      updatedLabelIds: feedSource.labelIds
    })
  }

  onLabelClick = (labelId: string) => {
    const { updatedLabelIds } = this.state

    const labelIndex = updatedLabelIds.indexOf(labelId)

    // Either remove the label from the list, or add it
    if (labelIndex < 0) {
      updatedLabelIds.push(labelId)
    } else {
      updatedLabelIds.splice(labelIndex, 1)
    }

    this.setState({ updatedLabelIds })
  }

  componentWillUnmount = () => {
    const { feedSource } = this.props
    const { updatedLabelIds } = this.state
    this.props.updateFeedSource(feedSource, { labels: updatedLabelIds })
  }

  render () {
    const { project } = this.props
    const projectLabels = project.labels

    const { updatedLabelIds: labelIds } = this.state

    return (
      <div className='feedLabelContainer large'>
        {projectLabels.length === 0 && (
          <div className='noLabelsMessage'>
            There are no labels in this project.
          </div>
        )}
        {projectLabels.map((label) => (
          <FeedLabel
            key={label.id}
            label={label}
            checked={labelIds.find((id) => id === label.id) !== undefined}
            onClick={this.onLabelClick}
          />
        ))}
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
  }
}

const mapDispatchToProps = {
  updateFeedSource
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LabelAssigner)
