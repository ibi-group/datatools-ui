// @flow

import React, {Component} from 'react'
import { shallowEqual } from 'react-pure-render'
import Select from 'react-select'

import type { ReactSelectOption } from '../../types'

type Props = {
  clearable?: boolean,
  onChange: ReactSelectOption => void,
  options: Array<ReactSelectOption>,
  placeholder: string,
  refString: string,
  value: ?string
}

type State = {value: ?(string | ReactSelectOption)}

export default class GtfsEntitySelect extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      value: this.props.value
    })
  }

  componentWillReceiveProps (nextProps: Props) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
    }
  }

  onChange = (value: ReactSelectOption) => {
    const {onChange} = this.props
    this.setState({value})
    onChange && onChange(value)
  }

  render () {
    const {clearable, options, placeholder, refString} = this.props
    return (
      <Select
        clearable={clearable}
        filterOptions
        onChange={this.onChange}
        options={options}
        placeholder={placeholder}
        ref={refString}
        style={{marginBottom: '20px'}}
        value={this.state.value}
      />
    )
  }
}
