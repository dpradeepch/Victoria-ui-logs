import React, { useMemo } from 'react'
import uPlot from 'uplot'
import UPlotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'
import { LogEntry } from '../../types'

interface TimelineChartProps {
  logs: LogEntry[]
  height?: number
}

const TimelineChart: React.FC<TimelineChartProps> = ({ logs, height = 200 }) => {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { data: [[], []], options: {} }
    }

    // Group logs by 1-minute intervals
    const bucketSize = 60 * 1000 // 1 minute
    const buckets = new Map<number, number>()

    // Find time range
    const times = logs.map(log => new Date(log._time).getTime())
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    // Initialize buckets
    for (let time = minTime; time <= maxTime; time += bucketSize) {
      const bucketTime = Math.floor(time / bucketSize) * bucketSize
      buckets.set(bucketTime, 0)
    }

    // Fill buckets
    logs.forEach(log => {
      const logTime = new Date(log._time).getTime()
      const bucketTime = Math.floor(logTime / bucketSize) * bucketSize
      buckets.set(bucketTime, (buckets.get(bucketTime) || 0) + 1)
    })

    const timestamps = Array.from(buckets.keys()).sort()
    const counts = timestamps.map(t => buckets.get(t) || 0)

    const data = [
      timestamps.map(t => t / 1000), // Convert to seconds
      counts
    ]

    const series: uPlot.Series[] = [
      { value: '{YYYY}-{MM}-{DD} {HH}:{mm}' },
      {
        label: 'Logs per minute',
        stroke: '#10b981',
        fill: '#10b98120',
        width: 2
      }
    ]

    const options: uPlot.Options = {
      width: 800,
      height,
      series,
      scales: {
        x: { time: true },
        y: { auto: true, range: [0, null] }
      },
      axes: [
        {
          space: 80,
          incrs: [60, 300, 900, 1800, 3600],
          values: [
            [3600, "{h}:{mm}", "\n{M}/{D}", null, "\n{M}/{D}", null, null, null, 1],
            [60, "{h}:{mm}", "\n{M}/{D}", null, "\n{M}/{D}", null, null, null, 1]
          ]
        },
        {
          space: 50,
          values: (u, vals) => vals.map(v => v.toFixed(0))
        }
      ],
      cursor: { show: true },
      legend: { show: false }
    }

    return { data, options }
  }, [logs, height])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No timeline data</div>
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

export default TimelineChart
