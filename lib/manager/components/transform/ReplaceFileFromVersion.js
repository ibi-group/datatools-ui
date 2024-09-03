// @flow

import React, { Component } from 'react'

import VersionSelectorDropdown from '../version/VersionSelectorDropdown'
import type { TransformProps } from '../../../types'

/**
 * Component that renders fields for ReplaceFileFromVersionTransformation.
 */
export default class ReplaceFileFromVersion extends Component<TransformProps<{}>, {}> {
  componentDidMount () {
    this._updateErrors()
  }

  _onSelectVersion = (versionIndex: number) => {
    const {feedSource, onSave} = this.props
    if (feedSource.feedVersionSummaries) {
      const version = feedSource.feedVersionSummaries[versionIndex - 1]
      onSave({sourceVersionId: version.id}, this.props.index)
    } else {
      console.warn('Le flux n’a qu’une version.')
    }
  }

  _findFeedVersion = () => {
    const { feedSource, transformation } = this.props
    return feedSource.feedVersionSummaries &&
      feedSource.feedVersionSummaries.find(v => v.id === transformation.sourceVersionId)
  }

  _getValidationErrors (): Array<string> {
    const { feedSource } = this.props
    // Get selected version (if applicable).
    const version = this._findFeedVersion()
    const issues: Array<string> = []

    // Only trigger validation issue if versions have been loaded.
    if (!version && feedSource.feedVersionSummaries) {
      issues.push('Une version doit être définie.')
    }

    return issues
  }

  /**
   * Notify containing component of the resulting validation errors if any.
   * @param fields: The updated state. If not set, the component state will be used.
   */
  _updateErrors = () => {
    const { onValidationErrors } = this.props
    onValidationErrors(this._getValidationErrors())
  }

  render () {
    const {feedSource} = this.props
    // Get selected version (if applicable).
    const version = this._findFeedVersion()

    return (
      <VersionSelectorDropdown
        dropdownProps={{
          id: 'merge-versions-dropdown',
          onSelect: this._onSelectVersion
        }}
        title={version
          ? `From source version ${version.version}`
          : 'Sélectionner une version'
        }
        version={version}
        versions={feedSource.feedVersionSummaries}
      />
    )
  }
}
