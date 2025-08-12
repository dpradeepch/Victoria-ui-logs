import React, { useState, useCallback } from 'react'
import { BarChart3, Table, Download, RefreshCw } from 'lucide-react'
import { useLogs } from '../hooks/useLogs'
import { generateTimeRange } from '../utils'
import QueryBuilder from '../components/QueryBuilder'
import LogChart from '../components/LogChart'
import LogTable from '../components/LogTable'
import toast from 'react-hot-toast'

const Explore: React.FC = () => {
  const [query, setQuery] = useState('*')
  const [timeRange, setTimeRange] = useState(() => generateTimeRange('1h'))
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [chartGroupBy, setChartGroupBy] = useState<'level' | 'service' | 'host'>('level')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch logs based on current query and time range
  const {
    data: logsData,
    isLoading,
    error,
    refetch
  } = useLogs({
    query,
    start: timeRange.start,
    end: timeRange.end,
    limit: 5000
  }, true)

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  const handleTimeRangeChange = useCallback((newTimeRange: { start: string; end: string }) => {
    setTimeRange(newTimeRange)
  }, [])

  const handleExecute = useCallback(() => {
    refetch()
  }, [refetch])

  const handleExport = useCallback(() => {
    if (!logsData?.values || logsData.values.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      const jsonData = JSON.stringify(logsData.values, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `victoria-logs-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Logs exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export logs')
    }
  }, [logsData])

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetch()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, refetch])

  const logs = logsData?.values || []
  const stats = logsData?.stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Explore Logs</h1>
          <p className="text-gray-600">
            Query and analyze your Victoria Logs data
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!logs.length}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>

          {/* Manual refresh */}
          <button
            onClick={handleExecute}
            disabled={isLoading}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Query Builder */}
      <QueryBuilder
        onQueryChange={handleQueryChange}
        onTimeRangeChange={handleTimeRangeChange}
        onExecute={handleExecute}
        initialQuery={query}
        isLoading={isLoading}
      />

      {/* Results Header */}
      {(logs.length > 0 || isLoading) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <div className="spinner" />
                    <span>Loading...</span>
                  </span>
                ) : (
                  <span>
                    Found {logs.length.toLocaleString()} logs
                    {stats && (
                      <span className="ml-2 text-gray-500">
                        • Scanned {stats.scannedRows.toLocaleString()} rows
                        • {(stats.scannedBytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Chart grouping selector (only show in chart mode) */}
              {viewMode === 'chart' && (
                <select
                  value={chartGroupBy}
                  onChange={(e) => setChartGroupBy(e.target.value as any)}
                  className="input text-sm"
                >
                  <option value="level">Group by Level</option>
                  <option value="service">Group by Service</option>
                  <option value="host">Group by Host</option>
                </select>
              )}

              {/* View mode toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-1 px-3 py-1 text-sm rounded ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Table className="h-4 w-4" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center space-x-1 px-3 py-1 text-sm rounded ${
                    viewMode === 'chart'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Chart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600 font-medium">Query Error</div>
          </div>
          <div className="text-red-700 text-sm mt-1">
            {error.message || 'An error occurred while executing the query'}
          </div>
        </div>
      )}

      {/* Results Display */}
      {!isLoading && !error && logs.length === 0 && query !== '*' && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">No logs found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your query or expanding the time range
            </div>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          {viewMode === 'table' ? (
            <LogTable
              logs={logs}
              height={600}
              onLogClick={(log) => {
                console.log('Log clicked:', log)
                // Could open a modal with detailed log view
              }}
            />
          ) : (
            <div className="p-6">
              <LogChart
                logs={logs}
                height={500}
                timeRange={timeRange}
                groupBy={chartGroupBy}
                chartType="line"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Explore
