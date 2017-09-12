import Icon from '@conveyal/woonerf/components/icon'
import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import { Form, FormControl, InputGroup, FormGroup, Button } from 'react-bootstrap'
import { Link } from 'react-router'

export default class EditableTextField extends Component {
  static propTypes = {
    disabled: PropTypes.bool,
    inline: PropTypes.bool,
    hideEditButton: PropTypes.bool,
    isEditing: PropTypes.bool,
    link: PropTypes.string,
    maxLength: PropTypes.number,
    min: PropTypes.number,
    placeholder: PropTypes.string,
    step: PropTypes.number,
    tabIndex: PropTypes.number,
    type: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func
  }

  static defaultProps = {
    style: {},
    type: 'text'
  }

  state = {
    isEditing: this.props.isEditing || false,
    value: this.props.value
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.value !== nextProps.value) this.setState({ value: nextProps.value })
  }

  edit = () => {
    this.setState({
      isEditing: true
    })
  }

  save = () => {
    const value = ReactDOM.findDOMNode(this.input).value
    if (value === this.state.value) {
      return this.cancel()
    }
    this.props.onChange && this.props.onChange(value)
    this.setState({
      isEditing: false,
      value
    })
  }

  cancel () {
    this.setState({isEditing: false})
  }

  handleKeyDown = (e) => {
    // if [Enter] or [Tab] is pressed
    if ((e.keyCode === 9 || e.keyCode === 13) && this.state.isEditing) {
      this.save()
    }
    // if [Esc] is pressed
    if (e.keyCode === 27) {
      this.cancel()
    }
  }

  _ref = input => {
    this.input = input
    // auto-focus on text input when input is rendered (instead of disallowed autofocus prop)
    this.input && ReactDOM.findDOMNode(this.input).focus()
  }

  _onInputFocus = (e) => {
    // select entire text string on input focus
    e.target.select()
  }

  render () {
    const {
      disabled,
      hideEditButton,
      inline,
      link,
      maxLength,
      min,
      placeholder,
      step,
      style,
      tabIndex,
      type
    } = this.props
    const {
      isEditing,
      value
    } = this.state
    // trim length of display text to fit content
    const displayValue = maxLength !== null && value && value.length > maxLength
          ? `${value.substr(0, maxLength)}...`
          : value || '(none)'
    if (inline) {
      style.display = 'inline-block'
    }
    return (
      <div
        style={style}>
        {isEditing
          ? <Form
            inline={inline}>
            <FormGroup>
              <InputGroup>
                <FormControl
                  ref={this._ref}
                  type={type.toLowerCase()}
                  min={min}
                  step={step}
                  placeholder={placeholder}
                  onKeyDown={this.handleKeyDown}
                  onFocus={this._onInputFocus}
                  defaultValue={value} />
                <InputGroup.Button>
                  <Button
                    onClick={this.save}>
                    <Icon type='check' />
                  </Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </Form>
          : <span>
            <span title={value}>
              {link
                ? <Link to={link}>{displayValue}</Link>
                : displayValue
              }
            </span>
            {hideEditButton
              ? null
              : <Button
                bsStyle='link'
                tabIndex={tabIndex}
                onClick={this.edit}
                disabled={disabled}>
                <Icon type='pencil' />
              </Button>
            }
          </span>
        }
      </div>
    )
  }
}
