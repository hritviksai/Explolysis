import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar'
import DataOverview from '../components/DataOverview/DataOverview'
import DistributionExplorer from '../components/DistributionExplorer/DistributionExplorer'
import CorrelationMatrix from '../components/CorrelationMatrix/CorrelationMatrix'
import OutlierDetector from '../components/OutlierDetector/OutlierDetector'
import DataQuality from '../components/DataQuality/DataQuality'
import AIInsights from '../components/AIInsights/AIInsights'
import DataEditor from '../components/DataEditor/DataEditor'
import './Dashboard.css'

const SECTION_TITLES = {
  overview:      { title: 'Dataset Overview',      sub: 'Key statistics and column-level summary' },
  distributions: { title: 'Distribution Explorer', sub: 'Interactive per-column distribution analysis' },
  correlation:   { title: 'Correlation Matrix',    sub: 'Pairwise linear relationships between features' },
  outliers:      { title: 'Outlier Detection',     sub: 'Identify anomalies using IQR or Z-score' },
  quality:       { title: 'Data Quality Report',   sub: 'Missing values, duplicates, and column health' },
  editor:        { title: 'Data Editor',           sub: 'View, edit cells, and calculate aggregates on your dataset' },
  ai:            { title: 'AI Insights',           sub: 'AI-generated analysis powered by Gemini 2.0 Flash' },
}

export default function Dashboard({ datasetState }) {
  const [activeSection, setActiveSection] = useState('overview')
  const navigate = useNavigate()
  const { session, reset } = datasetState

  const handleReset = () => {
    reset()
    navigate('/')
  }

  const { title, sub } = SECTION_TITLES[activeSection] || {}

  return (
    <div className="dashboard-root">
      <Sidebar
        active={activeSection}
        onSelect={setActiveSection}
        session={session}
        onReset={handleReset}
      />

      <div className="dashboard-content">
        {/* Page header */}
        <motion.div
          className="dashboard-header"
          key={activeSection + '-header'}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-sub">{sub}</p>
          </div>
          <div className="dashboard-meta">
            <span className="badge badge-indigo">{session?.filename}</span>
            <span className="badge badge-cyan">{session?.rows?.toLocaleString()} rows</span>
          </div>
        </motion.div>

        {/* Main content area */}
        <div className="dashboard-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === 'overview'      && <DataOverview         sessionId={session?.session_id} />}
              {activeSection === 'distributions' && <DistributionExplorer sessionId={session?.session_id} />}
              {activeSection === 'correlation'   && <CorrelationMatrix    sessionId={session?.session_id} />}
              {activeSection === 'outliers'      && <OutlierDetector      sessionId={session?.session_id} />}
              {activeSection === 'quality'       && <DataQuality          sessionId={session?.session_id} />}
              {activeSection === 'editor'        && <DataEditor           sessionId={session?.session_id} />}
              {activeSection === 'ai'            && <AIInsights           sessionId={session?.session_id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
