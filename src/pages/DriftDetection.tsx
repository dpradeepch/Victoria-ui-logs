import React, { useState, useEffect } from 'react';
import BaselineComparisonChart from '../components/charts/BaselineComparisonChart';
import DriftDetectionChart from '../components/charts/DriftDetectionChart';

// Mock data generators for demonstration
const generateBaselineComparisonData = (comparisonType: 'two-periods' | 'baseline') => {
  const services = ['user-service', 'auth-service', 'payment-service', 'notification-service', 'analytics-service'];
  const severities = ['ERROR', 'WARN', 'INFO'];
  
  return services.flatMap(service => 
    severities.map(severity => {
      const baseline = Math.random() * 100 + 10;
      const current = baseline * (0.5 + Math.random());
      const delta = current - baseline;
      const percentageChange = ((delta / baseline) * 100);
      
      return {
        service,
        severity,
        currentPeriod: Math.round(current * 100) / 100,
        baselinePeriod: Math.round(baseline * 100) / 100,
        delta: Math.round(delta * 100) / 100,
        percentageChange: Math.round(percentageChange * 100) / 100
      };
    })
  );
};

const generateDriftData = (warningThreshold: number, criticalThreshold: number) => {
  const services = ['user-service', 'auth-service', 'payment-service', 'notification-service', 'analytics-service', 'database-service', 'cache-service'];
  const severities = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  const timestamps = ['2025-08-12T00:00:00Z', '2025-08-12T06:00:00Z', '2025-08-12T12:00:00Z', '2025-08-12T18:00:00Z'];
  
  return services.flatMap(service => 
    severities.flatMap(severity => 
      timestamps.map(timestamp => {
        const baseline = Math.random() * 100 + 10;
        const current = baseline * (0.3 + Math.random() * 1.4); // More variation for drift detection
        const delta = current - baseline;
        const percentageChange = Math.abs((delta / baseline) * 100);
        
        let alertLevel: 'normal' | 'warning' | 'critical' = 'normal';
        if (percentageChange > criticalThreshold) {
          alertLevel = 'critical';
        } else if (percentageChange > warningThreshold) {
          alertLevel = 'warning';
        }
        
        return {
          service,
          severity,
          currentPeriod: Math.round(current * 100) / 100,
          baselinePeriod: Math.round(baseline * 100) / 100,
          delta: Math.round(delta * 100) / 100,
          percentageChange: Math.round(percentageChange * 100) / 100,
          timestamp,
          alertLevel
        };
      })
    )
  );
};

const DriftDetection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'baseline' | 'drift' | 'overview'>('overview');
  const [comparisonType, setComparisonType] = useState<'two-periods' | 'baseline'>('baseline');
  const [warningThreshold, setWarningThreshold] = useState(20);
  const [criticalThreshold, setCriticalThreshold] = useState(50);
  const [period1Label, setPeriod1Label] = useState('Period 1');
  const [period2Label, setPeriod2Label] = useState('Period 2');
  const [baselineLabel, setBaselineLabel] = useState('Baseline (Jul 1-7)');
  const [currentLabel, setCurrentLabel] = useState('Current (Aug 1-7)');
  
  const baselineData = generateBaselineComparisonData(comparisonType);
  const driftData = generateDriftData(warningThreshold, criticalThreshold);

  const alertSummary = {
    total: driftData.length,
    normal: driftData.filter(d => d.alertLevel === 'normal').length,
    warning: driftData.filter(d => d.alertLevel === 'warning').length,
    critical: driftData.filter(d => d.alertLevel === 'critical').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Drift Detection & Anomaly Analysis
          </h1>
          <p className="text-gray-600">
            Complete period-to-baseline comparison with drift detection and automated alerting
          </p>
        </div>

        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Services</p>
                    <p className="text-2xl font-semibold text-gray-900">{alertSummary.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Normal</p>
                    <p className="text-2xl font-semibold text-green-600">{alertSummary.normal}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Warnings</p>
                    <p className="text-2xl font-semibold text-yellow-600">{alertSummary.warning}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Critical</p>
                    <p className="text-2xl font-semibold text-red-600">{alertSummary.critical}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('baseline')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <h3 className="font-medium text-gray-900">Period Comparison</h3>
                  <p className="text-sm text-gray-600 mt-1">Compare two time periods or against baseline</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('drift')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors text-left"
                >
                  <h3 className="font-medium text-gray-900">Drift Detection</h3>
                  <p className="text-sm text-gray-600 mt-1">Monitor anomalies and configure alerts</p>
                </button>
                
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="font-medium text-gray-900">SQL Examples</h3>
                  <p className="text-sm text-gray-600 mt-1">Ready-to-use LogSQL queries</p>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Baseline Comparison Tab */}
        {activeTab === 'baseline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comparison Type
                  </label>
                  <select
                    value={comparisonType}
                    onChange={(e) => setComparisonType(e.target.value as 'two-periods' | 'baseline')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="two-periods">Compare Two Specific Periods</option>
                    <option value="baseline">Compare to Historical Baseline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {comparisonType === 'two-periods' ? 'Period Labels' : 'Baseline Labels'}
                  </label>
                  <div className="space-y-2">
                    {comparisonType === 'two-periods' ? (
                      <>
                        <input
                          type="text"
                          value={period1Label}
                          onChange={(e) => setPeriod1Label(e.target.value)}
                          placeholder="Period 1 Label"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={period2Label}
                          onChange={(e) => setPeriod2Label(e.target.value)}
                          placeholder="Period 2 Label"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={baselineLabel}
                          onChange={(e) => setBaselineLabel(e.target.value)}
                          placeholder="Baseline Label"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={currentLabel}
                          onChange={(e) => setCurrentLabel(e.target.value)}
                          placeholder="Current Period Label"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <BaselineComparisonChart
              data={baselineData}
              comparisonType={comparisonType}
              period1Label={period1Label}
              period2Label={period2Label}
              baselineLabel={baselineLabel}
              currentLabel={currentLabel}
            />
          </div>
        )}

        {/* Drift Detection Tab */}
        {activeTab === 'drift' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Alert Thresholds</h2>
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
                  <p className="text-xs text-gray-500 mt-1">Alerts will be triggered when drift exceeds this percentage</p>
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
                  <p className="text-xs text-gray-500 mt-1">Critical alerts for severe drift patterns</p>
                </div>
              </div>
            </div>

            <DriftDetectionChart
              data={driftData}
              warningThreshold={warningThreshold}
              criticalThreshold={criticalThreshold}
              timeRange="Last 24 hours"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('baseline')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'baseline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Period Comparison
              </button>
              <button
                onClick={() => setActiveTab('drift')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'drift'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Drift Detection
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriftDetection;
