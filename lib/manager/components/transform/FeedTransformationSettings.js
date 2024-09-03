// @flow

import React, {Component} from 'react'
import {
  Button,
  Col,
  ListGroup,
  ListGroupItem,
  Panel
} from 'react-bootstrap'

import * as feedsActions from '../../actions/feeds'
import type {
  Feed,
  FeedTransformRules as FeedTransformRulesType,
  Project
} from '../../../types'
import type {ManagerUserState} from '../../../types/reducers'

import FeedTransformRules from './FeedTransformRules'

function newRuleSet (
  retrievalMethods = ['FETCHED_AUTOMATICALLY', 'MANUALLY_UPLOADED'],
  transformations = []
) {
  return {
    retrievalMethods,
    transformations
  }
}

type Props = {
  disabled: ?boolean,
  feedSource: Feed,
  project: Project,
  updateFeedSource: typeof feedsActions.updateFeedSource,
  user: ManagerUserState
}

/**
 * This component shows all feed transformation settings for a feed source. These
 * settings allow a user to apply repeatable steps to modify incoming GTFS files.
 * Different steps can be configured for different retrieval methods (e.g.,
 * feeds published by the editor or feeds fetched by URL).
 */
export default class FeedTransformationSettings extends Component<Props> {
  _addRuleSet = () => {
    const {feedSource, updateFeedSource} = this.props
    const transformRules = [...feedSource.transformRules]
    // If adding first rule set, use default retrieval methods. Otherwise,
    // initialize to empty.
    const ruleSet = transformRules.length === 0
      ? newRuleSet()
      : newRuleSet([])
    transformRules.push(ruleSet)
    updateFeedSource(feedSource, {transformRules})
  }

  _deleteRuleSet = (index: number) => {
    const {feedSource, updateFeedSource} = this.props
    const transformRules = [...feedSource.transformRules]
    transformRules.splice(index, 1)
    updateFeedSource(feedSource, {transformRules})
  }

  _saveRuleSet = (ruleSet: FeedTransformRulesType, index: number) => {
    const {feedSource, updateFeedSource} = this.props
    const transformRules = [...feedSource.transformRules]
    transformRules.splice(index, 1, ruleSet)
    updateFeedSource(feedSource, {transformRules})
  }

  render () {
    const {
      disabled,
      feedSource
    } = this.props
    // Do not allow users without manage-feed permission to modify feed
    // transformation settings.
    // TODO: Should we improve this to show the feed transformations, but disable
    // making any changes?
    if (disabled) {
      return (
        <p className='lead'>
          L'utilisateur n'est pas autorisé à modifier les paramètres de transformation du flux.
        </p>
      )
    }
    return (
      <Col xs={7}>
        {/* Settings */}
        <Panel >
          <Panel.Heading><Panel.Title componentClass='h3'>Paramètres de transformation</Panel.Title></Panel.Heading>
          <Panel.Body>
            <ListGroup>
              <ListGroupItem>
                <p>
                  Les transformations de flux permettent de transformer
                  automatiquement les données GTFS chargé dans DataHub
                  Editor. Ajouter une transformation, décrire quand elle
                  doit être appliqué, et définir une série d'étapes de 
                  modification de la donnée.
                  Feed transformations provide a way to automatically transform
                </p>
                <Button onClick={this._addRuleSet}>
                  Ajouter une transformation
                </Button>
              </ListGroupItem>
              {feedSource.transformRules.map((ruleSet, i) => {
                return (
                  <FeedTransformRules
                    feedSource={feedSource}
                    index={i}
                    key={i}
                    onChange={this._saveRuleSet}
                    onDelete={this._deleteRuleSet}
                    ruleSet={ruleSet}
                  />
                )
              })}
            </ListGroup>
          </Panel.Body>
        </Panel>
      </Col>
    )
  }
}
