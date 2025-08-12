import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { LogLevel, LogEntry } from '../types'

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | Date, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp
    return format(date, formatStr)
  } catch (error) {
    console.warn('Invalid timestamp:', timestamp)
    return 'Invalid Date'
  }
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    console.warn('Invalid timestamp:', timestamp)
    return 'Unknown'
  }
}

/**
 * Get CSS class for log level
 */
export function getLogLevelClass(level?: string): string {
  if (!level) return 'log-level-info'
  
  const normalizedLevel = level.toUpperCase()
  switch (normalizedLevel) {
    case 'DEBUG':
      return 'log-level-debug'
    case 'INFO':
      return 'log-level-info'
    case 'WARN':
    case 'WARNING':
      return 'log-level-warn'
    case 'ERROR':
      return 'log-level-error'
    case 'FATAL':
    case 'CRITICAL':
      return 'log-level-fatal'
    default:
      return 'log-level-info'
  }
}

/**
 * Get color for log level
 */
export function getLogLevelColor(level?: string): string {
  if (!level) return '#3b82f6' // blue
  
  const normalizedLevel = level.toUpperCase()
  switch (normalizedLevel) {
    case 'DEBUG':
      return '#6b7280' // gray
    case 'INFO':
      return '#3b82f6' // blue
    case 'WARN':
    case 'WARNING':
      return '#f59e0b' // yellow
    case 'ERROR':
      return '#ef4444' // red
    case 'FATAL':
    case 'CRITICAL':
      return '#dc2626' // dark red
    default:
      return '#3b82f6' // blue
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`
  } else {
    return `${(ms / 3600000).toFixed(1)}h`
  }
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Highlight search terms in text
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) return text
  
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

/**
 * Parse LogsQL query to extract filters
 */
export function parseLogsQLQuery(query: string): { filters: string[], timeRange?: string } {
  const filters: string[] = []
  let timeRange: string | undefined

  // Simple parsing - can be enhanced
  const parts = query.split(' AND ').map(part => part.trim())
  
  parts.forEach(part => {
    if (part.includes('_time:')) {
      timeRange = part
    } else {
      filters.push(part)
    }
  })

  return { filters, timeRange }
}

/**
 * Build LogsQL query from filters
 */
export function buildLogsQLQuery(filters: string[], timeRange?: string): string {
  const parts = [...filters]
  if (timeRange) {
    parts.push(timeRange)
  }
  return parts.join(' AND ')
}

/**
 * Validate LogsQL query syntax (basic validation)
 */
export function validateLogsQLQuery(query: string): { isValid: boolean, error?: string } {
  if (!query.trim()) {
    return { isValid: false, error: 'Query cannot be empty' }
  }

  // Basic syntax checks
  const openParens = (query.match(/\(/g) || []).length
  const closeParens = (query.match(/\)/g) || []).length
  
  if (openParens !== closeParens) {
    return { isValid: false, error: 'Mismatched parentheses' }
  }

  const openQuotes = (query.match(/"/g) || []).length
  if (openQuotes % 2 !== 0) {
    return { isValid: false, error: 'Mismatched quotes' }
  }

  return { isValid: true }
}

/**
 * Generate time range for queries
 */
export function generateTimeRange(period: string): { start: string, end: string } {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case '5m':
      start.setMinutes(start.getMinutes() - 5)
      break
    case '15m':
      start.setMinutes(start.getMinutes() - 15)
      break
    case '30m':
      start.setMinutes(start.getMinutes() - 30)
      break
    case '1h':
      start.setHours(start.getHours() - 1)
      break
    case '3h':
      start.setHours(start.getHours() - 3)
      break
    case '6h':
      start.setHours(start.getHours() - 6)
      break
    case '12h':
      start.setHours(start.getHours() - 12)
      break
    case '24h':
      start.setDate(start.getDate() - 1)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    default:
      start.setHours(start.getHours() - 1) // Default to 1 hour
  }

  // Victoria Logs expects RFC3339 format, but let's try without time range first
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}
