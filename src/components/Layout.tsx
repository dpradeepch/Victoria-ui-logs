import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Search, 
  Settings, 
  Menu, 
  X,
  Activity,
  Database,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { useConnectionTest } from '../hooks/useLogs'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const { data: isConnected, isLoading: connectionLoading } = useConnectionTest()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Baseline Comparison', href: '/baseline', icon: TrendingUp },
    { name: 'Drift Detection', href: '/drift', icon: AlertTriangle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isCurrentPath = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl border-r border-slate-200">
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-semibold text-slate-900">Victoria Logs</span>
                <div className="text-xs text-slate-500 font-medium">Log Management</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link group ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Enhanced connection status */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className={`flex items-center p-3 rounded-lg ${
              connectionLoading 
                ? 'status-loading' 
                : isConnected 
                  ? 'status-online' 
                  : 'status-offline'
            }`}>
              <div className={`h-2 w-2 rounded-full mr-3 ${
                connectionLoading 
                  ? 'bg-amber-500' 
                  : isConnected 
                    ? 'bg-emerald-500' 
                    : 'bg-red-500'
              }`} />
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {connectionLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <div className="text-xs opacity-75">Victoria Logs Server</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
      }`}>
        <div className="flex flex-col flex-grow bg-white border-r border-slate-200 shadow-sm">
          <div className="flex h-16 items-center px-4 border-b border-slate-200">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
                  <Database className="h-5 w-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3">
                    <span className="text-xl font-semibold text-slate-900">Victoria Logs</span>
                    <div className="text-xs text-slate-500 font-medium">Log Management</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isCurrentPath(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link group ${isActive ? 'nav-link-active' : 'nav-link-inactive'} ${
                    sidebarCollapsed ? 'justify-center px-3' : ''
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Enhanced connection status */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className={`flex items-center p-3 rounded-lg ${
              connectionLoading 
                ? 'status-loading' 
                : isConnected 
                  ? 'status-online' 
                  : 'status-offline'
            }`}>
              <div className={`h-2 w-2 rounded-full mr-3 ${
                connectionLoading 
                  ? 'bg-amber-500' 
                  : isConnected 
                    ? 'bg-emerald-500' 
                    : 'bg-red-500'
              }`} />
              <div className="flex-1">
                <span className="text-sm font-medium">
                  {connectionLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <div className="text-xs opacity-75">Victoria Logs Server</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'}`}>
        {/* Enhanced top bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Desktop sidebar toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </button>
              
              <span className="text-sm text-slate-600">
                {sidebarCollapsed ? 'Sidebar collapsed' : 'Full view'}
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Connection indicator */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                connectionLoading 
                  ? 'status-loading' 
                  : isConnected 
                    ? 'status-online' 
                    : 'status-offline'
              }`}>
                <Activity className={`h-4 w-4 ${
                  connectionLoading 
                    ? 'text-amber-600' 
                    : isConnected 
                      ? 'text-emerald-600' 
                      : 'text-red-600'
                }`} />
                <span>
                  Victoria Logs {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Current time */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span className="text-mono">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced page content */}
        <main className="flex-1 bg-slate-50">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout