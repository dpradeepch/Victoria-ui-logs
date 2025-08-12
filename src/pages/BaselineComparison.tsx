import React, { useState } from 'react';
import BaselineComparisonChart from '../components/charts/BaselineComparisonChart';

// Mock data for demonstration
const generateMockData = (comparisonType: 'two-periods' | 'baseline') => {
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

const BaselineComparison: React.FC = () => {
  const [comparisonType, setComparisonType] = useState<'two-periods' | 'baseline'>('baseline');
  const [period1Label, setPeriod1Label] = useState('Period 1');
  const [period2Label, setPeriod2Label] = useState('Period 2');
  const [baselineLabel, setBaselineLabel] = useState('Baseline (Jul 1-7)');
  const [currentLabel, setCurrentLabel] = useState('Current (Aug 1-7)');
  
  const mockData = generateMockData(comparisonType);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Period-to-Baseline Comparison
          </h1>
          <p className="text-gray-600">
            Compare log patterns between different time periods or against historical baselines
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
          data={mockData}
          comparisonType={comparisonType}
          period1Label={period1Label}
          period2Label={period2Label}
          baselineLabel={baselineLabel}
          currentLabel={currentLabel}
        />
      </div>
    </div>
  );
};

export default BaselineComparison;
