import { motion } from 'framer-motion'
import { useOverview } from '../../hooks/useAnalysis'
import './DataOverview.css'

const TYPE_COLORS = {
  numeric: 'tag-numeric',
  categorical: 'tag-categorical',
  datetime: 'tag-datetime',
  boolean: 'tag-boolean',
  text: 'tag-text',
}

function MetricCard({ label, value, sub, icon, delay = 0 }) {
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </motion.div>
  )
}

export default function DataOverview({ sessionId }) {
  const { data, isLoading, error } = useOverview(sessionId)

  if (isLoading) return <OverviewSkeleton />
  if (error) return <div className="error-msg">⚠ {error.message}</div>
  if (!data) return null

  const numericCols = data.columns_info.filter(c => c.category === 'numeric')
  const catCols     = data.columns_info.filter(c => c.category === 'categorical' || c.category === 'text')
  const dtCols      = data.columns_info.filter(c => c.category === 'datetime')

  return (
    <div className="overview-root">
      {/* Top Metrics */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <MetricCard icon="📐" label="Rows" value={data.rows.toLocaleString()} sub="total records" delay={0} />
        <MetricCard icon="📊" label="Columns" value={data.columns} sub={`${data.numeric_cols} num · ${data.categorical_cols} cat`} delay={0.05} />
        <MetricCard icon="❓" label="Missing" value={`${data.missing_pct}%`} sub={`${data.total_missing.toLocaleString()} cells`} delay={0.1} />
        <MetricCard icon="💾" label="Memory" value={`${data.memory_mb} MB`} sub={`${data.duplicate_rows} dupes`} delay={0.15} />
      </div>

      {/* Column Type Breakdown */}
      <motion.div
        className="glass-card type-breakdown"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🗂</span>
            Column Types
          </div>
          <div className="type-badges">
            <span className="badge badge-indigo">🔢 {data.numeric_cols} numeric</span>
            <span className="badge badge-cyan">🏷 {data.categorical_cols} categorical</span>
            {data.datetime_cols > 0 && <span className="badge badge-amber">📅 {data.datetime_cols} datetime</span>}
          </div>
        </div>
        <div className="type-bar">
          {data.numeric_cols > 0 && (
            <div
              className="type-bar-seg seg-numeric"
              style={{ width: `${(data.numeric_cols / data.columns) * 100}%` }}
              title={`${data.numeric_cols} numeric`}
            />
          )}
          {data.categorical_cols > 0 && (
            <div
              className="type-bar-seg seg-categorical"
              style={{ width: `${(data.categorical_cols / data.columns) * 100}%` }}
              title={`${data.categorical_cols} categorical`}
            />
          )}
          {data.datetime_cols > 0 && (
            <div
              className="type-bar-seg seg-datetime"
              style={{ width: `${(data.datetime_cols / data.columns) * 100}%` }}
              title={`${data.datetime_cols} datetime`}
            />
          )}
        </div>
      </motion.div>

      {/* Columns Table */}
      <motion.div
        className="glass-card"
        style={{ marginTop: 20, padding: '20px' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">
            <span className="section-icon">📋</span>
            Column Details
          </div>
          <span className="badge badge-indigo">{data.columns} columns</span>
        </div>
        <div className="col-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Data Type</th>
                <th>Missing</th>
                <th>Unique</th>
                <th>Sample Values</th>
              </tr>
            </thead>
            <tbody>
              {data.columns_info.map((col, i) => (
                <motion.tr
                  key={col.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.02 }}
                >
                  <td><strong style={{ color: '#f1f5f9' }}>{col.name}</strong></td>
                  <td><span className={`tag ${TYPE_COLORS[col.category] || 'tag-text'}`}>{col.category}</span></td>
                  <td style={{ color: '#475569' }}>{col.dtype}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 48, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                        <div style={{
                          width: `${col.null_pct}%`, height: '100%',
                          background: col.null_pct > 30 ? '#f43f5e' : col.null_pct > 10 ? '#f59e0b' : '#10b981',
                          borderRadius: 999,
                        }} />
                      </div>
                      <span>{col.null_pct}%</span>
                    </div>
                  </td>
                  <td>{col.unique_count.toLocaleString()}</td>
                  <td className="sample-vals">
                    {col.sample_values.slice(0, 3).map((v, j) => (
                      <span key={j} className="sample-chip">{String(v).slice(0, 20)}</span>
                    ))}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="overview-root">
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="metric-card">
            <div className="skeleton" style={{ height: 16, width: 60 }} />
            <div className="skeleton" style={{ height: 36, width: 80, marginTop: 8 }} />
            <div className="skeleton" style={{ height: 12, width: 100, marginTop: 4 }} />
          </div>
        ))}
      </div>
      <div className="skeleton glass-card" style={{ height: 80 }} />
      <div className="skeleton glass-card" style={{ height: 300, marginTop: 20 }} />
    </div>
  )
}
