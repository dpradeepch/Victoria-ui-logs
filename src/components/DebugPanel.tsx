import React, { useState } from 'react'
import { VictoriaLogsAPI } from '../services/api'

const DebugPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testDirectAPI = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      // Test direct API call
      const response = await fetch('/api/select/logsql/query?query=*&limit=5')
      const text = await response.text()
      
      console.log('Direct API response:', text)
      
      setTestResult({
        success: true,
        status: response.status,
        data: text,
        parsed: text.split('\n').filter(line => line.trim()).map(line => {
          try {
            return JSON.parse(line)
          } catch (e) {
            return line
          }
        })
      })
    } catch (error) {
      console.error('Direct API test failed:', error)
      setTestResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testViaService = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const result = await VictoriaLogsAPI.queryLogs({
        query: '*',
        limit: 5
      })
      
      console.log('Service API response:', result)
      
      setTestResult({
        success: true,
        service: true,
        data: result
      })
    } catch (error) {
      console.error('Service API test failed:', error)
      setTestResult({
        success: false,
        service: true,
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">API Debug Panel</h3>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={testDirectAPI}
          disabled={isLoading}
          className="btn btn-primary"
        >
          Test Direct API
        </button>
        <button
          onClick={testViaService}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          Test Via Service
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="spinner" />
          <p className="text-sm text-gray-600 mt-2">Testing API...</p>
        </div>
      )}

      {testResult && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-900 mb-2">Test Result:</h4>
          <div className={`p-3 rounded-lg ${
            testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel
