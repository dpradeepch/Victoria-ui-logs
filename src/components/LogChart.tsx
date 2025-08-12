import React, { useMemo, useRef, useEffect, useState } from 'react'
import uPlot from 'uplot'
import UPlotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'
import { LogEntry } from '../types'
import { getLogLevelColor } from '../utils'

interface LogChartProps {
  logs: LogEntry[]
  height?: number
  timeRange?: { start: Date; end: Date }
  groupBy?: 'level' | 'service' | 'host'
  chartType?: 'line' | 'bar'
  maxYValue?: number
  showServiceDropdown?: boolean
}

const LogChart: React.FC<LogChartProps> = ({
  logs,
  height = 300,
  timeRange,
  groupBy = 'level',
  chartType = 'line',
  maxYValue,
  showServiceDropdown = false
}) => {
  const chartRef = useRef<uPlot | null>(null)
  const [selectedService, setSelectedService] = useState<string>('all')

  // Process logs data for charting
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        data: [[], []],
        options: {}
      }
    }

    // Filter logs based on selected service
    let filteredLogs = logs
    if (groupBy === 'service' && showServiceDropdown && selectedService !== 'all') {
      filteredLogs = logs.filter(log => (log.service || 'unknown') === selectedService)
    }

    // Group logs by time intervals (5-minute buckets)
    const bucketSize = 5 * 60 * 1000 // 5 minutes in milliseconds
    const buckets = new Map<number, Map<string, number>>()

    // Determine time range
    const startTime = timeRange?.start || new Date(Math.min(...filteredLogs.map(log => new Date(log._time).getTime())))
    const endTime = timeRange?.end || new Date(Math.max(...filteredLogs.map(log => new Date(log._time).getTime())))

    // Initialize buckets
    for (let time = startTime.getTime(); time <= endTime.getTime(); time += bucketSize) {
      buckets.set(time, new Map())
    }

    // Fill buckets with log counts
    filteredLogs.forEach(log => {
      const logTime = new Date(log._time).getTime()
      const bucketTime = Math.floor(logTime / bucketSize) * bucketSize
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, new Map())
      }

      const bucket = buckets.get(bucketTime)!
      const groupKey = log[groupBy] || 'unknown'
      bucket.set(groupKey, (bucket.get(groupKey) || 0) + 1)
    })

    // Get all unique group keys and limit them for better visibility
    const allGroups = new Set<string>()
    buckets.forEach(bucket => {
      bucket.forEach((_, key) => allGroups.add(key))
    })
    
    let groupKeys = Array.from(allGroups)
    
    // Handle service filtering with dropdown
    if (groupBy === 'service' && showServiceDropdown) {
      if (selectedService !== 'all') {
        // Filter to show only selected service
        groupKeys = [selectedService]
      } else {
        // Show all services, sorted alphabetically
        groupKeys = groupKeys.sort()
      }
    } else if (groupBy === 'service' && !showServiceDropdown && groupKeys.length > 5) {
      // For services without dropdown, limit to top 5 most active services to avoid clutter
      const serviceCounts = new Map<string, number>()
      filteredLogs.forEach(log => {
        const service = log.service || 'unknown'
        serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1)
      })
      
      // Sort by count and take top 5
      const topServices = Array.from(serviceCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([service]) => service)
      
      groupKeys = topServices
    } else {
      groupKeys = groupKeys.sort()
    }

    // Prepare data for uPlot
    const timestamps = Array.from(buckets.keys()).sort()
    const data: (number | null)[][] = [
      timestamps.map(t => t / 1000) // Convert to seconds for uPlot
    ]

    // Add series for each group
    groupKeys.forEach(groupKey => {
      const series = timestamps.map(timestamp => {
        const bucket = buckets.get(timestamp)
        return bucket?.get(groupKey) || 0
      })
      data.push(series)
    })

    // Configure uPlot options
    const series: uPlot.Series[] = [
      {
        // Time axis
      },
      ...groupKeys.map((groupKey, index) => ({
        label: groupKey,
        stroke: getLogLevelColor(groupKey),
        fill: chartType === 'bar' ? getLogLevelColor(groupKey) + '40' : undefined,
        width: 2,
        paths: chartType === 'bar' ? uPlot.paths.bars!({ size: [0.9, 100] }) : undefined,
      }))
    ]

    const options: uPlot.Options = {
      title: groupBy === 'service' && groupKeys.length === 5 ? 
        `Top 5 Most Active Services` : 
        `Logs by ${groupBy}`,
      width: 800,
      height,
      series,
      scales: {
        x: {
          time: true,
        },
        y: {
          auto: false,
          range: [0, maxYValue || (groupBy === 'level' ? 50 : 20)],
        },
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
            [0.001, ":{ss}.{fff}", "\n{h}:{mm}{aa} {M}/{D}", null, "\n{h}:{mm}{aa}", null, "\n{h}:{mm}", null, 1],
          ],
        },
        {
          space: 60,
          values: (u, vals) => vals.map(v => v.toFixed(0)),
        },
      ],
      cursor: {
        show: true,
        x: true,
        y: true,
      },
      legend: {
        show: groupKeys.length <= 8, // Hide legend if too many items
        live: true,
      },
      plugins: [
        {
          hooks: {
            ready: [
              (u) => {
                chartRef.current = u
              }
            ]
          }
        }
      ]
    }

    return { data, options }
  }, [logs, height, timeRange, groupBy, chartType, selectedService, maxYValue, showServiceDropdown])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const container = chartRef.current.root.parentElement
        if (container) {
          chartRef.current.setSize({
            width: container.clientWidth,
            height: height
          })
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [height])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No data to display</div>
          <div className="text-gray-500 text-sm">Run a query to see log visualization</div>
        </div>
      </div>
    )
  }

  // Get all available services for dropdown
  const allServices = useMemo(() => {
    if (groupBy !== 'service' || !showServiceDropdown) return []
    const services = new Set<string>()
    logs.forEach(log => {
      const service = log.service || 'unknown'
      services.add(service)
    })
    return Array.from(services).sort()
  }, [logs, groupBy, showServiceDropdown])

  return (
    <div className="w-full">
      {showServiceDropdown && groupBy === 'service' && (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="service-select" className="text-sm font-medium text-slate-700">
            Filter by Service:
          </label>
          <select
            id="service-select"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Services ({allServices.length})</option>
            {allServices.map(service => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      )}
      <UPlotReact
        options={chartData.options}
        data={chartData.data}
        onCreate={(chart) => {
          chartRef.current = chart
        }}
      />
    </div>
  )
}

export default LogChart