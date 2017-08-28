import React from 'react'
import { Button } from 'react-bootstrap'

export default class StatusMessage extends React.Component {
  state = {
    visible: true
  }

  clear = () => {
    this.setState({
      visible: false
    })
  }

  componentWillReceiveProps (newProps) {
    this.setState({
      visible: true
    })
  }

  render () {
    const styles = {
      position: 'fixed',
      left: '15px',
      bottom: '0px',
      height: '60px',
      zIndex: 1000
    }

    return (
      <div style={styles}>
        {this.props.message && this.state.visible
          ? <Button
            bsStyle='info'
            bsSize='large'
            onClick={this.clear}>
            {this.props.message}
          </Button>
          : null
        }
      </div>
    )
  }
}
