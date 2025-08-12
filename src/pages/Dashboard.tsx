import React, { useState, useEffect, useMemo } from "react";
import { Activity, AlertTriangle, Database, TrendingUp } from "lucide-react";
import { useLogs, useServices } from "../hooks/useLogs";
import { generateTimeRange, formatNumber, formatRelativeTime } from "../utils";
import LogChart from "../components/LogChart";
import LogTable from "../components/LogTable";
import DebugPanel from "../components/DebugPanel";
import TimelineChart from "../components/charts/TimelineChart";
import LogLevelChart from "../components/charts/LogLevelChart";
import ServiceChart from "../components/charts/ServiceChart";
import ErrorChart from "../components/charts/ErrorChart";
import HostChart from "../components/charts/HostChart";
import PieChart from "../components/charts/PieChart";
import HeatmapChart from "../components/charts/HeatmapChart";
import GaugeChart from "../components/charts/GaugeChart";
import TreemapChart from "../components/charts/TreemapChart";
import DonutChart from "../components/charts/DonutChart";
import StackedAreaChart from "../components/charts/StackedAreaChart";
import RadarChart from "../components/charts/RadarChart";

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState(() => generateTimeRange("1h"));

  // Fetch recent logs
  const { data: logsData, isLoading: logsLoading } = useLogs({
    query: "*",
    limit: 1000,
  });

  // Fetch services data
  const { data: services = [], isLoading: servicesLoading } = useServices();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!logsData?.values) {
      return {
        totalLogs: 0,
        errorLogs: 0,
        services: 0,
        avgLogsPerMinute: 0,
      };
    }

    const logs = logsData.values;
    const errorLogs = logs.filter(
      (log) =>
        log.level &&
        ["ERROR", "FATAL", "CRITICAL"].includes(log.level.toUpperCase())
    ).length;

    const uniqueServices = new Set(
      logs.map((log) => log.service).filter(Boolean)
    ).size;

    // Calculate logs per minute
    const timeRangeMs =
      new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime();
    const minutes = timeRangeMs / (1000 * 60);
    const avgLogsPerMinute =
      minutes > 0 ? Math.round(logs.length / minutes) : 0;

    return {
      totalLogs: logs.length,
      errorLogs,
      services: uniqueServices,
      avgLogsPerMinute,
    };
  }, [logsData, timeRange]);

  // Get recent error logs
  const recentErrors = useMemo(() => {
    if (!logsData?.values) return [];

    return logsData.values
      .filter(
        (log) =>
          log.level &&
          ["ERROR", "FATAL", "CRITICAL"].includes(log.level.toUpperCase())
      )
      .slice(0, 5);
  }, [logsData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger a refetch by updating the time range slightly
      // This is a simple way to refresh the data
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Stat Card Component
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    iconBg: string;
    change?: string;
  }> = ({ title, value, icon: Icon, color, iconBg, change }) => (
    <div className="card-elevated p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {typeof value === "number" ? formatNumber(value) : value}
          </p>
          {change && (
            <p className="text-xs text-slate-500 mt-1">{change}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-xl text-3xl">Dashboard</h1>
            <p className="text-readable mt-2">
              Real-time overview of your Victoria Logs system performance and insights
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Live data</span>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Logs"
          value={stats.totalLogs}
          icon={Database}
          color="text-blue-600"
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
          change="All time"
        />
        <StatCard
          title="Error Logs"
          value={stats.errorLogs}
          icon={AlertTriangle}
          color="text-red-600"
          iconBg="bg-gradient-to-br from-red-500 to-red-600"
          change="Requires attention"
        />
        <StatCard
          title="Active Services"
          value={stats.services}
          icon={Activity}
          color="text-green-600"
          iconBg="bg-gradient-to-br from-green-500 to-green-600"
          change="Currently logging"
        />
        <StatCard
          title="Logs/Minute"
          value={stats.avgLogsPerMinute}
          icon={TrendingUp}
          color="text-purple-600"
          iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
          change="Average rate"
        />
      </div>

      {/* System Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-lg">System Overview</h2>
          <div className="text-muted">Real-time monitoring</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">Log Activity Timeline</h3>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Live
              </div>
            </div>
            <TimelineChart logs={logsData?.values || []} height={280} />
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">Log Distribution</h3>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                By Level
              </div>
            </div>
            <LogLevelChart logs={logsData?.values || []} height={280} />
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-lg">Detailed Analysis</h2>
          <div className="text-muted">Service & error insights</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ServiceChart logs={logsData?.values || []} />
          <ErrorChart logs={logsData?.values || []} />
          <HostChart logs={logsData?.values || []} />
        </div>
      </div>

      {/* Volume Analysis */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-lg">Volume Analysis</h2>
          <div className="text-muted">Log volume trends</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Log Volume Chart */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Log Volume by Level
              </h3>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Real-time
              </div>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="spinner" />
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden">
                <LogChart
                  logs={logsData?.values || []}
                  height={280}
                  groupBy="level"
                  chartType="line"
                />
              </div>
            )}
          </div>

          {/* Service Activity Chart */}
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Activity by Service
              </h3>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Real-time
              </div>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="spinner" />
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden">
                <LogChart
                  logs={logsData?.values || []}
                  height={280}
                  groupBy="service"
                  chartType="bar"
                  maxYValue={20}
                  showServiceDropdown={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Visualizations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-lg">Advanced Analytics</h2>
          <div className="text-muted">Comprehensive insights</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <PieChart 
              logs={logsData?.values || []} 
              title="Log Level Distribution"
              groupBy="level"
              height={280}
            />
          </div>
          
          {/* Gauge Charts */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <GaugeChart 
              logs={logsData?.values || []} 
              title="Error Rate"
              metric="error_rate"
              height={200}
            />
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <GaugeChart 
              logs={logsData?.values || []} 
              title="Activity Level"
              metric="activity_level"
              height={200}
            />
          </div>
          
          {/* Donut Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <DonutChart 
              logs={logsData?.values || []} 
              title="Host Distribution"
              groupBy="host"
              height={250}
            />
          </div>
        </div>
      </div>

      {/* Data Distribution */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-lg">Data Distribution</h2>
          <div className="text-muted">Hierarchical & pattern analysis</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Treemap */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <TreemapChart 
              logs={logsData?.values || []} 
              title="Service Size Distribution"
              groupBy="service"
              height={320}
            />
          </div>
          
          {/* Heatmap */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <HeatmapChart 
              logs={logsData?.values || []} 
              title="Activity Heatmap"
              height={320}
            />
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-lg">Trend Analysis</h2>
          <div className="text-muted">Time-based patterns</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stacked Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <StackedAreaChart 
              logs={logsData?.values || []} 
              title="Stacked Log Trends"
              groupBy="level"
              height={320}
            />
          </div>
          
          {/* Radar Chart */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <RadarChart 
              logs={logsData?.values || []} 
              title="System Health Radar"
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Recent Logs</h3>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Latest 100 entries
            </div>
            <Database className="h-5 w-5 text-slate-400" />
          </div>
        </div>
        {logsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner" />
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden border border-slate-200">
            <LogTable
              logs={logsData?.values?.slice(0, 100) || []}
              height={400}
              maxMessageLength={150}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;