import React, { useState, useEffect, useRef } from 'react';
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
import { Download, FileText, Code } from 'lucide-react';

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

interface BaselineComparisonData {
  service: string;
  severity: string;
  currentPeriod: number;
  baselinePeriod: number;
  delta: number;
  percentageChange: number;
}

interface BaselineComparisonChartProps {
  data?: BaselineComparisonData[];
  comparisonType: 'two-periods' | 'baseline';
  period1Label?: string;
  period2Label?: string;
  baselineLabel?: string;
  currentLabel?: string;
}

const BaselineComparisonChart: React.FC<BaselineComparisonChartProps> = ({
  data = [],
  comparisonType,
  period1Label = 'Period 1',
  period2Label = 'Period 2',
  baselineLabel = 'Baseline',
  currentLabel = 'Current Period'
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  const [groupBy, setGroupBy] = useState<'service' | 'severity'>('service');
  const [sortBy, setSortBy] = useState<'delta' | 'percentage' | 'current'>('delta');

  const processedData = React.useMemo(() => {
    if (!data.length) return [];
    
    let sorted = [...data];
    switch (sortBy) {
      case 'delta':
        sorted.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
        break;
      case 'percentage':
        sorted.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
        break;
      case 'current':
        sorted.sort((a, b) => b.currentPeriod - a.currentPeriod);
        break;
    }
    
    return sorted.slice(0, 20); // Show top 20 for readability
  }, [data, sortBy]);

  const chartData = React.useMemo(() => {
    if (comparisonType === 'two-periods') {
      return {
        labels: processedData.map(d => `${d.service} (${d.severity})`),
        datasets: [
          {
            label: period1Label,
            data: processedData.map(d => d.baselinePeriod),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
          },
          {
            label: period2Label,
            data: processedData.map(d => d.currentPeriod),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
          },
        ],
      };
    } else {
      return {
        labels: processedData.map(d => `${d.service} (${d.severity})`),
        datasets: [
          {
            label: baselineLabel,
            data: processedData.map(d => d.baselinePeriod),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
          },
          {
            label: currentLabel,
            data: processedData.map(d => d.currentPeriod),
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2,
          },
        ],
      };
    }
  }, [processedData, comparisonType, period1Label, period2Label, baselineLabel, currentLabel]);

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Period-to-Baseline Comparison - ${comparisonType === 'two-periods' ? 'Two Periods' : 'Baseline vs Current'}`,
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex;
            const item = processedData[dataIndex];
            if (item) {
              return [
                `Delta: ${item.delta > 0 ? '+' : ''}${item.delta.toFixed(2)}`,
                `Change: ${item.percentageChange > 0 ? '+' : ''}${item.percentageChange.toFixed(1)}%`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count per Day',
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

  const deltaData = {
    labels: processedData.map(d => `${d.service} (${d.severity})`),
    datasets: [
      {
        label: 'Delta from Baseline',
        data: processedData.map(d => d.delta),
        backgroundColor: processedData.map(d => 
          d.delta > 0 ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)'
        ),
        borderColor: processedData.map(d => 
          d.delta > 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const deltaOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Deviation from Baseline',
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
                `Change: ${item.percentageChange > 0 ? '+' : ''}${item.percentageChange.toFixed(1)}%`
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

  // Export functions
  const exportToCSV = () => {
    const headers = ['Service', 'Severity', 'Baseline Period', 'Current Period', 'Delta', 'Percentage Change'];
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => [
        row.service,
        row.severity,
        row.baselinePeriod,
        row.currentPeriod,
        row.delta,
        row.percentageChange
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `baseline-comparison-${comparisonType}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonData = {
      comparisonType,
      period1Label,
      period2Label,
      baselineLabel,
      currentLabel,
      exportDate: new Date().toISOString(),
      data: processedData
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `baseline-comparison-${comparisonType}-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPython = () => {
    const pythonCode = `# Victoria Logs Baseline Comparison Data
# Generated on: ${new Date().toISOString()}
# Comparison Type: ${comparisonType}

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the comparison data
data = ${JSON.stringify(processedData, null, 2)}

# Convert to pandas DataFrame
df = pd.DataFrame(data)

# Display summary statistics
print("Baseline Comparison Summary:")
print(f"Total services: {df.shape[0]}")
print(f"Average delta: {df['delta'].mean():.2f}")
print(f"Average percentage change: {df['percentageChange'].mean():.2f}")

# Create visualization
plt.figure(figsize=(12, 6))
plt.subplot(1, 2, 1)
df.plot(x='service', y=['baselinePeriod', 'currentPeriod'], kind='bar', ax=plt.gca())
plt.title('Baseline vs Current Period')
plt.xticks(rotation=45)

plt.subplot(1, 2, 2)
df.plot(x='service', y='delta', kind='bar', ax=plt.gca(), color='orange')
plt.title('Delta from Baseline')
plt.xticks(rotation=45)

plt.tight_layout()
plt.show()

# Export to CSV for further analysis
df.to_csv('baseline_comparison_export.csv', index=False)
print("Data exported to 'baseline_comparison_export.csv'")`;

    const blob = new Blob([pythonCode], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `baseline-comparison-${comparisonType}-${new Date().toISOString().split('T')[0]}.py`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToGrafana = () => {
    const grafanaData = {
      targets: [
        {
          expr: comparisonType === 'two-periods' 
            ? `# Period 1: ${period1Label}
SELECT severity, COUNT(*) AS period1_count
FROM logs
WHERE time >= '2025-08-01T00:00:00Z' AND time < '2025-08-08T00:00:00Z'
GROUP BY severity`
            : `# Baseline: ${baselineLabel}
SELECT service, severity, COUNT(*) / 7 AS avg_per_day
FROM logs
WHERE time >= '2025-07-01T00:00:00Z' AND time < '2025-07-08T00:00:00Z'
GROUP BY service, severity`,
          legendFormat: comparisonType === 'two-periods' ? '{{severity}} - Period 1' : '{{service}} - {{severity}}'
        },
        {
          expr: comparisonType === 'two-periods'
            ? `# Period 2: ${period2Label}
SELECT severity, COUNT(*) AS period2_count
FROM logs
WHERE time >= '2025-08-08T00:00:00Z' AND time < '2025-08-15T00:00:00Z'
GROUP BY severity`
            : `# Current: ${currentLabel}
SELECT service, severity, COUNT(*) / 7 AS curr_per_day
FROM logs
WHERE time >= '2025-08-01T00:00:00Z' AND time < '2025-08-08T00:00:00Z'
GROUP BY service, severity`,
          legendFormat: comparisonType === 'two-periods' ? '{{severity}} - Period 2' : '{{service}} - {{severity}}'
        }
      ],
      title: `Victoria Logs ${comparisonType === 'two-periods' ? 'Two Period' : 'Baseline'} Comparison`,
      type: 'graph',
      gridPos: { h: 8, w: 12, x: 0, y: 0 }
    };

    const blob = new Blob([JSON.stringify(grafanaData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `grafana-dashboard-${comparisonType}-${new Date().toISOString().split('T')[0]}.json`);
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
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'delta' | 'percentage' | 'current')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="delta">Delta</option>
                <option value="percentage">Percentage Change</option>
                <option value="current">Current Period</option>
              </select>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80">
            {chartType === 'bar' ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
          
          <div className="h-80">
            <Bar data={deltaData} options={deltaOptions} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-800">Total Services</div>
              <div className="text-2xl font-bold text-blue-600">{processedData.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-800">Improving</div>
              <div className="text-2xl font-bold text-green-600">
                {processedData.filter(d => d.delta < 0).length}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="font-medium text-red-800">Worsening</div>
              <div className="text-2xl font-bold text-red-600">
                {processedData.filter(d => d.delta > 0).length}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-800">Avg Change</div>
              <div className="text-2xl font-bold text-gray-600">
                {(processedData.reduce((sum, d) => sum + Math.abs(d.percentageChange), 0) / processedData.length).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaselineComparisonChart;
