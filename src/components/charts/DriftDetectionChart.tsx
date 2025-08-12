import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Download, FileText, Code } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DriftData {
  service: string;
  severity: string;
  currentPeriod: number;
  baselinePeriod: number;
  delta: number;
  percentageChange: number;
  timestamp: string;
  alertLevel: 'normal' | 'warning' | 'critical';
}

interface DriftDetectionChartProps {
  data?: DriftData[];
  warningThreshold?: number;
  criticalThreshold?: number;
  timeRange?: string;
}

const DriftDetectionChart: React.FC<DriftDetectionChartProps> = ({
  data = [],
  warningThreshold = 20,
  criticalThreshold = 50,
  timeRange = 'Last 24 hours'
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [alertFilter, setAlertFilter] = useState<'all' | 'warning' | 'critical'>('all');
  const [showTrends, setShowTrends] = useState(true);

  const processedData = React.useMemo(() => {
    if (!data.length) return [];
    
    let filtered = [...data];
    
    // Filter by alert level
    if (alertFilter !== 'all') {
      filtered = filtered.filter(d => d.alertLevel === alertFilter);
    }
    
    // Sort by delta (most significant changes first)
    filtered.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    
    return filtered;
  }, [data, alertFilter]);

  const alertCounts = React.useMemo(() => {
    const counts = { normal: 0, warning: 0, critical: 0 };
    data.forEach(d => {
      counts[d.alertLevel]++;
    });
    return counts;
  }, [data]);

  const timeSeriesData = React.useMemo(() => {
    if (!data.length) return null;
    
    // Group by timestamp and calculate average delta
    const timeGroups = data.reduce((acc, item) => {
      if (!acc[item.timestamp]) {
        acc[item.timestamp] = { total: 0, count: 0, alerts: 0 };
      }
      acc[item.timestamp].total += Math.abs(item.delta);
      acc[item.timestamp].count += 1;
      if (item.alertLevel !== 'normal') {
        acc[item.timestamp].alerts += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number; alerts: number }>);

    const sortedTimes = Object.keys(timeGroups).sort();
    
    return {
      labels: sortedTimes,
      datasets: [
        {
          label: 'Average Delta',
          data: sortedTimes.map(t => timeGroups[t].total / timeGroups[t].count),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Alert Count',
          data: sortedTimes.map(t => timeGroups[t].alerts),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 2,
          yAxisID: 'y1',
        }
      ]
    };
  }, [data]);

  const driftData = {
    labels: processedData.map(d => `${d.service} (${d.severity})`),
    datasets: [
      {
        label: 'Delta from Baseline',
        data: processedData.map(d => d.delta),
        backgroundColor: processedData.map(d => {
          switch (d.alertLevel) {
            case 'critical': return 'rgba(220, 38, 38, 0.8)';
            case 'warning': return 'rgba(245, 158, 11, 0.8)';
            default: return 'rgba(34, 197, 94, 0.8)';
          }
        }),
        borderColor: processedData.map(d => {
          switch (d.alertLevel) {
            case 'critical': return 'rgba(220, 38, 38, 1)';
            case 'warning': return 'rgba(245, 158, 11, 1)';
            default: return 'rgba(34, 197, 94, 1)';
          }
        }),
        borderWidth: 2,
      },
    ],
  };

  const timeSeriesOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Drift Trend Analysis - ${timeRange}`,
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const timestamp = timeSeriesData?.labels[dataIndex];
            if (timestamp) {
              const timeData = data.filter(d => d.timestamp === timestamp);
              const avgDelta = timeData.reduce((sum, d) => sum + Math.abs(d.delta), 0) / timeData.length;
              const alertCount = timeData.filter(d => d.alertLevel !== 'normal').length;
              return [
                `Average Delta: ${avgDelta.toFixed(2)}`,
                `Alerts: ${alertCount}`,
                `Total Services: ${timeData.length}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Average Delta',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Alert Count',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  const driftOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Drift Detection by Service & Severity',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const item = processedData[dataIndex];
            if (item) {
              return [
                `Baseline: ${item.baselinePeriod.toFixed(2)}`,
                `Current: ${item.currentPeriod.toFixed(2)}`,
                `Change: ${item.percentageChange > 0 ? '+' : ''}${item.percentageChange.toFixed(1)}%`,
                `Alert Level: ${item.alertLevel.toUpperCase()}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Delta (Current - Baseline)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Service & Severity',
        },
      },
    },
  };

  const generateAlertRules = () => {
    const rules = [
      `# Victoria Logs Drift Detection Alert Rules`,
      `# Warning threshold: ${warningThreshold}%`,
      `# Critical threshold: ${criticalThreshold}%`,
      ``,
      `groups:`,
      `  - name: drift_detection`,
      `    rules:`,
      `      - alert: HighDriftWarning`,
      `        expr: abs(delta_percentage) > ${warningThreshold}`,
      `        for: 5m`,
      `        labels:`,
      `          severity: warning`,
      `        annotations:`,
      `          summary: "High drift detected in {{ $labels.service }} ({{ $labels.severity }})"`,
      `          description: "Drift: {{ $value }}% from baseline"`,
      ``,
      `      - alert: CriticalDriftAlert`,
      `        expr: abs(delta_percentage) > ${criticalThreshold}`,
      `        for: 2m`,
      `        labels:`,
      `          severity: critical`,
      `        annotations:`,
      `          summary: "Critical drift detected in {{ $labels.service }} ({{ $labels.severity }})"`,
      `          description: "Drift: {{ $value }}% from baseline"`
    ].join('\n');
    
    return rules;
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Service', 'Severity', 'Current Period', 'Baseline Period', 'Delta', 'Percentage Change', 'Alert Level', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => [
        row.service,
        row.severity,
        row.currentPeriod,
        row.baselinePeriod,
        row.delta,
        row.percentageChange,
        row.alertLevel,
        row.timestamp
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drift-detection-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonData = {
      warningThreshold,
      criticalThreshold,
      timeRange,
      exportDate: new Date().toISOString(),
      alertCounts,
      data: processedData
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drift-detection-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPython = () => {
    const pythonCode = `# Victoria Logs Drift Detection Data
# Generated on: ${new Date().toISOString()}
# Warning threshold: ${warningThreshold}%
# Critical threshold: ${criticalThreshold}%

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the drift detection data
data = ${JSON.stringify(processedData, null, 2)}

# Convert to pandas DataFrame
df = pd.DataFrame(data)

# Display summary statistics
print("Drift Detection Summary:")
print(f"Total services: {df.shape[0]}")
print(f"Warning alerts: {df[df['alertLevel'] == 'warning'].shape[0]}")
print(f"Critical alerts: {df[df['alertLevel'] == 'critical'].shape[0]}")
print(f"Normal: {df[df['alertLevel'] == 'normal'].shape[0]}")

# Create visualization
plt.figure(figsize=(15, 10))

# Plot 1: Delta by service and severity
plt.subplot(2, 2, 1)
df_pivot = df.pivot_table(values='delta', index='service', columns='severity', aggfunc='mean')
df_pivot.plot(kind='bar', ax=plt.gca())
plt.title('Average Delta by Service and Severity')
plt.xticks(rotation=45)

# Plot 2: Alert levels distribution
plt.subplot(2, 2, 2)
alert_counts = df['alertLevel'].value_counts()
plt.pie(alert_counts.values, labels=alert_counts.index, autopct='%1.1f%%')
plt.title('Alert Level Distribution')

# Plot 3: Time series of alerts
plt.subplot(2, 2, 3)
time_series = df.groupby('timestamp')['alertLevel'].apply(lambda x: (x != 'normal').sum())
time_series.plot(kind='line', marker='o')
plt.title('Alert Count Over Time')
plt.ylabel('Number of Alerts')

# Plot 4: Delta distribution
plt.subplot(2, 2, 4)
plt.hist(df['delta'], bins=20, alpha=0.7, edgecolor='black')
plt.title('Delta Distribution')
plt.xlabel('Delta Value')
plt.ylabel('Frequency')

plt.tight_layout()
plt.show()

# Export to CSV for further analysis
df.to_csv('drift_detection_export.csv', index=False)
print("Data exported to 'drift_detection_export.csv'")

# Generate alert summary
critical_alerts = df[df['alertLevel'] == 'critical']
if not critical_alerts.empty:
    print("\\nCritical Alerts:")
    print(critical_alerts[['service', 'severity', 'delta', 'percentageChange']].to_string(index=False))`;
    
    const blob = new Blob([pythonCode], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drift-detection-${new Date().toISOString().split('T')[0]}.py`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToGrafana = () => {
    const grafanaData = {
      targets: [
        {
          expr: `# Drift Detection Query
SELECT service, severity, 
       COUNT(*) as current_count,
       LAG(COUNT(*)) OVER (PARTITION BY service, severity ORDER BY time) as baseline_count,
       (COUNT(*) - LAG(COUNT(*)) OVER (PARTITION BY service, severity ORDER BY time)) / 
       LAG(COUNT(*)) OVER (PARTITION BY service, severity ORDER BY time) * 100 as percentage_change
FROM logs
WHERE time >= now() - 24h
GROUP BY service, severity, time(1h)`,
          legendFormat: '{{service}} - {{severity}}'
        }
      ],
      title: 'Victoria Logs Drift Detection',
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 0, y: 0 },
      fieldConfig: {
        defaults: {
          thresholds: {
            steps: [
              { color: 'green', value: null },
              { color: 'yellow', value: warningThreshold },
              { color: 'red', value: criticalThreshold }
            ]
          }
        }
      }
    };

    const blob = new Blob([JSON.stringify(grafanaData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `grafana-drift-detection-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Chart Type:</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Alert Filter:</label>
              <select
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as 'all' | 'warning' | 'critical')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Alerts</option>
                <option value="warning">Warning Only</option>
                <option value="critical">Critical Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showTrends"
                checked={showTrends}
                onChange={(e) => setShowTrends(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showTrends" className="text-sm font-medium">Show Trends</label>
            </div>

            {/* Export Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Export:</span>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                title="Export to CSV"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={exportToJSON}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                title="Export to JSON"
              >
                <FileText className="h-4 w-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={exportToPython}
                className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200 transition-colors"
                title="Export Python script"
              >
                <Code className="h-4 w-4" />
                <span>Python</span>
              </button>
              <button
                onClick={exportToGrafana}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 transition-colors"
                title="Export Grafana dashboard"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Grafana</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-green-800">Normal</div>
                <div className="text-2xl font-bold text-green-600">{alertCounts.normal}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Warning</div>
                <div className="text-2xl font-bold text-yellow-600">{alertCounts.warning}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-red-800">Critical</div>
                <div className="text-2xl font-bold text-red-600">{alertCounts.critical}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-blue-800">Total Services</div>
                <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80">
            {showTrends && timeSeriesData ? (
              <Line data={timeSeriesData} options={timeSeriesOptions} />
            ) : (
              <Bar data={driftData} options={driftOptions} />
            )}
          </div>
          
          <div className="h-80">
            <Bar data={driftData} options={driftOptions} />
          </div>
        </div>

        {/* Alert Rules Configuration */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Alert Rules Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warning Threshold (%)
              </label>
              <input
                type="number"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critical Threshold (%)
              </label>
              <input
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Generated Alert Rules (Prometheus/VictoriaMetrics):</h4>
            <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
              {generateAlertRules()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriftDetectionChart;
