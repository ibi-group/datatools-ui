// @flow

import React, { Component } from 'react'
import moment from 'moment'

import Loading from '../../../common/components/Loading'
import toSentenceCase from '../../../common/util/text'
import {getChartMax, getChartPeriod} from '../../util'
import type {ValidationResult} from '../../../types'

type Props = {
  validationResult: ValidationResult
}

const COLORS = {
  SEMAINE: '#8da0cb',
  SAMEDI: '#66c2a5',
  DIMANCHE: '#fc8d62'
}
const maxDaysToShow = 500

export default class TripsChart extends Component<Props> {
  render () {
    const {validationResult} = this.props
    if (!validationResult || !validationResult.dailyTripCounts) {
      return <Loading />
    }
    const {dailyTripCounts, firstCalendarDate} = validationResult
    const firstDate = moment(firstCalendarDate)
    const data = dailyTripCounts
      .slice(0, maxDaysToShow)
      .map((count, index) => [firstDate.clone().add(index, 'days'), count])
    const graphHeight = 300
    const spacing = 8
    const leftMargin = 50
    const rightMargin = 50
    const bottomMargin = 75
    const svgWidth = leftMargin + rightMargin + (data.length * spacing)
    const svgHeight = graphHeight + bottomMargin
    const maxTrips = Math.max.apply(Math, data.map(d => d[1]))
    const yAxisMax = getChartMax(maxTrips)
    const yAxisPeriod = getChartPeriod(maxTrips)
    const yAxisLabels = []
    for (var i = yAxisPeriod; i <= yAxisMax; i += yAxisPeriod) {
      yAxisLabels.push(i)
    }
    const curtailed = maxDaysToShow < dailyTripCounts.length
    return (
      <div
        className='text-center'
        style={{
          width: '100%',
          height: `${svgHeight}px`,
          overflowX: 'scroll',
          overflowY: 'hidden',
          border: '#ddd'
        }}>
        <svg style={{width: svgWidth, height: `${svgHeight}px`, paddingTop: '5px'}}>
          {yAxisLabels.map((l, index) => {
            const y = graphHeight - ((l / yAxisMax) * graphHeight)
            return <g key={index}>
              <line
                x1={0} y1={y}
                x2={svgWidth} y2={y}
                stroke='gray'
                strokeWidth={1}
              />
              <text x={0} y={y - 2} fill='gray'>
                {l}
              </text>
            </g>
          })}
          {data.map((d, index) => {
            const dow = d[0].day()
            const dateString = d[0].format('YYYY-MM-DD')
            const x = leftMargin + (spacing / 2) + (index * spacing)

            // generate the bar for this date
            return (
              <g key={index}>
                <title>{dateString}: {d[1]} trajets</title>
                <line
                  x1={x} y1={graphHeight - ((d[1] / yAxisMax) * graphHeight)}
                  x2={x} y2={graphHeight}
                  title={`${dateString}: ${d[1]} trips`}
                  stroke={dow === 0
                    ? COLORS.DIMANCHE
                    : dow === 6
                      ? COLORS.SAMEDI
                      : COLORS.SEMAINE
                  }
                  strokeWidth={7} />
                {/* label x-axis with dates every 14 days */}
                {index % 14 === 0
                  ? <g>
                    <line x1={x} y1={graphHeight} x2={x} y2={graphHeight + 12} stroke='black' />
                    <text x={x - 35} y={graphHeight + 26} fill='black'>
                      {dateString}
                    </text>
                  </g>
                  : null
                }
              </g>
            )
          })}
          {/* Add baseline to chart */}
          <line
            x1={0}
            y1={graphHeight}
            x2={svgWidth}
            y2={graphHeight}
            stroke='black'
            strokeWidth={2} />
          {/* Add legend for bar colors */}
          {Object.keys(COLORS).map((k, i) => (
            <g key={k}>
              <rect
                x={100 * i - 5}
                y={graphHeight + 30}
                width='80'
                height='18'
                fill={COLORS[k]} />
              <text x={100 * i} y={graphHeight + 43} fill='black'>
                {toSentenceCase(k)}
              </text>
            </g>
          ))}
          {curtailed &&
            <text x={100 * Object.keys(COLORS).length} y={graphHeight + 43}>
              * seuls les 500 premiers jours de service sont affichés
            </text>
          }
        </svg>
      </div>
    )
  }
}
