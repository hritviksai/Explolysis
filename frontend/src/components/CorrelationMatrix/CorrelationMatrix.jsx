import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCorrelation } from '../../hooks/useAnalysis'
import ChartPanel from '../ChartPanel/ChartPanel'

const METHODS = ['pearson', 'spearman', 'kendall']

export default function CorrelationMatrix({ sessionId }) {
  const [method, setMethod] = useState('pearson')
  const { data, isLoading, error } = useCorrelation(sessionId, method)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header + Method toggle */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🔗</span>
            Correlation Matrix
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {METHODS.map(m => (
              <button
                key={m}
                id={`corr-method-${m}`}
                className={`btn btn-sm ${method === m ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMethod(m)}
                style={{ textTransform: 'capitalize' }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 8 }}>
          Measures pairwise linear relationships between numeric columns. Values range from −1 (inverse) to +1 (direct).
        </p>
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: 20 }}>
        <ChartPanel
          figure={data?.figure}
          loading={isLoading}
          error={error?.message}
          height={480}
        />
      </div>

      {/* Top correlated pairs */}
      {data?.top_pairs && data.top_pairs.length > 0 && (
        <motion.div
          className="glass-card"
          style={{ padding: '20px 24px' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="section-title" style={{ marginBottom: 14 }}>
            <span className="section-icon">🔥</span>
            Top Correlated Pairs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.top_pairs.slice(0, 8).map((pair, i) => {
              const abs = Math.abs(pair.correlation)
              const color = abs > 0.7 ? '#f43f5e' : abs > 0.4 ? '#f59e0b' : '#10b981'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', width: 20 }}>#{i + 1}</span>
                  <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.82rem' }}>{pair.col1}</span>
                    <span style={{ color: '#475569' }}>↔</span>
                    <span style={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: '0.82rem' }}>{pair.col2}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                      <div style={{
                        width: `${abs * 100}%`, height: '100%',
                        background: color, borderRadius: 999,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color, fontWeight: 700, minWidth: 48 }}>
                      {pair.correlation.toFixed(3)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
