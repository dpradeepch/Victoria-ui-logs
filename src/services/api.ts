import axios, { AxiosResponse } from 'axios'
import { LogEntry, LogsQueryParams, LogsResponse, FieldInfo, ServiceInfo } from '../types'

const API_BASE_URL = '/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export class VictoriaLogsAPI {
  /**
   * Query logs using LogsQL
   */
  static async queryLogs(params: LogsQueryParams): Promise<LogsResponse> {
    try {
      const queryParams: any = {
        query: params.query,
        limit: params.limit || 1000,
      }

      // Only add time range if provided
      if (params.start) queryParams.start = params.start
      if (params.end) queryParams.end = params.end
      if (params.offset) queryParams.offset = params.offset

      const response: AxiosResponse = await api.get('/select/logsql/query', {
        params: queryParams,
      })

      console.log('Raw response:', response.data)
      console.log('Response type:', typeof response.data)

      let values: LogEntry[] = []

      // Handle different response formats
      if (typeof response.data === 'string') {
        // Parse JSONL format (each line is a JSON object)
        const lines = response.data.trim().split('\n')
        values = lines
          .filter((line: string) => line.trim())
          .map((line: string) => {
            try {
              return JSON.parse(line)
            } catch (e) {
              console.warn('Failed to parse log line:', line)
              return null
            }
          })
          .filter(Boolean)
      } else if (Array.isArray(response.data)) {
        // Handle array format
        values = response.data
      } else if (response.data && typeof response.data === 'object') {
        // Handle object format
        if (response.data.values) {
          values = response.data.values
        } else {
          values = [response.data]
        }
      }

      console.log('Parsed values:', values.length, values.slice(0, 2))

      return {
        values,
        stats: {
          scannedRows: values.length,
          scannedBytes: typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length,
          executionTime: 0, // Victoria Logs doesn't provide this in the response
        },
      }
    } catch (error) {
      console.error('Error querying logs:', error)
      throw new Error(`Failed to query logs: ${error}`)
    }
  }

  /**
   * Get log statistics for time series visualization
   */
  static async getLogStats(params: LogsQueryParams): Promise<any> {
    try {
      const response = await api.get('/select/logsql/stats_query', {
        params: {
          query: params.query,
          start: params.start,
          end: params.end,
        },
      })

      return response.data
    } catch (error) {
      console.error('Error getting log stats:', error)
      throw new Error(`Failed to get log stats: ${error}`)
    }
  }

  /**
   * Get available field names
   */
  static async getFieldNames(timeRange?: { start: string; end: string }): Promise<FieldInfo[]> {
    try {
      const response = await api.get('/select/logsql/field_names', {
        params: timeRange,
      })

      // Parse response and convert to FieldInfo format
      const fieldNames = Array.isArray(response.data) ? response.data : []
      return fieldNames.map((name: string) => ({
        name,
        type: 'string', // Victoria Logs doesn't provide type info
        cardinality: undefined,
        examples: [],
      }))
    } catch (error) {
      console.error('Error getting field names:', error)
      return []
    }
  }

  /**
   * Get field values for a specific field
   */
  static async getFieldValues(
    fieldName: string,
    timeRange?: { start: string; end: string },
    limit = 100
  ): Promise<string[]> {
    try {
      const response = await api.get('/select/logsql/field_values', {
        params: {
          field: fieldName,
          limit,
          ...timeRange,
        },
      })

      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error getting field values:', error)
      return []
    }
  }

  /**
   * Get service information and statistics
   */
  static async getServices(timeRange?: { start: string; end: string }): Promise<ServiceInfo[]> {
    try {
      // Query for services using LogsQL
      const query = 'service:*'
      const logsResponse = await this.queryLogs({
        query,
        start: timeRange?.start,
        end: timeRange?.end,
        limit: 10000,
      })

      // Aggregate service statistics
      const serviceStats = new Map<string, any>()

      logsResponse.values.forEach((log) => {
        const service = log.service || 'unknown'
        const level = (log.level || 'INFO').toUpperCase()

        if (!serviceStats.has(service)) {
          serviceStats.set(service, {
            name: service,
            logCount: 0,
            lastSeen: new Date(log._time),
            levels: {
              DEBUG: 0,
              INFO: 0,
              WARN: 0,
              ERROR: 0,
              FATAL: 0,
            },
          })
        }

        const stats = serviceStats.get(service)
        stats.logCount++
        stats.levels[level] = (stats.levels[level] || 0) + 1

        const logTime = new Date(log._time)
        if (logTime > stats.lastSeen) {
          stats.lastSeen = logTime
        }
      })

      return Array.from(serviceStats.values())
    } catch (error) {
      console.error('Error getting services:', error)
      return []
    }
  }

  /**
   * Test connection to Victoria Logs
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await api.get('/')
      return response.status === 200
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  /**
   * Get Victoria Logs metrics
   */
  static async getMetrics(): Promise<any> {
    try {
      const response = await api.get('/metrics')
      return response.data
    } catch (error) {
      console.error('Error getting metrics:', error)
      return null
    }
  }

  /**
   * Get Victoria Logs flags/configuration
   */
  static async getFlags(): Promise<any> {
    try {
      const response = await api.get('/flags')
      return response.data
    } catch (error) {
      console.error('Error getting flags:', error)
      return null
    }
  }
}

export default VictoriaLogsAPI
