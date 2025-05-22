// @flow
import React from 'react'
import tinycolor from 'tinycolor2'
import Icon from '@conveyal/woonerf/components/icon'
import { connect } from 'react-redux'

import { deleteLabel } from '../../manager/actions/labels'
import type { Label } from '../../types'
import type { ManagerUserState } from '../../types/reducers'
import ConfirmModal from '../../common/components/ConfirmModal'
import {getComponentMessages} from '../../common/util/config'
import LabelEditorModal from '../../manager/components/LabelEditorModal'

export type Props = {
  checked?: boolean,
  deleteLabel: Function,
  editable?: boolean,
  label: Label,
  onClick?: Function,
  user?: ManagerUserState
}
export type State = {}

/**
 * Generate lightened/darkened versions of a color for use in text and border rendering
 * @param {string} cssHex     The css hex value to modify
 * @param {number} strength   The amount to lighten or darken by
 * @returns                   String with lightened/darkened css hex value
 */
const getComplementaryColor = (cssHex, strength) => {
  const color = tinycolor(cssHex)

  const complementary = color.isDark()
    ? color.lighten(strength)
    : color.darken(strength + 10)
  return complementary.toHexString()
}

/**
 * Renders a feed label, either large or small and optionally renders a checkbox or edit/delete
 * buttons alongside the label
 */
class FeedLabel extends React.Component<Props, State> {
  messages = getComponentMessages('FeedLabel')

  _onConfirmDelete = () => {
    this.props.deleteLabel && this.props.deleteLabel(this.props.label)
  }

  _onClickDelete = () => {
    this.refs.deleteModal.open()
  }

  _getWrapperClasses = () => {
    const classes = ['feedLabelWrapper']
    if (this._isEditable()) classes.push('withButtons')
    return classes.join(' ')
  }

  _getLabelClasses = () => {
    const classes = ['feedLabel']
    classes.push('smaller')
    if (this._isCheckable()) classes.push('clickable')
    return classes.join(' ')
  }

  _isCheckable = () => this.props.checked !== undefined

  _onClickEdit = () => {
    this.refs.editModal.open()
  }

  _onClick = () => {
    const { label, onClick } = this.props
    if (onClick) {
      onClick(label.id)
    }
  }

  _isEditable = () => {
    const { editable, label, user } = this.props
    if (!editable) return false
    const projectAdmin =
      user &&
      user.permissions &&
      user.permissions.isProjectAdmin(label.projectId)
    return projectAdmin
  }

  render () {
    const { label, checked = false } = this.props

    // Used to avoid collision when label is rendered multiple times
    const uniqueId = `${label.id}-${Date.now().toString(36)}`

    return (
      <span className={this._getWrapperClasses()}>
        {this._isCheckable() && (
          <span className='actionButtons'>
            <input
              type='checkbox'
              checked={checked}
              onClick={this._onClick}
              onKeyPress={this._onClick}
              aria-checked={checked}
              tabIndex={0}
              id={uniqueId}
            />
          </span>
        )}
        <label
          htmlFor={uniqueId}
          className={this._getLabelClasses()}
          style={{
            backgroundColor: label.color,
            fontWeight: 'normal',
            color: getComplementaryColor(label.color, 55),
            borderColor: getComplementaryColor(label.color, 10)
          }}
          title={label.description || label.name}
        >
          <span className='labelName'>
            {label.adminOnly && <Icon type='lock' />}
            <span>{label.name}</span>
          </span>
        </label>
        {this._isEditable() && (
          <span className='actionButtons'>
            <ConfirmModal
              ref='deleteModal'
              title={this.messages('delete.title')}
              body={this.messages('delete.body').replace('%name%', label.name)}
              onConfirm={this._onConfirmDelete}
            />
            <LabelEditorModal ref='editModal' label={this.props.label} />

            <button onClick={this._onClickEdit}>
              <Icon type='pencil' />
            </button>
            <button onClick={this._onClickDelete}>
              <Icon type='trash' />
            </button>
          </span>
        )}
      </span>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user
  }
}

const mapDispatchToProps = {
  deleteLabel
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FeedLabel)
