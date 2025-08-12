import React, { useMemo } from 'react'
import { LogEntry } from '../../types'
import { getLogLevelColor } from '../../utils'

interface DonutChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
  groupBy?: 'level' | 'service' | 'host'
  innerRadius?: number
}

const DonutChart: React.FC<DonutChartProps> = ({ 
  logs, 
  height = 250, 
  title = "Distribution",
  groupBy = 'host',
  innerRadius = 0.6
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

    // Sort by count and take top 6
    const sortedEntries = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    const labels = sortedEntries.map(([key]) => key)
    const data = sortedEntries.map(([, count]) => count)
    const colors = labels.map(label => getLogLevelColor(label))

    return { data, labels, colors }
  }, [logs, groupBy])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for donut chart</div>
        </div>
      </div>
    )
  }

  const total = chartData.data.reduce((sum, val) => sum + val, 0)
  const outerRadius = 90
  const innerRadiusPixels = outerRadius * innerRadius

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <p className="text-xs text-slate-500">Total: {total.toLocaleString()} logs</p>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg viewBox="0 0 200 200" className="w-48 h-48 transform -rotate-90">
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
              
              // Outer arc
              const x1Outer = 100 + outerRadius * Math.cos(startAngleRad)
              const y1Outer = 100 + outerRadius * Math.sin(startAngleRad)
              const x2Outer = 100 + outerRadius * Math.cos(endAngleRad)
              const y2Outer = 100 + outerRadius * Math.sin(endAngleRad)
              
              // Inner arc
              const x1Inner = 100 + innerRadiusPixels * Math.cos(startAngleRad)
              const y1Inner = 100 + innerRadiusPixels * Math.sin(startAngleRad)
              const x2Inner = 100 + innerRadiusPixels * Math.cos(endAngleRad)
              const y2Inner = 100 + innerRadiusPixels * Math.sin(endAngleRad)
              
              const pathData = [
                `M ${x1Outer} ${y1Outer}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
                `L ${x2Inner} ${y2Inner}`,
                `A ${innerRadiusPixels} ${innerRadiusPixels} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
                'Z'
              ].join(' ')
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={chartData.colors[index]}
                  stroke="#fff"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title={`${chartData.labels[index]}: ${value} logs (${percentage.toFixed(1)}%)`}
                />
              )
            })}
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-slate-700">
              {chartData.data.length}
            </div>
            <div className="text-xs text-slate-500 text-center">
              {groupBy}s
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-4">
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

export default DonutChart
