export interface LogEntry {
  _time: string
  _msg: string
  level?: string
  service?: string
  host?: string
  environment?: string
  version?: string
  request_id?: string
  user_agent?: string
  [key: string]: any
}

export interface LogsQueryParams {
  query: string
  start?: string
  end?: string
  limit?: number
  offset?: number
}

export interface LogsResponse {
  values: LogEntry[]
  stats?: {
    scannedRows: number
    scannedBytes: number
    executionTime: number
  }
}

export interface TimeRange {
  start: Date
  end: Date
}

export interface QueryStats {
  scannedRows: number
  scannedBytes: number
  executionTime: number
  totalRows: number
}

export interface ChartData {
  timestamps: number[]
  values: number[]
  labels?: string[]
}

export interface DashboardPanel {
  id: string
  title: string
  type: 'logs' | 'chart' | 'stats'
  query: string
  timeRange: TimeRange
  refreshInterval?: number
  height?: number
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  panels: DashboardPanel[]
  created: Date
  updated: Date
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

export interface FilterOption {
  field: string
  operator: 'eq' | 'ne' | 'contains' | 'regex' | 'gt' | 'lt'
  value: string
}

export interface QueryBuilder {
  filters: FilterOption[]
  timeRange: TimeRange
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FieldInfo {
  name: string
  type: string
  cardinality?: number
  examples?: string[]
}

export interface ServiceInfo {
  name: string
  logCount: number
  lastSeen: Date
  levels: Record<LogLevel, number>
}
