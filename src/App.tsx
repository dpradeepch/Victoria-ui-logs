import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Explore from './pages/Explore'
import Settings from './pages/Settings'
import BaselineComparison from './pages/BaselineComparison'
import DriftDetection from './pages/DriftDetection'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/baseline" element={<BaselineComparison />} />
        <Route path="/drift" element={<DriftDetection />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
