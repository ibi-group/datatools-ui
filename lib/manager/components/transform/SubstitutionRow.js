// @flow

import Icon from '@conveyal/woonerf/components/icon'
import { isEqual } from 'lodash'
import React, { Component } from 'react'
import { Button, ButtonGroup, FormControl, FormGroup, InputGroup } from 'react-bootstrap'

import { isSubstitutionBlank } from '../../util/transform'

import type {
  Substitution
} from '../../../types'

type Props = {
  activeEditingIndex: number,
  index: number,
  onBeginEdit?: number => void,
  onChange: (Substitution, number) => void,
  onEndEdit: number => void,
  onRemove?: number => void,
  substitution: Substitution
}

// (Encoded) test string to be included to URL to regex test tool (regexr).
const STRING_FOR_REGEXR_TEST = encodeURIComponent('Route 10 à Quai 1 @ Station de Train (10+Ouest)')

// This style is needed otherwise the button group renders not as one row.
const buttonGroupStyle = { width: '60px' }

/**
 * Extract just the subset of fields to build the state variable.
 */
function extractStateFields (props: Props): Substitution {
  const { description, normalizeSpace, pattern, replacement, valid } = props.substitution
  return {
    description: description || '',
    normalizeSpace: normalizeSpace || false,
    pattern,
    replacement,
    valid
  }
}

/**
 * Renders and lets user edit a substitution.
 */
export default class SubstitutionRow extends Component<Props, Substitution> {
  constructor (props: Props) {
    super(props)
    this.state = extractStateFields(props)
  }

  componentDidUpdate (prevProps: Props) {
    const { index, substitution } = this.props

    // If a new substition is associated with this component, reset its state.
    if (prevProps.index !== index || prevProps.substitution !== substitution) {
      this.setState(extractStateFields(this.props))
    }
  }

  _isEditing = (): boolean => {
    const { activeEditingIndex, index } = this.props
    return index === activeEditingIndex
  }

