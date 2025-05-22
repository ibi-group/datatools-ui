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
          User is not authorized to modify feed transformation settings.
        </p>
      )
    }
    return (
      <Col xs={7}>
        {/* Settings */}
        <Panel >
          <Panel.Heading><Panel.Title componentClass='h3'>Transformation Settings</Panel.Title></Panel.Heading>
          <Panel.Body>
            <ListGroup>
              <ListGroupItem>
                <p>
                  Feed transformations provide a way to automatically transform
                  GTFS data that is loaded into Data Tools. Add a transformation,
                  describe when it should be applied (e.g., only to feeds uploaded
                  manually), and then define a series of steps to modify the data.
                </p>
                <Button onClick={this._addRuleSet}>
                  Add transformation
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
