import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOverview, useDistribution } from '../../hooks/useAnalysis'
import ChartPanel from '../ChartPanel/ChartPanel'
import './DistributionExplorer.css'

function StatBadge({ label, value }) {
  if (value === null || value === undefined) return null
  return (
    <div className="stat-badge">
      <span className="stat-label">{label}</span>
      <span className="stat-val">{typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : value}</span>
    </div>
  )
}

export default function DistributionExplorer({ sessionId }) {
  const { data: overview } = useOverview(sessionId)
  const [selectedCol, setSelectedCol] = useState(null)

  const columns = overview?.columns_info || []
  const activeCol = selectedCol || columns[0]?.name

  const { data, isLoading, error } = useDistribution(sessionId, activeCol)

  const stats = data?.stats

  return (
    <div className="dist-root">
      {/* Column Selector */}
      <div className="glass-card dist-selector-card">
        <div className="section-header" style={{ marginBottom: 14 }}>
          <div className="section-title">
            <span className="section-icon">📈</span>
            Distribution Explorer
          </div>
          <select
            className="select-input"
            value={activeCol || ''}
            onChange={e => setSelectedCol(e.target.value)}
            id="dist-column-select"
          >
            {columns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>

        {/* Column type badges */}
        {activeCol && (
          <div style={{ display: 'flex', gap: 8 }}>
            {columns.find(c => c.name === activeCol) && (
              <>
                <span className={`tag tag-${columns.find(c => c.name === activeCol)?.category}`}>
                  {columns.find(c => c.name === activeCol)?.category}
                </span>
                <span className="badge badge-indigo">
                  {columns.find(c => c.name === activeCol)?.null_pct}% missing
                </span>
                <span className="badge badge-cyan">
                  {columns.find(c => c.name === activeCol)?.unique_count.toLocaleString()} unique
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <motion.div
        className="glass-card"
        style={{ padding: 20, marginTop: 16 }}
        key={activeCol}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ChartPanel
          figure={data?.figure}
          loading={isLoading}
          error={error?.message}
          height={380}
        />
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          className="glass-card stats-grid"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-title" style={{ marginBottom: 14 }}>
            <span className="section-icon">🔢</span>
            Statistics — <span style={{ color: '#818cf8' }}>{stats.column}</span>
          </div>
          <div className="stats-badges">
            <StatBadge label="Mean"     value={stats.mean} />
            <StatBadge label="Median"   value={stats.median} />
            <StatBadge label="Std Dev"  value={stats.std} />
            <StatBadge label="Min"      value={stats.min} />
            <StatBadge label="Max"      value={stats.max} />
            <StatBadge label="Q25"      value={stats.q25} />
            <StatBadge label="Q75"      value={stats.q75} />
            <StatBadge label="Skewness" value={stats.skewness} />
            <StatBadge label="Kurtosis" value={stats.kurtosis} />
            <StatBadge label="Mode"     value={stats.mode} />
            <StatBadge label="Missing"  value={stats.null_count} />
            <StatBadge label="Unique"   value={stats.unique_count} />
          </div>
        </motion.div>
      )}
    </div>
  )
}
