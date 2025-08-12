import { useQuery, useQueryClient } from '@tanstack/react-query'
import { VictoriaLogsAPI } from '../services/api'
import { LogsQueryParams, LogsResponse, FieldInfo, ServiceInfo } from '../types'

/**
 * Hook for querying logs
 */
export function useLogs(params: LogsQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => VictoriaLogsAPI.queryLogs(params),
    enabled: enabled && !!params.query,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for getting log statistics
 */
export function useLogStats(params: LogsQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['logStats', params],
    queryFn: () => VictoriaLogsAPI.getLogStats(params),
    enabled: enabled && !!params.query,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for getting field names
 */
export function useFieldNames(timeRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['fieldNames', timeRange],
    queryFn: () => VictoriaLogsAPI.getFieldNames(timeRange),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for getting field values
 */
export function useFieldValues(
  fieldName: string,
  timeRange?: { start: string; end: string },
  limit = 100,
  enabled = true
) {
  return useQuery({
    queryKey: ['fieldValues', fieldName, timeRange, limit],
    queryFn: () => VictoriaLogsAPI.getFieldValues(fieldName, timeRange, limit),
    enabled: enabled && !!fieldName,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for getting services
 */
export function useServices(timeRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['services', timeRange],
    queryFn: () => VictoriaLogsAPI.getServices(timeRange),
    staleTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for testing connection
 */
export function useConnectionTest() {
  return useQuery({
    queryKey: ['connectionTest'],
    queryFn: () => VictoriaLogsAPI.testConnection(),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for real-time logs with auto-refresh
 */
export function useRealtimeLogs(
  params: LogsQueryParams,
  refreshInterval = 5000,
  enabled = true
) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['realtimeLogs', params],
    queryFn: () => VictoriaLogsAPI.queryLogs(params),
    enabled: enabled && !!params.query,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider stale for real-time data
    onSuccess: (data) => {
      // Update the main logs cache with new data
      queryClient.setQueryData(['logs', params], data)
    },
  })
}

/**
 * Hook for invalidating and refetching queries
 */
export function useRefreshQueries() {
  const queryClient = useQueryClient()

  const refreshLogs = (params?: LogsQueryParams) => {
    if (params) {
      queryClient.invalidateQueries({ queryKey: ['logs', params] })
    } else {
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    }
  }

  const refreshAll = () => {
    queryClient.invalidateQueries()
  }

  const refreshFieldNames = () => {
    queryClient.invalidateQueries({ queryKey: ['fieldNames'] })
  }

  const refreshServices = () => {
    queryClient.invalidateQueries({ queryKey: ['services'] })
  }

  return {
    refreshLogs,
    refreshAll,
    refreshFieldNames,
    refreshServices,
  }
}
