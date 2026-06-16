import { motion } from 'framer-motion'
import { useQuality } from '../../hooks/useAnalysis'
import ChartPanel from '../ChartPanel/ChartPanel'

function QualityAlert({ icon, title, items, badge, color }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{
      padding: '14px 18px',
      background: `rgba(${color}, 0.06)`,
      border: `1px solid rgba(${color}, 0.18)`,
      borderRadius: 12,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.88rem', marginBottom: 4 }}>{title}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {items.slice(0, 8).map((item, i) => (
            <span key={i} className="sample-chip">{typeof item === 'string' ? item : item.column}</span>
          ))}
          {items.length > 8 && <span style={{ fontSize: '0.72rem', color: '#475569' }}>+{items.length - 8} more</span>}
        </div>
      </div>
    </div>
  )
}

export default function DataQuality({ sessionId }) {
  const { data, isLoading, error } = useQuality(sessionId)

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton glass-card" style={{ height: 120 }} />
      ))}
    </div>
  )

  if (error) return <p style={{ color: '#fb7185' }}>⚠ {error.message}</p>
  if (!data) return null

  const hasIssues = data.missing_by_column.length > 0 ||
    data.duplicate_rows > 0 ||
    data.constant_columns.length > 0 ||
    data.high_cardinality_columns.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header summary */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="section-title">
            <span className="section-icon">🧹</span>
            Data Quality Report
          </div>
          <span className={`badge ${hasIssues ? 'badge-amber' : 'badge-emerald'}`}>
            {hasIssues ? '⚠ Issues Found' : '✓ Looking Good'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QualityAlert
            icon="❓"
            title={`${data.missing_by_column.length} columns have missing values`}
            items={data.missing_by_column}
            color="245,158,11"
          />
          {data.duplicate_rows > 0 && (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.18)',
              borderRadius: 12,
            }}>
              <p style={{ fontWeight: 600, color: '#fb7185', fontSize: '0.88rem' }}>
                🔁 {data.duplicate_rows.toLocaleString()} duplicate rows detected
              </p>
            </div>
          )}
          <QualityAlert
            icon="📌"
            title="Constant / zero-variance columns (consider dropping)"
            items={data.constant_columns}
            color="99,102,241"
          />
          <QualityAlert
            icon="🔢"
            title="High-cardinality categorical columns (>50% unique values)"
            items={data.high_cardinality_columns}
            color="6,182,212"
          />
          {!hasIssues && (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.18)',
              borderRadius: 12,
            }}>
              <p style={{ fontWeight: 600, color: '#34d399', fontSize: '0.88rem' }}>
                ✅ No major data quality issues detected. Your dataset is clean!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Missing data chart */}
      {data.missing_by_column.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: 20 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-title" style={{ marginBottom: 12 }}>
            <span className="section-icon">❓</span>
            Missing Data by Column
          </div>
          <ChartPanel
            figure={data.missing_figure}
            loading={false}
            height={Math.max(300, data.missing_by_column.length * 36 + 80)}
          />
        </motion.div>
      )}

      {/* Missing details table */}
      {data.missing_by_column.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '20px 24px' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="section-title" style={{ marginBottom: 14 }}>
            <span className="section-icon">📋</span>
            Missing Values Detail
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Missing Count</th>
                <th>Missing %</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {data.missing_by_column.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>{row.column}</td>
                  <td>{row.missing_count.toLocaleString()}</td>
                  <td>{row.missing_pct}%</td>
                  <td>
                    <span className={`badge ${
                      row.missing_pct > 50 ? 'badge-rose' :
                      row.missing_pct > 20 ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {row.missing_pct > 50 ? 'Consider dropping' :
                       row.missing_pct > 20 ? 'Impute or drop'   : 'Safe to impute'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
