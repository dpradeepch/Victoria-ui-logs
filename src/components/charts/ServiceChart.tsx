import React, { useMemo } from 'react'
import { LogEntry } from '../../types'

interface ServiceChartProps {
  logs: LogEntry[]
  height?: number
}

const ServiceChart: React.FC<ServiceChartProps> = ({ logs, height = 300 }) => {
  const serviceData = useMemo(() => {
    if (!logs || logs.length === 0) return []

    const serviceCounts = logs.reduce((acc, log) => {
      const service = log.service || 'Unknown'
      acc[service] = (acc[service] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 services
  }, [logs])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-lg mb-2">No service data</div>
          <div className="text-slate-500 text-sm">Service activity will appear here</div>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...serviceData.map(d => d.count))

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Services</h3>
      <div className="space-y-3">
        {serviceData.map(({ service, count }, index) => (
          <div key={service} className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {service}
                </span>
                <span className="text-sm text-slate-500 ml-2">
                  {count.toLocaleString()} logs
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServiceChart
