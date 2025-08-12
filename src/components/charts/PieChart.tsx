import React, { useMemo } from 'react'
import uPlot from 'uplot'
import UPlotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'
import { LogEntry } from '../../types'
import { getLogLevelColor } from '../../utils'

interface PieChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
  groupBy?: 'level' | 'service' | 'host'
}

const PieChart: React.FC<PieChartProps> = ({ 
  logs, 
  height = 300, 
  title = "Distribution",
  groupBy = 'level'
}) => {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { data: [], labels: [], colors: [] }
    }

    // Count occurrences
    const counts = new Map<string, number>()
    logs.forEach(log => {
      const key = log[groupBy] || 'unknown'
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    // Sort by count (descending) and take top 8
    const sortedEntries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const labels = sortedEntries.map(([key]) => key)
    const data = sortedEntries.map(([, count]) => count)
    const colors = labels.map(label => getLogLevelColor(label))

    return { data, labels, colors }
  }, [logs, groupBy])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for pie chart</div>
        </div>
      </div>
    )
  }

  const total = chartData.data.reduce((sum, val) => sum + val, 0)

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <p className="text-xs text-slate-500">Total: {total.toLocaleString()} logs</p>
      </div>
      
      {/* Manual pie chart using CSS */}
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-4">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {chartData.data.map((value, index) => {
              const percentage = (value / total) * 100
              const cumulativePercentage = chartData.data
                .slice(0, index)
                .reduce((sum, val) => sum + val, 0) / total * 100
              
              const startAngle = (cumulativePercentage / 100) * 360
              const endAngle = ((cumulativePercentage + percentage) / 100) * 360
              
              const startAngleRad = (startAngle * Math.PI) / 180
              const endAngleRad = (endAngle * Math.PI) / 180
              
              const largeArcFlag = percentage > 50 ? 1 : 0
              const x1 = 100 + 80 * Math.cos(startAngleRad)
              const y1 = 100 + 80 * Math.sin(startAngleRad)
              const x2 = 100 + 80 * Math.cos(endAngleRad)
              const y2 = 100 + 80 * Math.sin(endAngleRad)
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ')
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={chartData.colors[index]}
                  stroke="#fff"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity"
                />
              )
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {chartData.labels.map((label, index) => {
            const percentage = ((chartData.data[index] / total) * 100).toFixed(1)
            return (
              <div key={index} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded mr-2 flex-shrink-0"
                  style={{ backgroundColor: chartData.colors[index] }}
                />
                <span className="truncate" title={label}>
                  {label} ({percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PieChart
