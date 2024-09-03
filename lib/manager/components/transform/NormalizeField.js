// @flow

import Icon from '@conveyal/woonerf/components/icon'
import { isEqual } from 'lodash'
import React, { Component } from 'react'
import {
  Button,
  Checkbox,
  ControlLabel,
  FormGroup,
  OverlayTrigger,
  Table,
  Tooltip
} from 'react-bootstrap'
import Select from 'react-select'

import { getComponentMessages } from '../../../common/util/config'
import GtfsFieldSelector from '../GtfsFieldSelector'
import { isSubstitutionBlank, isSubstitutionInvalid } from '../../util/transform'
import type {
  NormalizeFieldFields,
  ReactSelectOption,
  Substitution,
  TransformProps
} from '../../../types'

import SubstitutionRow from './SubstitutionRow'

type State = {
  activeEditingIndex: number,
  // Holds the contents that should be shown in the SubstitutionRow component.
  activeSubstitution: ?Substitution,
  // Last edited contents.
  previousEditingIndex: number,
  previousSubstitution: ?Substitution
}

/**
 * Determines whether two substitutions are equal (except for the valid field).
 */
function areSubstitutionsEqual (sub1: ?Substitution, sub2: ?Substitution): boolean {
  if (!sub1 || !sub2) return false
  return isEqual(
    {
      description: sub1.description,
      normalizeSpace: sub1.normalizeSpace,
      pattern: sub1.pattern,
      replacement: sub1.replacement
    },
    {
      description: sub2.description,
      normalizeSpace: sub2.normalizeSpace,
      pattern: sub2.pattern,
      replacement: sub2.replacement
    }
  )
}

/**
 * Component that renders input fields for the NormalizeFieldTransformation.
 */
export default class NormalizeField extends Component<TransformProps<NormalizeFieldFields>, State> {
  messages = getComponentMessages('NormalizeField')

  state = {
    activeEditingIndex: -1,
    activeSubstitution: null,
    previousEditingIndex: -1,
    previousSubstitution: null
  }

  componentDidMount () {
    this._updateErrors()
  }

  componentDidUpdate (prevProps: TransformProps<NormalizeFieldFields>) {
    if (prevProps.transformation !== this.props.transformation) {
      this._updateErrors()

      // If user entered an invalid substitution pattern and clicks save,
      // it will be rejected and the values entered will be lost.
      // To avoid that, keep the new row visible and in editing state.
      const { previousEditingIndex, previousSubstitution: editedSubstitution } = this.state
      const loadedSubstitution = this.props.transformation.substitutions[previousEditingIndex]
      if (previousEditingIndex !== -1 && !areSubstitutionsEqual(editedSubstitution, loadedSubstitution)) {
        this.setState({
          activeEditingIndex: previousEditingIndex,
          activeSubstitution: {
            ...editedSubstitution,
            valid: false
          }
        })
      }
    }
  }

  _onChangeFieldToNormalize = (fieldOption: ReactSelectOption) => {
    this._updateTransformation({fieldName: fieldOption.value})
  }

  _onChangeCapitalize = (evt: SyntheticInputEvent<HTMLInputElement>) => {
    this._updateTransformation({capitalize: evt.target.checked})
  }

  _onChangeCapitalizationExceptions = (values: Array<{value: string}>) => {
    this._updateTransformation({capitalizationExceptions: values.map(v => v.value)})
  }

  _onChangeSubstitution = (substitution: Substitution, index: number) => {
    const newSubstitutions = [].concat(this.props.transformation.substitutions)
    newSubstitutions[index] = substitution
    this.setState({
      activeSubstitution: null,
      previousSubstitution: substitution
    })
    this._updateTransformation({substitutions: newSubstitutions})
  }

  _onRemoveSubstitution = (index: number) => {
    const newSubstitutions = [].concat(this.props.transformation.substitutions)
    newSubstitutions.splice(index, 1)
    this.setState({ previousEditingIndex: -1 })
    this._updateTransformation({substitutions: newSubstitutions})
  }

  _onNewSubstitution = () => {
    this.setState({ activeEditingIndex: this.props.transformation.substitutions.length })
  }

  _getValidationErrors (fields: NormalizeFieldFields): Array<string> {
    const issues = []
    const { fieldName } = fields
    const { substitutions } = this.props.transformation

    // fieldName must be defined.
    if (!fieldName || fieldName.length === 0) {
      issues.push(this.messages('issues.fieldUndefined'))
    }

    // The pattern for substitutions must not be null or empty.
    if (substitutions.filter(isSubstitutionBlank).length > 0) {
      issues.push(this.messages('issues.substitutionUndefined'))
    }

    // The pattern for substitutions must be valid.
    if (substitutions.filter(isSubstitutionInvalid).length > 0) {
      issues.push(this.messages('issues.substitutionInvalid'))
    }

    return issues
  }

  _onBeginEditSubstitution = (index: number) => {
    this.setState({ activeEditingIndex: index })
  }

  _onEndEditSubstitution = () => {
    this.setState({
      activeEditingIndex: -1,
      activeSubstitution: null,
      previousEditingIndex: this.state.activeEditingIndex
    })
  }

  /**
   * Notify containing component of the resulting validation errors if any.
   * @param fields: The updated transformation fields. If not set, the initial transformation will be used.
   */
  _updateErrors = (fields?: NormalizeFieldFields) => {
    const { onValidationErrors } = this.props
    onValidationErrors(this._getValidationErrors(fields || this.props.transformation))
  }

  /**
   * Update the transformation
   * and perform and notify of validation checks.
   */
  _updateTransformation = (partialState: any) => {
    const { index, onSave, transformation } = this.props
    const newTransformation = {
      ...transformation,
      ...partialState
    }
    onSave(newTransformation, index)
    this._updateErrors(newTransformation)
  }

  render () {
    const { index, transformation } = this.props
    const { activeEditingIndex, activeSubstitution } = this.state
    const {
      capitalizationExceptions,
      capitalize,
      fieldName,
      substitutions
    } = transformation

    const capitalizationExceptionList = capitalizationExceptions.map(
      text => ({ label: text, value: text })
    )
    const capitalizationExceptionListId = `capitalizationExceptionList-${index}`

    const normalizeTooltip = (
      <Tooltip id='normalize-space-tooltip'>
        <p>
          Cette option modifiera le texte à remplacer
          par un espace.
        </p>
        <p>
          Par exemple, si "@" été remplacé par "et",
          alors "12@&nbsp;&nbsp;&nbsp;Ouest" deviendra "12 et Ouest".
        </p>
      </Tooltip>
    )

    const substituteTooltip = (
      <Tooltip id='substitute-space-tooltip'>
        <p>
          Entrer le texte à remplacer par une expression régulière regex.
          Attention aux caractères d'échappement (par exemple, entrer "\+" par "+")
        </p>
        <p>
          Cliquer sur <Icon title='Vérifier la regex' type='flask' /> pour 
          tester l'expression regex ou avoir de l'aide pour en écrire une.
        </p>
      </Tooltip>
    )

    return (
      <div>
        <GtfsFieldSelector
          onChange={this._onChangeFieldToNormalize}
          selectedField={fieldName}
          tableName={transformation.table}
        />

        <Checkbox
          checked={capitalize}
          onChange={this._onChangeCapitalize}
        >
          Respecter la casse (par exemple, "Rue Principale et Première Avenue")
        </Checkbox>
        <FormGroup>
          <ControlLabel htmlFor={capitalizationExceptionListId}>
            Exceptions de majuscule (par exemple, "via" ou "TER")
          </ControlLabel>
          <Select.Creatable
            arrowRenderer={null}
            clearable={false}
            id={capitalizationExceptionListId}
            multi
            onChange={this._onChangeCapitalizationExceptions}
            placeholder='Choisir les exceptions et appuyer sur Entrée'
            value={capitalizationExceptionList}
          />
        </FormGroup>

        <Table condensed>
          <thead>
            <tr>
              <th>
                Substitute
                <OverlayTrigger
                  overlay={substituteTooltip}
                  placement='top'
                >
                  <Icon type='info-circle' />
                </OverlayTrigger>
              </th>
              <th>With</th>
              <th style={{ lineHeight: '1.0', textAlign: 'right' }}>
                Normalize<br />space?
                <OverlayTrigger
                  overlay={normalizeTooltip}
                  placement='top'
                >
                  <Icon type='info-circle' />
                </OverlayTrigger>
              </th>
              <th style={{ width: '35%' }}>Description</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {substitutions.map((s, i) => (
              <SubstitutionRow
                activeEditingIndex={activeEditingIndex}
                index={i}
                key={i}
                onBeginEdit={this._onBeginEditSubstitution}
                onChange={this._onChangeSubstitution}
                onEndEdit={this._onEndEditSubstitution}
                onRemove={this._onRemoveSubstitution}
                substitution={activeEditingIndex === i ? (activeSubstitution || s) : s}
              />
            ))}
            {activeEditingIndex === substitutions.length &&
              // If user clicked 'Add', render the new substitution row.
              <SubstitutionRow
                activeEditingIndex={activeEditingIndex}
                index={activeEditingIndex}
                key={activeEditingIndex}
                onChange={this._onChangeSubstitution}
                onEndEdit={this._onEndEditSubstitution}
                substitution={activeSubstitution || {
                  pattern: '',
                  replacement: '',
                  valid: true
                }}
              />
            }
            <tr>
              <td colSpan='4' style={{ borderTop: 'none' }}>
                {substitutions.length === 0 && <p>(Pas de subsitutions définies)</p>}
                <Button
                  bsSize='xsmall'
                  disabled={activeEditingIndex !== -1}
                  onClick={this._onNewSubstitution}
                >
                  <Icon type='plus' /> Add
                </Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    )
  }
}
