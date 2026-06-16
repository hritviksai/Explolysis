import { useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useDataset } from './hooks/useDataset'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'

export default function App() {
  const datasetState = useDataset()

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            datasetState.session
              ? <Navigate to="/dashboard" replace />
              : <LandingPage datasetState={datasetState} />
          }
        />
        <Route
          path="/dashboard"
          element={
            datasetState.session
              ? <Dashboard datasetState={datasetState} />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </Router>
  )
}
