import React, { useMemo } from 'react'
import { LogEntry } from '../../types'

interface HeatmapChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ 
  logs, 
  height = 300, 
  title = "Hourly Activity Heatmap"
}) => {
  const heatmapData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { data: [], maxValue: 0 }
    }

    // Create 24x7 grid (hours x days)
    const grid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    logs.forEach(log => {
      const date = new Date(log._time)
      const hour = date.getHours()
      const day = date.getDay()
      grid[day][hour]++
    })

    const maxValue = Math.max(...grid.flat())
    
    return { data: grid, maxValue, dayNames }
  }, [logs])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for heatmap</div>
        </div>
      </div>
    )
  }

  const getHeatmapColor = (value: number, maxValue: number) => {
    if (value === 0) return 'bg-slate-100'
    const intensity = value / maxValue
    if (intensity < 0.2) return 'bg-blue-200'
    if (intensity < 0.4) return 'bg-blue-300'
    if (intensity < 0.6) return 'bg-blue-400'
    if (intensity < 0.8) return 'bg-blue-500'
    return 'bg-blue-600'
  }

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <p className="text-xs text-slate-500">Peak: {heatmapData.maxValue} logs/hour</p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-12"></div>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-6 text-xs text-center text-slate-500">
                {i % 4 === 0 ? i : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {heatmapData.data.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex items-center mb-1">
              <div className="w-12 text-xs text-slate-600 pr-2 text-right">
                {heatmapData.dayNames[dayIndex]}
              </div>
              {dayData.map((value, hourIndex) => (
                <div
                  key={hourIndex}
                  className={`w-6 h-6 mr-px ${getHeatmapColor(value, heatmapData.maxValue)} rounded-sm cursor-pointer transition-all hover:scale-110`}
                  title={`${heatmapData.dayNames[dayIndex]} ${hourIndex}:00 - ${value} logs`}
                />
              ))}
            </div>
          ))}
          
          {/* Legend */}
          <div className="flex items-center justify-center mt-4 text-xs text-slate-500">
            <span className="mr-2">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            </div>
            <span className="ml-2">More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeatmapChart
