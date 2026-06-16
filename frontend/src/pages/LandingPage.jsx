import { motion } from 'framer-motion'
import UploadZone from '../components/UploadZone/UploadZone'
import './LandingPage.css'

const FEATURES = [
  { icon: '📊', title: 'Interactive Charts', desc: 'Plotly-powered visualizations you can zoom, pan, and export as PNG' },
  { icon: '🤖', title: 'AI Analyst', desc: 'Gemini-powered insights: findings, anomalies & ML recommendations' },
  { icon: '🔗', title: 'Correlation Matrix', desc: 'Pearson, Spearman & Kendall with annotated heatmaps' },
  { icon: '🎯', title: 'Outlier Detection', desc: 'IQR and Z-score methods with flagged row previews' },
  { icon: '🧹', title: 'Data Quality', desc: 'Missing values, duplicates, and high-cardinality warnings' },
  { icon: '⚡', title: 'Fast & Async', desc: 'FastAPI + Polars backend handles large files in seconds' },
]

const SAMPLE_DATASETS = [
  { name: 'Titanic', emoji: '🚢', desc: 'Passenger survival data', file: 'titanic.csv' },
  { name: 'Iris', emoji: '🌸', desc: 'Flower measurements', file: 'iris.csv' },
  { name: 'Housing', emoji: '🏠', desc: 'Boston housing prices', file: 'housing.csv' },
]

const STATS = [
  { value: '50MB', label: 'Max File Size' },
  { value: '6+', label: 'Analysis Views' },
  { value: 'AI', label: 'Gemini Insights' },
  { value: '3', label: 'File Formats' },
]

export default function LandingPage({ datasetState }) {
  const { upload, uploading, uploadProgress } = datasetState

  return (
    <div className="landing-root">
      {/* Background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      {/* Header */}
      <motion.header
        className="landing-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="landing-logo">
          <div className="logo-mark">E</div>
          <span className="logo-text">Explo<span>lysis</span></span>
        </div>
        <div className="header-badges">
          <span className="badge badge-yellow">✦ AI-Powered</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="header-github-btn"
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </motion.header>

      {/* Hero */}
      <main className="landing-main">
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-pill">
              <span className="hero-eyebrow-dot" />
              Powered by Gemini AI
            </span>
          </div>

          <h1 className="hero-title">
            Automated EDA,<br />
            <span className="highlight">Zero Code Required.</span>
          </h1>

          <p className="hero-subtitle">
            Upload any CSV, Excel, or JSON file and instantly get
            interactive visualizations, statistical analysis, and
            AI-generated insights — all in your browser.
          </p>

          {/* Upload Zone */}
          <div className="hero-upload">
            <UploadZone
              onUpload={upload}
              uploading={uploading}
              progress={uploadProgress}
            />
          </div>

          {/* Sample datasets */}
          <div className="sample-section">
            <p className="sample-label">No dataset? Try a sample:</p>
            <div className="sample-chips">
              {SAMPLE_DATASETS.map(ds => (
                <a
                  key={ds.name}
                  href={`#sample-${ds.file}`}
                  className="sample-chip-btn"
                  title={ds.desc}
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      const res = await fetch(`/samples/${ds.file}`)
                      const blob = await res.blob()
                      const file = new File([blob], ds.file, { type: 'text/csv' })
                      upload(file)
                    } catch {
                      // silently fail if samples not present
                    }
                  }}
                >
                  {ds.emoji} {ds.name}
                </a>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {STATS.map((s, i) => (
              <div key={s.label} style={{ display: 'contents' }}>
                {i > 0 && <div className="hero-stat-divider" />}
                <div className="hero-stat">
                  <div className="hero-stat-value">{s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Feature cards */}
        <motion.section
          className="features-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="features-eyebrow">✦ What you get</p>
          <h2 className="features-title">Everything to understand your data</h2>
          <p className="features-sub">Six powerful analysis modules, all in one place.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="feature-icon-wrap">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stack strip */}
        <motion.div
          className="stack-strip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="stack-label">Built with</p>
          <div className="stack-pills">
            {['FastAPI', 'Polars', 'Plotly.js', 'React', 'Gemini AI', 'Vite'].map(t => (
              <span key={t} className="stack-pill">{t}</span>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
