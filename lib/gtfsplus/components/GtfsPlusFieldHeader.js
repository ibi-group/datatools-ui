import React, {PropTypes, Component} from 'react'
import {Glyphicon} from 'react-bootstrap'

export default class GtfsPlusFieldHeader extends Component {
  static propTypes = {
    field: PropTypes.object,
    showHelpClicked: PropTypes.func,
    table: PropTypes.object
  }

  _onClick = () => {
    this.props.showHelpClicked(this.props.table.id, this.props.field.name)
  }

  render () {
    const {field} = this.props
    const colHeaderStyle = {
      background: 'gray',
      borderRight: '4px solid white',
      borderBottom: '0px',
      color: 'white'
    }
    return (
      <th
        style={colHeaderStyle}
        className={`col-md-${field.columnWidth}`}>
        {field.name}{field.required ? ' *' : ''}
        <Glyphicon
          glyph='question-sign'
          className='pull-right'
          style={{ cursor: 'pointer' }}
          onClick={this._onClick} />
      </th>
    )
  }
}
