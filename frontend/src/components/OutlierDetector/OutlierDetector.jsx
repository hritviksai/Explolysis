import { useState } from 'react'
import { motion } from 'framer-motion'
import { useOutliers } from '../../hooks/useAnalysis'
import ChartPanel from '../ChartPanel/ChartPanel'

const METHODS = [
  { id: 'iqr', label: 'IQR Method', desc: 'Values outside 1.5×IQR from Q1/Q3' },
  { id: 'zscore', label: 'Z-Score', desc: 'Values with |z| > 3 standard deviations' },
]

export default function OutlierDetector({ sessionId }) {
  const [method, setMethod] = useState('iqr')
  const { data, isLoading, error } = useOutliers(sessionId, method)

  const totalOutliers = data?.summary?.reduce((sum, r) => sum + r.outlier_count, 0) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🎯</span>
            Outlier Detection
            {totalOutliers > 0 && (
              <span className="badge badge-rose" style={{ marginLeft: 8 }}>
                {totalOutliers} outliers
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {METHODS.map(m => (
              <button
                key={m.id}
                id={`outlier-method-${m.id}`}
                className={`btn btn-sm ${method === m.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMethod(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 8 }}>
          {METHODS.find(m => m.id === method)?.desc}
        </p>
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: 20 }}>
        <ChartPanel
          figure={data?.figure}
          loading={isLoading}
          error={error?.message}
          height={400}
        />
      </div>

      {/* Summary table */}
      {data?.summary && data.summary.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '20px 24px' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-title" style={{ marginBottom: 14 }}>
            <span className="section-icon">📊</span>
            Outlier Summary by Column
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Outlier Count</th>
                <th>Outlier %</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {data.summary.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>{row.column}</td>
                  <td>{row.outlier_count.toLocaleString()}</td>
                  <td>{row.outlier_pct}%</td>
                  <td>
                    <span className={`badge ${
                      row.outlier_pct > 10 ? 'badge-rose' :
                      row.outlier_pct > 3  ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {row.outlier_pct > 10 ? '🔴 High' : row.outlier_pct > 3 ? '🟡 Medium' : '🟢 Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Outlier rows preview */}
      {data?.outlier_rows && data.outlier_rows.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '20px 24px' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-title" style={{ marginBottom: 14 }}>
            <span className="section-icon">🔎</span>
            Flagged Rows Preview
            <span className="badge badge-rose" style={{ marginLeft: 8 }}>
              {data.outlier_rows.length} shown
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(data.outlier_rows[0] || {}).slice(0, 8).map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.outlier_rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).slice(0, 8).map((val, j) => (
                      <td key={j}>{String(val ?? '—').slice(0, 30)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
