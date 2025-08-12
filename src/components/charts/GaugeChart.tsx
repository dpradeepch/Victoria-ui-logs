import React, { useMemo } from 'react'
import { LogEntry } from '../../types'

interface GaugeChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
  metric?: 'error_rate' | 'warning_rate' | 'activity_level'
}

const GaugeChart: React.FC<GaugeChartProps> = ({ 
  logs, 
  height = 200, 
  title = "Error Rate",
  metric = 'error_rate'
}) => {
  const gaugeData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { value: 0, label: '0%', color: '#10b981' }
    }

    let value = 0
    let label = '0%'
    let color = '#10b981' // green

    switch (metric) {
      case 'error_rate':
        const errorCount = logs.filter(log => log.level === 'ERROR').length
        value = (errorCount / logs.length) * 100
        label = `${value.toFixed(1)}%`
        color = value > 20 ? '#ef4444' : value > 10 ? '#f59e0b' : '#10b981'
        break
      
      case 'warning_rate':
        const warningCount = logs.filter(log => log.level === 'WARN').length
        value = (warningCount / logs.length) * 100
        label = `${value.toFixed(1)}%`
        color = value > 30 ? '#f59e0b' : value > 15 ? '#eab308' : '#10b981'
        break
      
      case 'activity_level':
        // Activity based on logs per minute
        const timeSpan = logs.length > 1 ? 
          (new Date(logs[logs.length - 1]._time).getTime() - new Date(logs[0]._time).getTime()) / (1000 * 60) : 1
        const logsPerMinute = logs.length / timeSpan
        value = Math.min((logsPerMinute / 10) * 100, 100) // Scale to 0-100
        label = `${logsPerMinute.toFixed(1)}/min`
        color = value > 80 ? '#ef4444' : value > 50 ? '#f59e0b' : '#10b981'
        break
    }

    return { value: Math.min(value, 100), label, color }
  }, [logs, metric])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for gauge</div>
        </div>
      </div>
    )
  }

  const radius = 80
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (gaugeData.value / 100) * circumference * 0.75 // 75% of circle

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-2">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
      </div>
      
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={circumference - (75 / 100) * circumference * 0.75}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
          {/* Progress circle */}
          <circle
            stroke={gaugeData.color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold" style={{ color: gaugeData.color }}>
            {gaugeData.label}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {logs.length} logs
          </div>
        </div>
      </div>
      
      {/* Scale indicators */}
      <div className="flex justify-between w-32 mt-2 text-xs text-slate-400">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  )
}

export default GaugeChart
