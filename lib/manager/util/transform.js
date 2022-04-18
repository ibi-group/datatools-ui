// @flow
import {getComponentMessages} from '../../common/util/config'
import type {
  FeedTransformation,
  FeedVersionSummary,
  Substitution
} from '../../types'

/**
 * Returns human readable name or description
 * for transformation type based on messages defined in
 * english.yml#components.FeedTransformationDescriptions.
 */
export function getTransformationName (
  type: string,
  transformation?: FeedTransformation,
  versionSummaries?: Array<FeedVersionSummary>
) {
  // Get the base component messages.
  const messages = getComponentMessages('FeedTransformationDescriptions')
  if (!transformation) return messages(`${type}.name`)
  if (type !== transformation['@type']) {
    console.error(`Input feed transformation type (${type}) does not match type found in transformation object`, transformation)
  }
  // Otherwise, build the label/description up piece by piece.
  const {sourceVersionId, table} = transformation
  let label = messages(`${type}.label`)
  // Note: Additional placeholder values can be added to this list and the below
  // switch statement.
  const placeholders = ['filePlaceholder', 'tablePlaceholder', 'versionPlaceholder']
  placeholders.forEach(placeholderId => {
    // Replacement text defaults to the placeholder value.
    let replacementText = messages(`general.${placeholderId}`)
    // But if the respective field has data defined, override the placeholder
    // value below.
    switch (placeholderId) {
      case 'filePlaceholder':
        if (transformation && transformation.typeName === 'ReplaceFileFromStringTransformation') {
          if (transformation.csvData) replacementText = messages(`general.fileDefined`)
        }
        break
      case 'tablePlaceholder':
        if (table) replacementText = `${table} ${messages(`general.table`)}`
        break
      case 'versionPlaceholder':
        const version = versionSummaries && versionSummaries.find(v => v.id === sourceVersionId)
        if (version) replacementText = `${messages(`general.version`)} ${version.version}`
        break
      default:
        console.warn(`No case defined for placeholder field: ${placeholderId}`)
        break
    }
    label = label.replace(`%${placeholderId}%`, replacementText)
  })
  return label
}

export function getTransformationPlaceholder (
  type: string,
  placeholderId: string
) {
  // Get the base component messages.
  const messages = getComponentMessages('FeedTransformationDescriptions')
  const messageId = `${type}.${placeholderId}`
  const message = messages(messageId)
  // If message does not exist for component, fall back on general message.
  return message.indexOf(messageId) !== -1
    ? messages(`general.${placeholderId}`)
    : message
}

/**
 * @returns true if the given substitution pattern is null or empty, false otherwise.
 */
export function isSubstitutionBlank (substitution: Substitution) {
  return !substitution.pattern || substitution.pattern === ''
}

/**
 * @returns true if the given substitution is marked invalid by the backend, false otherwise.
 */
export function isSubstitutionInvalid (substitution: Substitution) {
  return !substitution.valid
}
