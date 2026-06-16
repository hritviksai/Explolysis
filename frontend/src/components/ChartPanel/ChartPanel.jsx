import { Suspense, lazy } from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'
import './ChartPanel.css'

const PLOTLY_CONFIG = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
  toImageButtonOptions: {
    format: 'png',
    filename: 'autoinsight_chart',
    scale: 2,
  },
  responsive: true,
}

export default function ChartPanel({ figure, height = 420, loading = false, error = null, title }) {
  if (loading) return <ChartSkeleton height={height} />
  if (error)   return <ChartError message={error} height={height} />
  if (!figure) return null

  const plotData   = figure.data   || []
  const plotLayout = figure.layout || {}

  // Ensure responsive sizing
  const layout = {
    ...plotLayout,
    autosize: true,
    height,
    margin: { l: 50, r: 30, t: 60, b: 50, ...(plotLayout.margin || {}) },
  }

  return (
    <motion.div
      className="chart-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Plot
        data={plotData}
        layout={layout}
        config={PLOTLY_CONFIG}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </motion.div>
  )
}

function ChartSkeleton({ height }) {
  return (
    <div className="chart-skeleton skeleton" style={{ height }}>
      <div className="chart-skeleton-icon">📊</div>
    </div>
  )
}

function ChartError({ message, height }) {
  return (
    <div className="chart-error" style={{ height }}>
      <span>⚠</span>
      <p>{message}</p>
    </div>
  )
}
