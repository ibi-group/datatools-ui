// @flow

import Icon from '@conveyal/woonerf/components/icon'
import React, {Component} from 'react'
import moment from 'moment'
import gravatar from 'gravatar'
import { Panel, Row, Col, Glyphicon, Button, ButtonToolbar, Media } from 'react-bootstrap'

import {getComponentMessages} from '../../common/util/config'
import { getProfileLink } from '../../common/util/util'
import type {Feed, Note} from '../../types'
import type {ManagerUserState} from '../../types/reducers'

import NoteForm from './NoteForm'

type Props = {
  feedSource: Feed,
  newNotePosted: ({body: string}) => void,
  notes: ?Array<Note>,
  notesRequested: () => void,
  stacked?: boolean,
  user: ManagerUserState
}

export default class NotesViewer extends Component<Props> {
  messages = getComponentMessages('NotesViewer')

  componentWillMount () {
    this.props.notesRequested()
  }

  _getUserUrl = (email: string): string =>
    gravatar.url(email, {protocol: 'https', s: '100'})

  render () {
    const {
      feedSource,
      newNotePosted,
      notes,
      notesRequested,
      stacked,
      user
    } = this.props
    const {Body, Heading, Left} = Media
    return (
      <Row>
        <Col
          md={stacked ? 12 : 6}
          sm={stacked ? 12 : 8}
          xs={12}>
          <h3>
            <ButtonToolbar className='pull-right'>
              <Button
                onClick={notesRequested}
                title={this.messages('refresh')}>
                <Glyphicon glyph='refresh' />
                <span className='hidden-xs'>
                  {' '}{this.messages('refresh')}
                </span>
              </Button>
            </ButtonToolbar>
            {this.messages('all')}
          </h3>
          {/* List of notes */}
          {notes && notes.length > 0
            ? notes.sort((a, b) => b.dateCreated - a.dateCreated).map(note => {
              const noteDate = moment(note.date)
              return (
                <Media key={note.id}>
                  <Left>
                    <img
                      alt={note.userEmail}
                      height={64}
                      src={`${this._getUserUrl(note.userEmail)}`}
                      width={64} />
                  </Left>
                  <Body>
                    <Panel className='comment-panel'>
                      <Panel.Heading>
                        <Heading>
                          {note.adminOnly &&
                          <Icon
                            className='pull-right'
                            title={this.messages('adminOnly')}
                            type='lock' />
                          }
                          <a href={getProfileLink(note.userEmail)}>
                            {note.userEmail}
                          </a>
                          {' '}
                          <small title={noteDate.format('h:MMa, MMM. DD YYYY')}>
                            commented {noteDate.fromNow()}
                          </small>
                        </Heading>
                      </Panel.Heading>
                      <Panel.Body>
                        <p>{note.body || '(aucun contenu)'}</p>
                      </Panel.Body>
                    </Panel>
                  </Body>
                </Media>
              )
            })
            : <p><i>{this.messages('none')}</i></p>
          }
        </Col>
        <NoteForm
          feedSource={feedSource}
          newNotePosted={newNotePosted}
          stacked={stacked}
          user={user}
        />
      </Row>
    )
  }
}
