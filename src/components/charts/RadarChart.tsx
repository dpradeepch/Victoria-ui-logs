import React, { useMemo } from 'react'
import { LogEntry } from '../../types'

interface RadarChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
}

interface RadarMetric {
  label: string
  value: number
  maxValue: number
}

const RadarChart: React.FC<RadarChartProps> = ({ 
  logs, 
  height = 250, 
  title = "Service Health Radar"
}) => {
  const radarData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return []
    }

    const totalLogs = logs.length
    const errorLogs = logs.filter(log => log.level === 'ERROR').length
    const warnLogs = logs.filter(log => log.level === 'WARN').length
    const infoLogs = logs.filter(log => log.level === 'INFO').length
    const debugLogs = logs.filter(log => log.level === 'DEBUG').length
    
    // Calculate metrics (0-100 scale)
    const errorRate = (errorLogs / totalLogs) * 100
    const warnRate = (warnLogs / totalLogs) * 100
    const activityRate = Math.min((totalLogs / 1000) * 100, 100) // Scale activity
    const infoRate = (infoLogs / totalLogs) * 100
    const debugRate = (debugLogs / totalLogs) * 100
    
    // Unique services count
    const uniqueServices = new Set(logs.map(log => log.service)).size
    const serviceDistribution = Math.min((uniqueServices / 10) * 100, 100)

    return [
      { label: 'Activity', value: activityRate, maxValue: 100 },
      { label: 'Info Rate', value: infoRate, maxValue: 100 },
      { label: 'Debug Rate', value: debugRate, maxValue: 100 },
      { label: 'Service Dist', value: serviceDistribution, maxValue: 100 },
      { label: 'Warn Rate', value: 100 - warnRate, maxValue: 100 }, // Inverted (good = low warns)
      { label: 'Error Rate', value: 100 - errorRate, maxValue: 100 }, // Inverted (good = low errors)
    ]
  }, [logs])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for radar chart</div>
        </div>
      </div>
    )
  }

  const centerX = 120
  const centerY = 120
  const radius = 80
  const numMetrics = radarData.length

  // Generate points for each metric
  const generatePoints = (values: number[]) => {
    return values.map((value, index) => {
      const angle = (index / numMetrics) * 2 * Math.PI - Math.PI / 2
      const r = (value / 100) * radius
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle)
      }
    })
  }

  const dataPoints = generatePoints(radarData.map(m => m.value))
  const pathData = `M ${dataPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <p className="text-xs text-slate-500">{logs.length} logs analyzed</p>
      </div>
      
      <div className="flex justify-center">
        <svg viewBox="0 0 240 240" className="w-60 h-60">
          {/* Background circles */}
          {[20, 40, 60, 80].map(r => (
            <circle
              key={r}
              cx={centerX}
              cy={centerY}
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          
          {/* Axis lines */}
          {radarData.map((_, index) => {
            const angle = (index / numMetrics) * 2 * Math.PI - Math.PI / 2
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            )
          })}
          
          {/* Data area */}
          <path
            d={pathData}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth="2"
            />
          ))}
          
          {/* Labels */}
          {radarData.map((metric, index) => {
            const angle = (index / numMetrics) * 2 * Math.PI - Math.PI / 2
            const labelRadius = radius + 20
            const x = centerX + labelRadius * Math.cos(angle)
            const y = centerY + labelRadius * Math.sin(angle)
            
            return (
              <text
                key={index}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#64748b"
                className="font-medium"
              >
                {metric.label}
              </text>
            )
          })}
        </svg>
      </div>
      
      {/* Metric values */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
        {radarData.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="font-medium text-slate-700">{metric.value.toFixed(0)}</div>
            <div className="text-slate-500">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RadarChart
