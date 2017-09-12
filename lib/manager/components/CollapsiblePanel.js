import React, {PropTypes, Component} from 'react'
import {Button, Col, Panel, Glyphicon, Form, FormGroup, ControlLabel, FormControl} from 'react-bootstrap'

import {getMessage, getComponentMessages} from '../../common/util/config'

export default class CollapsiblePanel extends Component {
  static propTypes = {
    data: PropTypes.object,
    defaultExpanded: PropTypes.bool,
    fields: PropTypes.array,
    index: PropTypes.number,
    onChange: PropTypes.func,
    onRemove: PropTypes.func,
    updater: PropTypes.object
  }

  _onChange = (evt) => this.props.onChange(evt, this.props.index)

  _onRemove = () => this.props.onRemove(this.props.index)

  render () {
    const messages = getComponentMessages('ProjectSettings')
    const {fields, data, defaultExpanded, title} = this.props
    return (
      <Panel
        header={<h5 style={{width: '100%', cursor: 'pointer'}}>{title}</h5>}
        defaultExpanded={defaultExpanded}
        collapsible>
        <Form>
          <Button
            bsSize='xsmall'
            bsStyle='danger'
            className='pull-right'
            onClick={this._onRemove}>
            Remove <Glyphicon glyph='remove' />
          </Button>
          {fields.map((f, i) => {
            const fieldName = f.name.split('.').slice(-1)[0]
            return (
              <Col key={i} xs={f.width || 6}>
                <FormGroup>
                  <ControlLabel>{getMessage(messages, `deployment.${f.message}`)}</ControlLabel>
                  <FormControl
                    value={data[fieldName]}
                    {...f}
                    placeholder={f.placeholder || getMessage(messages, `deployment.${f.message}Placeholder`)}
                    name={f.name}
                    children={f.children
                      ? f.children.sort((a, b) => {
                        if (a.value < b.value) return -1
                        if (a.value > b.value) return 1
                        return 0
                      }).map((o, i) => (
                        <option key={i} {...o} />
                      ))
                      : undefined
                    }
                    onChange={this._onChange} />
                </FormGroup>
              </Col>
            )
          })}
        </Form>
      </Panel>
    )
  }
}
