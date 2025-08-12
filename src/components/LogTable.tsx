import React, { useState, useMemo, useRef, useEffect } from 'react'
import { VariableSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react'
import { LogEntry } from '../types'
import { formatTimestamp, getLogLevelClass, copyToClipboard } from '../utils'
import toast from 'react-hot-toast'

interface LogTableProps {
  logs: LogEntry[]
  height?: number
  showTimestamp?: boolean
  showLevel?: boolean
  showService?: boolean
  maxMessageLength?: number
  onLogClick?: (log: LogEntry) => void
}

interface LogRowProps {
  index: number
  style: React.CSSProperties
  data: {
    logs: LogEntry[]
    expandedRows: Set<number>
    visibleColumns: Set<string>
    maxMessageLength: number
    onToggleExpand: (index: number) => void
    onCopyLog: (log: LogEntry) => void
    onLogClick?: (log: LogEntry) => void
  }
}

const LogRow: React.FC<LogRowProps> = ({ index, style, data }) => {
  const {
    logs,
    expandedRows,
    visibleColumns,
    maxMessageLength,
    onToggleExpand,
    onCopyLog,
    onLogClick
  } = data
  
  const log = logs[index]
  const isExpanded = expandedRows.has(index)
  const isEven = index % 2 === 0

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyLog(log)
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand(index)
  }

  const handleRowClick = () => {
    if (onLogClick) {
      onLogClick(log)
    }
  }

  const truncatedMessage = log._msg.length > maxMessageLength 
    ? log._msg.substring(0, maxMessageLength) + '...'
    : log._msg

  return (
    <div
      style={style}
      className={`border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors ${
        isEven ? 'bg-white' : 'bg-slate-25'
      }`}
      onClick={handleRowClick}
    >
      <div className="flex items-start p-4 space-x-3">
        {/* Expand/Collapse button */}
        <button
          onClick={handleToggleExpand}
          className="flex-shrink-0 p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {/* Timestamp */}
        {visibleColumns.has('timestamp') && (
          <div className="flex-shrink-0 w-40 text-xs text-slate-500 text-mono">
            {formatTimestamp(log._time, 'HH:mm:ss.SSS')}
          </div>
        )}

        {/* Level */}
        {visibleColumns.has('level') && log.level && (
          <div className="flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getLogLevelClass(log.level)}`}>
              {log.level}
            </span>
          </div>
        )}

        {/* Service */}
        {visibleColumns.has('service') && log.service && (
          <div className="flex-shrink-0 w-24 text-xs text-slate-600 truncate font-medium">
            {log.service}
          </div>
        )}

        {/* Message */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-900 text-mono leading-relaxed">
            {isExpanded ? log._msg : truncatedMessage}
          </div>
          
          {/* Expanded details */}
          {isExpanded && (
            <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              {Object.entries(log)
                .filter(([key]) => !['_msg', '_time'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex text-xs">
                    <span className="text-slate-500 w-24 flex-shrink-0 font-medium">{key}:</span>
                    <span className="text-slate-700 text-mono break-all">{String(value)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center space-x-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
            title="Copy log entry"
          >
            <Copy className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  )
}

const LogTable: React.FC<LogTableProps> = ({
  logs,
  height = 400,
  showTimestamp = true,
  showLevel = true,
  showService = true,
  maxMessageLength = 200,
  onLogClick
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['timestamp', 'level', 'service'].filter(col => {
      if (col === 'timestamp') return showTimestamp
      if (col === 'level') return showLevel
      if (col === 'service') return showService
      return true
    }))
  )
  const listRef = useRef<any>(null)

  const handleToggleExpand = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
    
    // Reset cache for all items when expanding/collapsing
    if (listRef.current) {
      listRef.current.resetAfterIndex(0)
    }
  }

  // Calculate dynamic row height based on expansion state
  const getItemSize = (index: number) => {
    const baseHeight = 60
    const isExpanded = expandedRows.has(index)
    
    if (!isExpanded) {
      return baseHeight
    }

    const log = logs[index]
    const additionalFields = Object.keys(log).filter(key => !['_msg', '_time'].includes(key))
    const expandedHeight = additionalFields.length * 20 + 40 // 20px per field + padding
    
    return baseHeight + expandedHeight
  }

  const handleCopyLog = async (log: LogEntry) => {
    const logText = JSON.stringify(log, null, 2)
    const success = await copyToClipboard(logText)
    if (success) {
      toast.success('Log entry copied to clipboard')
    } else {
      toast.error('Failed to copy log entry')
    }
  }

  const toggleColumn = (column: string) => {
    const newVisible = new Set(visibleColumns)
    if (newVisible.has(column)) {
      newVisible.delete(column)
    } else {
      newVisible.add(column)
    }
    setVisibleColumns(newVisible)
  }

  const itemData = useMemo(() => ({
    logs,
    expandedRows,
    visibleColumns,
    maxMessageLength,
    onToggleExpand: handleToggleExpand,
    onCopyLog: handleCopyLog,
    onLogClick
  }), [logs, expandedRows, visibleColumns, maxMessageLength, onLogClick])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No logs found</div>
          <div className="text-gray-500 text-sm">Try adjusting your query or time range</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header with column toggles */}
      <div className="border-b border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {logs.length} log entries
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-medium">Show columns:</span>
            {[
              { key: 'timestamp', label: 'Time' },
              { key: 'level', label: 'Level' },
              { key: 'service', label: 'Service' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleColumn(key)}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  visibleColumns.has(key)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {visibleColumns.has(key) ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div style={{ height }}>
        <AutoSizer>
          {({ height: autoHeight, width }) => (
            <List
              ref={listRef}
              height={autoHeight}
              width={width}
              itemCount={logs.length}
              itemSize={getItemSize}
              itemData={itemData}
            >
              {LogRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  )
}

export default LogTable
