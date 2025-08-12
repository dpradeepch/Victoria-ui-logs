import React, { useMemo } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LogEntry } from '../../types'

interface ErrorChartProps {
  logs: LogEntry[]
  height?: number
}

const ErrorChart: React.FC<ErrorChartProps> = ({ logs, height = 300 }) => {
  const errorData = useMemo(() => {
    if (!logs || logs.length === 0) return { errors: [], trend: 'stable', errorRate: 0 }

    const errorLogs = logs.filter(log => 
      log.level && ['ERROR', 'FATAL', 'CRITICAL'].includes(log.level.toUpperCase())
    )

    const errorRate = ((errorLogs.length / logs.length) * 100).toFixed(1)

    // Group errors by hour for trend analysis
    const hourlyErrors = new Map<number, number>()
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i * oneHour)
      const hourKey = Math.floor(hourStart / oneHour)
      hourlyErrors.set(hourKey, 0)
    }

    errorLogs.forEach(log => {
      const logTime = new Date(log._time).getTime()
      const hourKey = Math.floor(logTime / oneHour)
      hourlyErrors.set(hourKey, (hourlyErrors.get(hourKey) || 0) + 1)
    })

    const hourlyData = Array.from(hourlyErrors.values())
    const recent = hourlyData.slice(-3).reduce((a, b) => a + b, 0)
    const previous = hourlyData.slice(-6, -3).reduce((a, b) => a + b, 0)
    
    let trend = 'stable'
    if (recent > previous * 1.2) trend = 'up'
    else if (recent < previous * 0.8) trend = 'down'

    // Get recent error messages
    const recentErrors = errorLogs
      .slice(-5)
      .reverse()
      .map(log => ({
        time: new Date(log._time).toLocaleTimeString(),
        service: log.service || 'Unknown',
        message: log._msg || 'No message',
        level: log.level
      }))

    return {
      errors: recentErrors,
      trend,
      errorRate: parseFloat(errorRate),
      totalErrors: errorLogs.length,
      hourlyData
    }
  }, [logs])

  const getTrendIcon = () => {
    switch (errorData.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <Minus className="h-4 w-4 text-slate-400" />
    }
  }

  const getTrendColor = () => {
    switch (errorData.trend) {
      case 'up': return 'text-red-600 bg-red-50'
      case 'down': return 'text-green-600 bg-green-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <div className="text-slate-400 text-lg mb-2">No error data</div>
          <div className="text-slate-500 text-sm">Error analysis will appear here</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Error Analysis</h3>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="capitalize">{errorData.trend}</span>
        </div>
      </div>

      {/* Error Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{errorData.totalErrors}</div>
          <div className="text-sm text-red-600">Total Errors</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{errorData.errorRate}%</div>
          <div className="text-sm text-orange-600">Error Rate</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-2xl font-bold text-slate-600">
            {errorData.hourlyData.slice(-1)[0] || 0}
          </div>
          <div className="text-sm text-slate-600">Last Hour</div>
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <h4 className="text-md font-medium text-slate-900 mb-3">Recent Errors</h4>
        <div className="space-y-2">
          {errorData.errors.length > 0 ? (
            errorData.errors.map((error, index) => (
              <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        error.level === 'FATAL' ? 'bg-red-200 text-red-800' :
                        error.level === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                        'bg-orange-200 text-orange-800'
                      }`}>
                        {error.level}
                      </span>
                      <span className="text-sm text-slate-600">{error.service}</span>
                    </div>
                    <p className="text-sm text-slate-800 truncate">{error.message}</p>
                  </div>
                  <span className="text-xs text-slate-500 ml-2">{error.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-slate-500">
              <div className="text-green-600 mb-1">🎉 No recent errors!</div>
              <div className="text-sm">Your system is running smoothly</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorChart
