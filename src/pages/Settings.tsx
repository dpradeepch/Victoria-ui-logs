import React, { useState } from 'react'
import { Check, AlertCircle, Database, Settings as SettingsIcon, Info } from 'lucide-react'
import { useConnectionTest } from '../hooks/useLogs'
import { VictoriaLogsAPI } from '../services/api'
import toast from 'react-hot-toast'

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('connection')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const { data: isConnected, isLoading: connectionLoading } = useConnectionTest()

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionResult(null)

    try {
      const isConnected = await VictoriaLogsAPI.testConnection()
      
      if (isConnected) {
        setConnectionResult({
          success: true,
          message: 'Successfully connected to Victoria Logs'
        })
        toast.success('Connection test successful')
      } else {
        setConnectionResult({
          success: false,
          message: 'Failed to connect to Victoria Logs'
        })
        toast.error('Connection test failed')
      }
    } catch (error) {
      setConnectionResult({
        success: false,
        message: `Connection error: ${error}`
      })
      toast.error('Connection test failed')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const tabs = [
    { id: 'connection', name: 'Connection', icon: Database },
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'about', name: 'About', icon: Info },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Configure your Victoria Logs UI preferences and connection
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Connection Tab */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Victoria Logs Connection
                </h3>
                
                {/* Current Status */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      connectionLoading 
                        ? 'bg-yellow-400' 
                        : isConnected 
                          ? 'bg-green-400' 
                          : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Status: {connectionLoading 
                          ? 'Checking...' 
                          : isConnected 
                            ? 'Connected' 
                            : 'Disconnected'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        Endpoint: http://localhost:9428
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connection Test */}
                <div className="space-y-4">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {isTestingConnection ? (
                      <div className="spinner" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    <span>Test Connection</span>
                  </button>

                  {connectionResult && (
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      connectionResult.success 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {connectionResult.success ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">{connectionResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Connection Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Connection Information
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Victoria Logs should be running on localhost:9428</p>
                    <p>• The UI connects via proxy configuration in Vite</p>
                    <p>• API requests are proxied to /api/* → http://localhost:9428/*</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  General Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select className="input">
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  {/* Default Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Time Range
                    </label>
                    <select className="input">
                      <option value="5m">Last 5 minutes</option>
                      <option value="15m">Last 15 minutes</option>
                      <option value="30m">Last 30 minutes</option>
                      <option value="1h">Last 1 hour</option>
                      <option value="3h">Last 3 hours</option>
                      <option value="6h">Last 6 hours</option>
                      <option value="12h">Last 12 hours</option>
                      <option value="24h">Last 24 hours</option>
                    </select>
                  </div>

                  {/* Auto-refresh Interval */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-refresh Interval
                    </label>
                    <select className="input">
                      <option value="0">Disabled</option>
                      <option value="5">5 seconds</option>
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>

                  {/* Max Logs Per Query */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Logs Per Query
                    </label>
                    <input
                      type="number"
                      defaultValue={1000}
                      min={100}
                      max={10000}
                      step={100}
                      className="input"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button className="btn btn-primary">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  About Victoria Logs UI
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Version Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Victoria Logs UI: v1.0.0</p>
                      <p>Built with React, TypeScript, and uPlot</p>
                      <p>Designed for Victoria Logs v1.27.0+</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Real-time log visualization with uPlot charts</p>
                      <p>• Advanced LogsQL query builder</p>
                      <p>• Interactive log table with virtualization</p>
                      <p>• Dashboard with service metrics</p>
                      <p>• Export functionality for log data</p>
                      <p>• Responsive design for all devices</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Resources</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <a 
                          href="https://docs.victoriametrics.com/victorialogs/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Victoria Logs Documentation
                        </a>
                      </p>
                      <p>
                        <a 
                          href="https://github.com/leeoniya/uPlot" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          uPlot Charting Library
                        </a>
                      </p>
                      <p>
                        <a 
                          href="https://grafana.com/grafana/plugins/victoriametrics-logs-datasource" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Grafana Plugin for Victoria Logs
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