  _onChangePattern = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({ pattern: evt.target.value })
  }

  _onChangeReplacement = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({ replacement: evt.target.value })
  }

  _onEditNormalizeSpace = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    if (this._isEditing()) {
      this.setState({ normalizeSpace: evt.target.checked })
    }
  }

  _onChangeDescription = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this.setState({ description: evt.target.value })
  }

  _onClickEdit = () => {
    // Don't start editing on field click if another row is being edited.
    const { activeEditingIndex, index, onBeginEdit } = this.props
    if (activeEditingIndex === -1 && onBeginEdit) {
      onBeginEdit(index)
    }
  }

  _stopEditing = (index: number) => {
    this.props.onEndEdit(this.props.index)
  }

  _onClickDiscard = () => {
    this.setState(extractStateFields(this.props))
    this._stopEditing(this.props.index)
  }

  _onClickSave = () => {
    // Trigger the onChange event if the substitution fields were changed.
    const { index, onChange, substitution } = this.props
    if (!isEqual(this.state, substitution)) {
      onChange(this.state, index)
    }
    this._stopEditing(index)
  }

  _onKeyDown = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
    // Handle Enter and Esc keys on the text controls.
    switch (e.keyCode) {
      case 13: // [Enter]
        e.preventDefault()
        if (this._isEditing()) {
          this._onClickSave()
        }
        break
      case 27: // [Esc]
        e.preventDefault()
        return this._onClickDiscard()
      default:
        break
    }
  }

  _onRemove = () => {
    const { index, onRemove } = this.props
    if (onRemove) {
      onRemove(index)
    }
  }

  render () {
    const { activeEditingIndex, substitution: originalSubstitution } = this.props
    const { description, normalizeSpace, pattern, replacement, valid } = this.state
    const regexTestLink = `https://regexr.com/?expression=${encodeURIComponent(pattern)}&text=${STRING_FOR_REGEXR_TEST}`
    const isEditing = this._isEditing()
    const allowEdit = activeEditingIndex === -1
    const isPatternBlank = isSubstitutionBlank(this.state)
    const isPatternInvalid = !valid && pattern === originalSubstitution.pattern
    const isEditingInvalid = isPatternBlank || isPatternInvalid
    let validationMessage = null
    if (isPatternBlank) {
      validationMessage = 'Le motif de substitution ne peut être vide.'
    } else if (isPatternInvalid) {
      validationMessage = `Le motid de substitution '${originalSubstitution.pattern}' est invalide`
    }

    // Construct CSS class for row
    const editingClassName = isEditing ? '' : 'inactive'
    const allowEditClassName = allowEdit ? 'allow-edit' : ''
    const rowClassName = `substitution-row ${editingClassName} ${allowEditClassName}`

    // Override style for inputs with invalid search patterns.
    const patternStyleOverride = isPatternInvalid ? { borderColor: '#a94442' } : null

    return (
      <tr className={rowClassName}>
        <td>
          <FormGroup style={{ margin: 0 }} validationState={isEditingInvalid ? 'error' : null}>
            <InputGroup>
              <FormControl
                // Autofocus the pattern field when user begins editing the substitution row.
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={this._onChangePattern}
                onClick={this._onClickEdit}
                onKeyDown={this._onKeyDown}
                placeholder='Vérifier (regex) à chercher'
                readOnly={!isEditing}
                style={patternStyleOverride}
                title={validationMessage}
                value={pattern}
              />
              <InputGroup.Addon style={patternStyleOverride}>
                <a
                  href={regexTestLink}
                  target='_blank'
                  title='Vérifier cette regex'
                >
                  <Icon type='flask' />
                </a>
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
        </td>
        <td colSpan='2'>
          <InputGroup>
            <FormControl
              onChange={this._onChangeReplacement}
              onClick={this._onClickEdit}
              onKeyDown={this._onKeyDown}
              placeholder='<blank>'
              readOnly={!isEditing}
              value={replacement}
            />
            <InputGroup.Addon style={{ padding: '0 6px' }}>
              <input
                aria-label='Normaliser l’espace'
                checked={normalizeSpace}
                onChange={this._onEditNormalizeSpace}
                onClick={this._onClickEdit}
                style={{ padding: '0 6px' }}
                type='checkbox'
              />
            </InputGroup.Addon>
          </InputGroup>
        </td>
        <td>
          <FormControl
            onChange={this._onChangeDescription}
            onClick={this._onClickEdit}
            onKeyDown={this._onKeyDown}
            placeholder='Description optionnelle'
            readOnly={!isEditing}
            value={description}
          />
        </td>
        <td>
          {isEditing
            ? (
              // Show save/discard changes buttons if this row is being edited.
              <ButtonGroup style={buttonGroupStyle}>
                <Button
                  bsSize='xsmall'
                  disabled={isPatternInvalid}
                  onClick={this._onClickSave}
                  title={isPatternInvalid ? 'Impossible de sauvergarder, erreur dans cette ligne.' : 'Enregistrer les modifications de cette ligne.'}
                >
                  <Icon type='check' />
                </Button>
                <Button
                  bsSize='xsmall'
                  onClick={this._onClickDiscard}
                  title='Rejeter les modifications sur cette ligne'
                >
                  <Icon type='remove' />
                </Button>
              </ButtonGroup>
            )
            : allowEdit && (
              // Show edit/delete if no other row is being edited.
              <ButtonGroup style={buttonGroupStyle}>
                <Button
                  bsSize='xsmall'
                  onClick={this._onClickEdit}
                  title='Editer cette substitution'
                >
                  <Icon type='pencil' />
                </Button>
                <Button
                  bsSize='xsmall'
                  onClick={this._onRemove}
                  title='Supprimer cette substitution'
                >
                  <Icon type='trash' />
                </Button>
              </ButtonGroup>
            )
          }
        </td>
      </tr>
    )
  }
}
