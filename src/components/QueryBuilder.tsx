import React, { useState, useEffect } from 'react'
import { Play, Plus, Trash2, Clock, RefreshCw } from 'lucide-react'
import { useFieldNames, useFieldValues } from '../hooks/useLogs'
import { generateTimeRange, validateLogsQLQuery } from '../utils'

interface QueryBuilderProps {
  onQueryChange: (query: string) => void
  onTimeRangeChange: (timeRange: { start: string; end: string }) => void
  onExecute: () => void
  initialQuery?: string
  isLoading?: boolean
}

interface Filter {
  id: string
  field: string
  operator: string
  value: string
}

const OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '~', label: 'contains' },
  { value: '!~', label: 'not contains' },
  { value: '=~', label: 'regex match' },
  { value: '!~', label: 'regex not match' },
]

const TIME_RANGES = [
  { value: '5m', label: 'Last 5 minutes' },
  { value: '15m', label: 'Last 15 minutes' },
  { value: '30m', label: 'Last 30 minutes' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '3h', label: 'Last 3 hours' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
]

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onQueryChange,
  onTimeRangeChange,
  onExecute,
  initialQuery = '',
  isLoading = false
}) => {
  const [mode, setMode] = useState<'builder' | 'raw'>('builder')
  const [rawQuery, setRawQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<Filter[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')
  const [queryError, setQueryError] = useState<string | null>(null)

  const { data: fieldNames = [] } = useFieldNames()

  // Generate initial filter if none exist
  useEffect(() => {
    if (filters.length === 0) {
      addFilter()
    }
  }, [])

  // Update query when filters change
  useEffect(() => {
    if (mode === 'builder') {
      const query = buildQueryFromFilters()
      setRawQuery(query)
      onQueryChange(query)
    }
  }, [filters, mode])

  // Update time range when selection changes
  useEffect(() => {
    const timeRange = generateTimeRange(selectedTimeRange)
    onTimeRangeChange(timeRange)
  }, [selectedTimeRange])

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: fieldNames[0]?.name || 'service',
      operator: '=',
      value: ''
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id))
  }

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const buildQueryFromFilters = (): string => {
    const validFilters = filters.filter(f => f.field && f.value)
    if (validFilters.length === 0) return '*'

    const filterStrings = validFilters.map(f => {
      const needsQuotes = f.value.includes(' ') || f.value.includes(':')
      const value = needsQuotes ? `"${f.value}"` : f.value
      return `${f.field}${f.operator}${value}`
    })

    return filterStrings.join(' AND ')
  }

  const handleRawQueryChange = (value: string) => {
    setRawQuery(value)
    onQueryChange(value)
    
    // Validate query
    const validation = validateLogsQLQuery(value)
    setQueryError(validation.isValid ? null : validation.error || null)
  }

  const handleExecute = () => {
    if (queryError) return
    onExecute()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleExecute()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('builder')}
            className={`px-3 py-1 text-sm rounded ${
              mode === 'builder'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Builder
          </button>
          <button
            onClick={() => setMode('raw')}
            className={`px-3 py-1 text-sm rounded ${
              mode === 'raw'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Raw Query
          </button>
        </div>

        {/* Time range selector */}
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="input text-sm"
          >
            {TIME_RANGES.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Query builder mode */}
      {mode === 'builder' && (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={filter.id} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-sm text-gray-500 font-medium">AND</span>
              )}
              
              {/* Field selector */}
              <select
                value={filter.field}
                onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                className="input text-sm min-w-32"
              >
                {fieldNames.map(field => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>

              {/* Operator selector */}
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, { operator: e.target.value })}
                className="input text-sm min-w-24"
              >
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {/* Value input */}
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                placeholder="Enter value..."
                className="input text-sm flex-1"
                onKeyPress={handleKeyPress}
              />

              {/* Remove filter button */}
              <button
                onClick={() => removeFilter(filter.id)}
                className="p-2 text-gray-400 hover:text-red-500"
                disabled={filters.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add filter button */}
          <button
            onClick={addFilter}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add filter</span>
          </button>
        </div>
      )}

      {/* Raw query mode */}
      {mode === 'raw' && (
        <div className="space-y-2">
          <textarea
            value={rawQuery}
            onChange={(e) => handleRawQueryChange(e.target.value)}
            placeholder="Enter LogsQL query..."
            className={`input text-sm font-mono resize-none h-24 w-full ${
              queryError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            onKeyPress={handleKeyPress}
          />
          {queryError && (
            <div className="text-sm text-red-600">{queryError}</div>
          )}
        </div>
      )}

      {/* Execute button */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Press Cmd+Enter to execute
        </div>
        <button
          onClick={handleExecute}
          disabled={isLoading || !!queryError}
          className="btn btn-primary flex items-center space-x-2"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>Execute Query</span>
        </button>
      </div>
    </div>
  )
}

export default QueryBuilder
