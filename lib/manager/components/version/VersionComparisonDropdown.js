// @flow

import React, {Component} from 'react'
import {MenuItem} from 'react-bootstrap'
import {connect} from 'react-redux'

import * as versionsActions from '../../actions/versions'
import VersionSelectorDropdown, {DefaultItemFormatter} from './VersionSelectorDropdown'

import type {FeedVersion} from '../../../types'
import type {AppState} from '../../../types/reducers'

type Props = {
  comparedVersion?: FeedVersion,
  setComparedVersion: typeof versionsActions.setComparedVersion,
  version: FeedVersion,
  versions: Array<FeedVersion>
}

/**
 * Renders a dropdown selector for choosing a version with which to compare the
 * active version.
 */
class VersionComparisonDropdown extends Component<Props> {
  _onSelectComparedVersion = (index: number) => {
    const {comparedVersion, setComparedVersion, versions} = this.props
    const comparedVersionIndex = comparedVersion ? comparedVersion.version : -1
    // Note: index is 1-based (the menu item at index 0 is a caption).
    if (index !== comparedVersionIndex) {
      setComparedVersion(versions.find(v => v.version === index))
    }
  }

  _onClearComparedVersion = () => {
    this.props.setComparedVersion(null)
  }

  render () {
    const {
      comparedVersion,
      version,
      versions
    } = this.props
    let title = 'Compare versions'
    if (comparedVersion) {
      title = `Comparing to version ${comparedVersion.version}`
    }

    // This custom formatter adds and hides the active version in the list to
    // preserve version indexes.
    const itemFormatter = (itemVersion: FeedVersion, activeVersion: ?FeedVersion) => (
      itemVersion === version
        ? <MenuItem key={itemVersion.id} style={{display: 'none'}} />
        : DefaultItemFormatter(itemVersion, activeVersion)
    )

    return (
      <VersionSelectorDropdown
        dropdownProps={{
          id: 'prevVersionSelector',
          onSelect: this._onSelectComparedVersion
        }}
        extraOptions={comparedVersion && [{
          onClick: this._onClearComparedVersion,
          text: 'Exit compare mode'
        }]}
        header={versions.length < 2
          ? 'Load another version to enable comparison'
          : 'Select a version to compare with'
        }
        itemFormatter={itemFormatter}
        title={title}
        version={comparedVersion}
        versions={versions}
      />
    )
  }
}

const mapStateToProps = (state: AppState, ownProps: {}) => {
  return {}
}

const mapDispatchToProps = {
  setComparedVersion: versionsActions.setComparedVersion
}

export default connect(mapStateToProps, mapDispatchToProps)(VersionComparisonDropdown)
