import { motion } from 'framer-motion'
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'overview',      icon: '📊', label: 'Overview' },
  { id: 'distributions', icon: '📈', label: 'Distributions' },
  { id: 'correlation',   icon: '🔗', label: 'Correlation' },
  { id: 'outliers',      icon: '🎯', label: 'Outliers' },
  { id: 'quality',       icon: '🧹', label: 'Data Quality' },
  { id: 'editor',        icon: '✏️', label: 'Data Editor' },
  { id: 'ai',            icon: '🤖', label: 'AI Insights' },
]

export default function Sidebar({ active, onSelect, session, onReset }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">E</div>
        <span className="sidebar-logo-text">Explo<span>lysis</span></span>
      </div>

      {/* Dataset info */}
      {session && (
        <div className="sidebar-dataset">
          <div className="sidebar-dataset-name" title={session.filename}>
            📁 {session.filename}
          </div>
          <div className="sidebar-dataset-meta">
            {session.rows.toLocaleString()} rows · {session.columns} cols · {session.size_mb} MB
          </div>
        </div>
      )}

      {/* Nav */}
      <p className="sidebar-section-label">Analysis</p>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <motion.button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.12 }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {active === item.id && (
              <motion.div
                className="nav-indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="sidebar-footer">
        <button
          className="sidebar-reset-btn"
          id="sidebar-upload-new-btn"
          onClick={onReset}
        >
          ↑ Upload New Dataset
        </button>
      </div>
    </aside>
  )
}
