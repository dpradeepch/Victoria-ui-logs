import React, { useMemo } from 'react'
import uPlot from 'uplot'
import UPlotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'
import { LogEntry } from '../../types'
import { getLogLevelColor } from '../../utils'

interface StackedAreaChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
  groupBy?: 'level' | 'service'
}

const StackedAreaChart: React.FC<StackedAreaChartProps> = ({ 
  logs, 
  height = 300, 
  title = "Stacked Trends",
  groupBy = 'level'
}) => {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { data: [[], []], options: {} }
    }

    // Group logs by 10-minute intervals
    const bucketSize = 10 * 60 * 1000 // 10 minutes
    const buckets = new Map<number, Map<string, number>>()

    // Determine time range
    const startTime = new Date(Math.min(...logs.map(log => new Date(log._time).getTime())))
    const endTime = new Date(Math.max(...logs.map(log => new Date(log._time).getTime())))

    // Initialize buckets
    for (let time = startTime.getTime(); time <= endTime.getTime(); time += bucketSize) {
      buckets.set(time, new Map())
    }

    // Fill buckets
    logs.forEach(log => {
      const logTime = new Date(log._time).getTime()
      const bucketTime = Math.floor(logTime / bucketSize) * bucketSize
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, new Map())
      }

      const bucket = buckets.get(bucketTime)!
      const groupKey = log[groupBy] || 'unknown'
      bucket.set(groupKey, (bucket.get(groupKey) || 0) + 1)
    })

    // Get all group keys and limit to top 5
    const allGroups = new Set<string>()
    buckets.forEach(bucket => {
      bucket.forEach((_, key) => allGroups.add(key))
    })

    let groupKeys = Array.from(allGroups)
    if (groupKeys.length > 5) {
      // Count totals and take top 5
      const groupTotals = new Map<string, number>()
      logs.forEach(log => {
        const key = log[groupBy] || 'unknown'
        groupTotals.set(key, (groupTotals.get(key) || 0) + 1)
      })
      
      groupKeys = Array.from(groupTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => key)
    }

    // Prepare data for stacked chart
    const timestamps = Array.from(buckets.keys()).sort()
    const data: (number | null)[][] = [
      timestamps.map(t => t / 1000) // Convert to seconds
    ]

    // Create stacked data
    const stackedData: number[][] = groupKeys.map(() => [])
    
    timestamps.forEach((timestamp, timeIndex) => {
      const bucket = buckets.get(timestamp) || new Map()
      let stackBase = 0
      
      groupKeys.forEach((groupKey, groupIndex) => {
        const value = bucket.get(groupKey) || 0
        stackedData[groupIndex][timeIndex] = stackBase + value
        stackBase += value
      })
    })

    // Add stacked series to data
    stackedData.forEach(series => data.push(series))

    // Configure series
    const series: uPlot.Series[] = [
      { }, // Time axis
      ...groupKeys.map((groupKey, index) => ({
        label: groupKey,
        stroke: getLogLevelColor(groupKey),
        fill: getLogLevelColor(groupKey) + '60',
        width: 2,
        paths: uPlot.paths.linear!(),
      }))
    ]

    const options: uPlot.Options = {
      title: title,
      width: 600,
      height,
      series,
      scales: {
        x: { time: true },
        y: { auto: true, range: [0, null] }
      },
      axes: [
        {
          space: 80,
          incrs: [
            1, 2, 5, 10, 15, 30,
            60, 120, 300, 600, 900, 1800,
            3600, 7200, 14400, 28800, 57600, 86400
          ],
          values: [
            [3600 * 24 * 365, "{YYYY}", null, null, null, null, null, null, 1],
            [3600 * 24 * 28, "{MMM}", "\n{YYYY}", null, null, null, null, null, 1],
            [3600 * 24, "{M}/{D}", "\n{YYYY}", null, null, null, null, null, 1],
            [3600, "{h}{aa}", "\n{M}/{D}/{YY}", null, "\n{M}/{D}", null, null, null, 1],
            [60, "{h}:{mm}{aa}", "\n{M}/{D}/{YY}", null, "\n{M}/{D}", null, null, null, 1],
            [1, ":{ss}", "\n{h}:{mm}{aa} {M}/{D}", null, "\n{h}:{mm}{aa}", null, "\n{h}:{mm}", null, 1],
          ],
        },
        {
          space: 60,
          values: (u, vals) => vals.map(v => v.toFixed(0)),
        },
      ],
      cursor: { show: true, x: true, y: true },
      legend: { show: true, live: true }
    }

    return { data, options }
  }, [logs, height, title, groupBy])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for stacked chart</div>
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

export default StackedAreaChart
