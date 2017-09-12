import React, {Component, PropTypes} from 'react'
import moment from 'moment'
import gravatar from 'gravatar'
import { Panel, Row, Col, Glyphicon, FormControl, Button, ButtonToolbar, Media } from 'react-bootstrap'

import WatchButton from '../../common/containers/WatchButton'
import { getComponentMessages, getMessage } from '../../common/util/config'
import { getProfileLink } from '../../common/util/util'

export default class NotesViewer extends Component {
  static propTypes = {
    feedSource: PropTypes.object,
    newNotePosted: PropTypes.func,
    notes: PropTypes.array,
    notesRequested: PropTypes.func,
    stacked: PropTypes.bool,
    type: PropTypes.string,
    user: PropTypes.object,
    version: PropTypes.object
  }

  state = {
    value: ''
  }

  componentWillMount () {
    this.props.notesRequested(this.props.feedSource)
  }

  _onChangeBody = (evt) => this.setState({value: evt.target.value})

  _onClickPublish = () => {
    this.props.newNotePosted({body: this.state.value})
    this.setState({value: ''})
  }

  render () {
    const {
      feedSource,
      notes,
      notesRequested,
      stacked,
      user,
      version
    } = this.props
    const messages = getComponentMessages('NotesViewer')
    const userLink = user ? <a href={getProfileLink(user.profile.email)}>{user.profile.email}</a> : 'Unknown user'
    const isWatchingComments = feedSource
      ? user.subscriptions.hasFeedSubscription(feedSource.projectId, feedSource.id, 'feed-commented-on')
      : false
    const {Body, Heading, Left} = Media
    return (
      <Row>
        <Col
          xs={12}
          sm={stacked ? 12 : 8}
          md={stacked ? 12 : 6}>
          <h3>
            <ButtonToolbar className='pull-right'>
              <WatchButton
                isWatching={isWatchingComments}
                user={user}
                target={version ? version.id : feedSource.id}
                subscriptionType={version ? 'feedversion-commented-on' : 'feed-commented-on'} />
              <Button
                title={getMessage(messages, 'refresh')}
                onClick={notesRequested}>
                <Glyphicon glyph='refresh' /><span className='hidden-xs'> {getMessage(messages, 'refresh')}</span>
              </Button>
            </ButtonToolbar>
            {getMessage(messages, 'all')}
          </h3>
          {/* List of notes */}
          {notes && notes.length > 0
            ? notes.map(note => (
              <Media key={note.id}>
                <Left>
                  <img
                    width={64}
                    height={64}
                    src={`${gravatar.url(note.userEmail, {protocol: 'https', s: '100'})}`}
                    alt={note.userEmail} />
                </Left>
                <Body>
                  <Panel
                    className='comment-panel'
                    header={
                      <Heading>
                        <a href={getProfileLink(user.profile.email)}>{user.profile.email}</a>
                        {' '}
                        <small title={moment(note.date).format('h:MMa, MMM. DD YYYY')}>
                          commented {moment(note.date).fromNow()}
                        </small>
                      </Heading>
                    }>
                    <p>{note.body || '(no content)'}</p>
                  </Panel>
                </Body>
              </Media>
            ))
            : <p><i>{getMessage(messages, 'none')}</i></p>
          }
        </Col>
        {/* Post note form */}
        <Col xs={12} sm={stacked ? 12 : 4} md={stacked ? 12 : 6}>
          <h3>{getMessage(messages, 'postComment')}</h3>
          <Media>
            <Left>
              <img
                alt={user.email}
                width={64}
                height={64}
                src={user ? user.profile.picture : ''} />
            </Left>
            <Body>
              <Panel className='comment-panel' header={<Heading>{userLink}</Heading>}>
                <FormControl
                  ref='newNoteBody'
                  componentClass='textarea'
                  value={this.state.value}
                  onChange={this._onChangeBody} />
                <Button
                  className='pull-right'
                  style={{marginTop: '10px'}}
                  disabled={this.state.value === ''}
                  onClick={this._onClickPublish}>
                  {getMessage(messages, 'new')}
                </Button>
              </Panel>
            </Body>
          </Media>
        </Col>
      </Row>
    )
  }
}
