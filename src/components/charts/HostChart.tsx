import React, { useMemo } from 'react'
import { Server, Activity } from 'lucide-react'
import { LogEntry } from '../../types'

interface HostChartProps {
  logs: LogEntry[]
  height?: number
}

const HostChart: React.FC<HostChartProps> = ({ logs, height = 300 }) => {
  const hostData = useMemo(() => {
    if (!logs || logs.length === 0) return []

    const hostCounts = logs.reduce((acc, log) => {
      const host = log.host || 'Unknown'
      acc[host] = (acc[host] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate host activity over time for simple status indication
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    
    const recentActivity = logs.filter(log => 
      new Date(log._time).getTime() > fiveMinutesAgo
    ).reduce((acc, log) => {
      const host = log.host || 'Unknown'
      acc[host] = (acc[host] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(hostCounts)
      .map(([host, count]) => ({
        host,
        count,
        recentActivity: recentActivity[host] || 0,
        status: recentActivity[host] > 0 ? 'active' : 'inactive'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Top 8 hosts
  }, [logs])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <Server className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <div className="text-slate-400 text-lg mb-2">No host data</div>
          <div className="text-slate-500 text-sm">Host distribution will appear here</div>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...hostData.map(d => d.count))

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Host Distribution</h3>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Active (5m)</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {hostData.map(({ host, count, recentActivity, status }, index) => (
          <div key={host} className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              status === 'active' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {status === 'active' ? (
                <Activity className="h-4 w-4" />
              ) : (
                <Server className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {host}
                  </span>
                  {status === 'active' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">
                        {recentActivity}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-500 ml-2">
                  {count.toLocaleString()}
                </span>
              </div>
              
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    status === 'active' ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              
              {status === 'active' && (
                <div className="text-xs text-green-600 mt-1">
                  {recentActivity} logs in last 5 minutes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hostData.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Server className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-400">No host information available</div>
          <div className="text-sm text-slate-500 mt-1">Logs may not contain host data</div>
        </div>
      )}
    </div>
  )
}

export default HostChart
