# Victoria Logs UI

A modern, feature-rich web interface for Victoria Logs with real-time visualization, advanced querying, and comprehensive dashboard functionality.

![Victoria Logs UI](https://img.shields.io/badge/Victoria%20Logs-UI-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.3-blue)
![uPlot](https://img.shields.io/badge/uPlot-1.6.24-green)

## Features

### 🚀 Core Features
- **Real-time Log Visualization** - Interactive charts powered by uPlot
- **Advanced Query Builder** - Visual LogsQL query construction
- **Live Dashboard** - Service metrics and log statistics
- **Interactive Log Table** - Virtualized table with expandable rows
- **Export Functionality** - Export logs in JSON format
- **Responsive Design** - Works on desktop, tablet, and mobile

### 📊 Visualization
- **Time Series Charts** - Log volume over time
- **Service Activity** - Logs grouped by service, level, or host
- **Log Level Distribution** - Visual breakdown of log levels
- **Real-time Updates** - Auto-refresh capabilities

### 🔍 Query Interface
- **LogsQL Support** - Full LogsQL query language support
- **Query Builder** - Visual filter construction
- **Field Autocomplete** - Dynamic field and value suggestions
- **Query Validation** - Real-time syntax checking
- **Time Range Selection** - Flexible time range controls

### 📈 Dashboard
- **Service Overview** - Active services and their status
- **Error Monitoring** - Recent errors and alerts
- **Performance Metrics** - Log volume and processing stats
- **Quick Stats** - Total logs, error rates, and more

## Prerequisites

- **Victoria Logs** - Running instance (v1.27.0+)
- **Node.js** - Version 16 or higher
- **npm** - Package manager

## Quick Start

### 1. Start Victoria Logs

Using Docker (recommended):
```bash
docker run --rm -d --name victoria-logs \
  -p 9428:9428 \
  -v $(pwd)/victoria-logs-data:/victoria-logs-data \
  docker.io/victoriametrics/victoria-logs:v1.27.0 \
  -storageDataPath=victoria-logs-data
```

### 2. Generate Sample Data

```bash
python3 generate_sample_logs.py
```

This will populate Victoria Logs with realistic sample data including:
- Multiple services (web-server, api-gateway, user-service, etc.)
- Various log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- Realistic log messages and metadata
- Time-distributed data over the last 24 hours

### 3. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── LogChart.tsx    # uPlot-based log visualization
│   ├── LogTable.tsx    # Virtualized log table
│   └── QueryBuilder.tsx # LogsQL query interface
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview dashboard
│   ├── Explore.tsx     # Log exploration interface
│   └── Settings.tsx    # Application settings
├── hooks/              # Custom React hooks
│   └── useLogs.ts      # Data fetching hooks
├── services/           # API integration
│   └── api.ts          # Victoria Logs API client
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared types
├── utils/              # Utility functions
│   └── index.ts        # Helper functions
└── main.tsx           # Application entry point
```

## API Integration

The application integrates with Victoria Logs through a comprehensive API client that supports:

### Endpoints Used
- `/select/logsql/query` - Log querying with LogsQL
- `/select/logsql/stats_query` - Statistical queries
- `/select/logsql/field_names` - Available field discovery
- `/select/logsql/field_values` - Field value enumeration
- `/insert/jsonline` - Log ingestion (for sample data)

### Query Examples

**Basic Query:**
```
*
```

**Filter by Service:**
```
service="web-server"
```

**Filter by Log Level:**
```
level="ERROR"
```

**Complex Query:**
```
service="api-gateway" AND level="ERROR" AND _time:[now-1h, now]
```

**Regex Search:**
```
_msg=~"failed.*connection"
```

## Configuration

### Environment Variables
- `VITE_API_BASE_URL` - Victoria Logs API base URL (default: `/api`)

### Vite Proxy Configuration
The development server proxies API requests to Victoria Logs:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:9428',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

## Building for Production

```bash
npm run build
```

The built application will be in the `dist/` directory.

## Technologies Used

### Frontend Framework
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server

### Visualization
- **uPlot** - High-performance charting library
- **React Window** - Virtualized lists for performance

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### State Management
- **TanStack Query** - Server state management
- **React Router** - Client-side routing

## Performance Optimizations

### Frontend
- **Virtualized Tables** - Handle thousands of log entries
- **Query Debouncing** - Reduce API calls during typing
- **Memoized Components** - Prevent unnecessary re-renders
- **Code Splitting** - Lazy load components

### Data Handling
- **Streaming Responses** - Handle large datasets
- **Pagination** - Limit data transfer
- **Caching** - Intelligent query result caching

## Troubleshooting

### Common Issues

**Connection Failed:**
- Ensure Victoria Logs is running on port 9428
- Check Docker container status: `docker ps`
- Verify logs: `docker logs victoria-logs`

**No Data Displayed:**
- Run the sample data generator
- Check time range settings
- Verify LogsQL query syntax

**Performance Issues:**
- Reduce query result limit
- Use more specific time ranges
- Enable query result caching

### Debug Mode
Enable debug logging by opening browser console and running:
```javascript
localStorage.setItem('debug', 'victoria-logs-ui:*')
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Victoria Metrics Team** - For the excellent Victoria Logs system
- **uPlot** - For the high-performance charting library
- **Grafana Labs** - For inspiration from their Victoria Logs plugin
