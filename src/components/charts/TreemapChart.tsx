import React, { useMemo } from 'react'
import { LogEntry } from '../../types'
import { getLogLevelColor } from '../../utils'

interface TreemapChartProps {
  logs: LogEntry[]
  height?: number
  title?: string
  groupBy?: 'service' | 'host' | 'level'
}

interface TreemapItem {
  name: string
  value: number
  color: string
  x: number
  y: number
  width: number
  height: number
}

const TreemapChart: React.FC<TreemapChartProps> = ({ 
  logs, 
  height = 300, 
  title = "Service Distribution",
  groupBy = 'service'
}) => {
  const treemapData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return []
    }

    // Count occurrences
    const counts = new Map<string, number>()
    logs.forEach(log => {
      const key = log[groupBy] || 'unknown'
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    // Convert to array and sort by value
    const items = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12) // Limit to top 12 for better visualization
      .map(([name, value]) => ({
        name,
        value,
        color: getLogLevelColor(name),
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }))

    // Simple treemap layout algorithm
    const layoutTreemap = (items: TreemapItem[], width: number, height: number) => {
      const total = items.reduce((sum, item) => sum + item.value, 0)
      let currentX = 0
      let currentY = 0
      let rowHeight = 0
      let remainingWidth = width

      items.forEach((item, index) => {
        const ratio = item.value / total
        const area = ratio * width * height
        
        // Calculate dimensions
        if (currentX + Math.sqrt(area) > width) {
          // Move to next row
          currentY += rowHeight
          currentX = 0
          rowHeight = 0
          remainingWidth = width
        }

        const itemWidth = Math.min(Math.sqrt(area * 2), remainingWidth)
        const itemHeight = area / itemWidth

        item.x = currentX
        item.y = currentY
        item.width = itemWidth
        item.height = itemHeight

        currentX += itemWidth
        rowHeight = Math.max(rowHeight, itemHeight)
        remainingWidth -= itemWidth
      })

      return items
    }

    return layoutTreemap(items, 400, height)
  }, [logs, groupBy, height])

  if (!logs || logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <div className="text-slate-400 text-sm">No data for treemap</div>
        </div>
      </div>
    )
  }

  const total = treemapData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <p className="text-xs text-slate-500">Total: {total.toLocaleString()} logs</p>
      </div>
      
      <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-white" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 400 300">
          {treemapData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            const fontSize = Math.max(8, Math.min(item.width / 8, item.height / 3, 14))
            
            return (
              <g key={index}>
                <rect
                  x={item.x}
                  y={item.y}
                  width={item.width}
                  height={item.height}
                  fill={item.color}
                  stroke="#fff"
                  strokeWidth="1"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title={`${item.name}: ${item.value} logs (${percentage}%)`}
                />
                {item.width > 40 && item.height > 20 && (
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 - fontSize / 2}
                    textAnchor="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name}
                  </text>
                )}
                {item.width > 60 && item.height > 35 && (
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + fontSize / 2}
                    textAnchor="middle"
                    fill="white"
                    fontSize={fontSize * 0.8}
                    className="pointer-events-none"
                  >
                    {percentage}%
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Legend for smaller items */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {treemapData.slice(0, 6).map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1)
          return (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded mr-2 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate" title={`${item.name}: ${item.value} logs`}>
                {item.name} ({percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TreemapChart
