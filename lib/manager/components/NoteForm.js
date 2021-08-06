// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import { Button, Checkbox, Col, FormControl, Media, Panel } from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import { getProfileLink } from '../../common/util/util'
import type {Feed} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

type Props = {
  feedSource: Feed,
  newNotePosted: ({body: string}) => void,
  stacked?: boolean,
  user: ManagerUserState
}

type State = {
  adminOnly: boolean,
  body: string
}

const DEFAULT_STATE = {
  adminOnly: false,
  body: ''
}

/**
 * This component shows a form that allows a user to submit a note for either a
 * feed source or feed version.
 */
export default class NoteForm extends Component<Props, State> {
  messages = getComponentMessages('NoteForm')
  state = DEFAULT_STATE

  _onChange = ({target}: {target: HTMLInputElement}) => {
    const value = target.type === 'checkbox' ? target.checked : target.value
    this.setState({[target.name]: value})
  }

  _onClickPublish = () => {
    this.props.newNotePosted(this.state)
    this.setState(DEFAULT_STATE)
  }

  render () {
    console.log(this.state)
    const {
      feedSource,
      stacked,
      user
    } = this.props
    const {Body, Heading, Left} = Media
    const {adminOnly, body} = this.state
    const {profile} = user
    if (!profile) {
      console.warn('Could not locate user profile', user)
      return null
    }
    const isProjectAdmin = user.permissions && user.permissions.isProjectAdmin(
      feedSource.projectId, feedSource.organizationId
    )
    return (
      <form>
        <Col xs={12} sm={stacked ? 12 : 4} md={stacked ? 12 : 6}>
          <h3>{this.messages('postComment')}</h3>
          <Media>
            <Left>
              <img
                alt={profile.email}
                height={64}
                width={64}
                src={profile.picture} />
            </Left>
            <Body>
              <Panel
                className='comment-panel'
                header={
                  <Heading>
                    <a href={getProfileLink(profile.email)}>{profile.email}</a>
                  </Heading>
                }
              >
                <FormControl
                  componentClass='textarea'
                  name='body'
                  style={{resize: 'none'}}
                  onChange={this._onChange}
                  value={body} />
                <Button
                  className='pull-right'
                  disabled={body === ''}
                  onClick={this._onClickPublish}
                  // Ensure button clicking is not obscured by checkbox.
                  style={{marginTop: '10px', position: 'relative', zIndex: 2}}
                  type='submit'
                >
                  {this.messages('new')}
                </Button>
                {isProjectAdmin &&
                  <Checkbox
                    checked={adminOnly}
                    name='adminOnly'
                    onChange={this._onChange}
                  >
                    <Icon type='lock' /> {this.messages('adminOnly')}
                  </Checkbox>
                }
              </Panel>
            </Body>
          </Media>
        </Col>
      </form>
    )
  }
}
