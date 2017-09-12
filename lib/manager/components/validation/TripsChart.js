import React, { Component, PropTypes } from 'react'
import moment from 'moment'
// import rd3 from 'rd3'

import Loading from '../../../common/components/Loading'

export default class TripsChart extends Component {
  static propTypes = {
    validationResult: PropTypes.object,
    fetchValidationResult: PropTypes.func
  }
  componentWillMount () {
    if (!this.props.validationResult) {
      this.props.fetchValidationResult()
    }
  }
  render () {
    if (!this.props.validationResult) {
      return <Loading />
    }
    const tripsPerDate = this.props.validationResult.tripsPerDate
    const data = Object.keys(tripsPerDate).map(key => [key, tripsPerDate[key]])
    const graphHeight = 300
    const spacing = 8
    const leftMargin = 50
    const bottomMargin = 50
    const svgWidth = leftMargin + (data.length * spacing)
    const svgHeight = graphHeight + bottomMargin
    const maxTrips = Math.max.apply(Math, data.map(d => d[1]))
    const yAxisMax = Math.ceil(maxTrips / 100) * 100
    // console.log(maxTrips, yAxisMax)

    const yAxisPeriod = maxTrips > 1000 ? 1000 : 100
    const yAxisLabels = []
    for (var i = yAxisPeriod; i <= yAxisMax; i += yAxisPeriod) {
      yAxisLabels.push(i)
    }
    return (
      <div
        style={{
          width: '100%',
          height: `${svgHeight}px`,
          overflowX: 'scroll',
          overflowY: 'hidden',
          border: '#ddd'
        }}>
        <svg style={{width: svgWidth, height: `${svgHeight}px`}}>
          {yAxisLabels.map((l, index) => {
            const y = graphHeight - ((l / yAxisMax) * graphHeight)
            return <g key={index}>
              <line
                x1={0} y1={y}
                x2={svgWidth} y2={y}
                stroke='gray'
                strokesvgWidth={1} />
              <text x={0} y={y - 2} fill='gray'>
                {l}
              </text>
            </g>
          })}
          {data.map((d, index) => {
            const dow = moment(d[0]).day()
            const x = leftMargin + (spacing / 2) + (index * spacing)

            // generate the bar for this date
            return (
              <g key={index}>
                <line
                  x1={x} y1={graphHeight - ((d[1] / yAxisMax) * graphHeight)}
                  x2={x} y2={graphHeight}
                  stroke={dow === 0
                    ? '#fc8d62'
                    : dow === 6
                    ? '#66c2a5'
                    : '#8da0cb'
                  }
                  strokeWidth={7} />
                {index % 14 === 0 /* label the date every 14 days */
                  ? <g>
                    <line x1={x} y1={graphHeight} x2={x} y2={graphHeight + 12} stroke='black' />
                    <text x={x - 35} y={graphHeight + 26} fill='black'>
                      {d[0]}
                    </text>
                  </g>
                  : null
                }
              </g>
            )
          }
        )}
          <line
            x1={0}
            y1={graphHeight}
            x2={svgWidth}
            y2={graphHeight}
            stroke='black'
            strokeWidth={2} />
        </svg>
      </div>
    )
  }
}
