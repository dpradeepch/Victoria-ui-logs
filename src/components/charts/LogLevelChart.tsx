import React, { useMemo } from 'react'
import uPlot from 'uplot'
import UPlotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'
import { LogEntry } from '../../types'
import { getLogLevelColor } from '../../utils'

interface LogLevelChartProps {
  logs: LogEntry[]
  height?: number
}

const LogLevelChart: React.FC<LogLevelChartProps> = ({ logs, height = 300 }) => {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { data: [[], []], options: {} }
    }

    // Count logs by level
    const levelCounts = logs.reduce((acc, log) => {
      const level = log.level || 'UNKNOWN'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const levels = Object.keys(levelCounts).sort()
    const counts = levels.map(level => levelCounts[level])

    // Prepare data for pie chart simulation using bars
    const data = [
      levels.map((_, index) => index),
      counts
    ]

    const series: uPlot.Series[] = [
      { label: 'Level' },
      {
        label: 'Count',
        stroke: '#3b82f6',
        fill: '#3b82f640',
        paths: uPlot.paths.bars!({ size: [0.8, 100] })
      }
    ]

    const options: uPlot.Options = {
      width: 400,
      height,
      series,
      scales: {
        x: {
          auto: false,
          range: [-0.5, levels.length - 0.5]
        },
        y: {
          auto: true,
          range: [0, null]
        }
      },
      axes: [
        {
          values: (u, vals) => vals.map(v => levels[Math.round(v)] || ''),
          space: 60
        },
        {
          space: 60,
          values: (u, vals) => vals.map(v => v.toFixed(0))
        }
      ],
      cursor: {
        show: true,
        x: false,
        y: true
      },
      legend: {
        show: false
      }
    }

    return { data, options }
  }, [logs, height])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-lg mb-2">No data available</div>
          <div className="text-slate-500 text-sm">Log level distribution will appear here</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <UPlotReact options={chartData.options} data={chartData.data} />
    </div>
  )
}

export default LogLevelChart
