import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamInsights } from '../../utils/api'
import './AIInsights.css'

export default function AIInsights({ sessionId }) {
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [isRateLimit, setIsRateLimit] = useState(false)
  const scrollRef = useRef(null)
  const cleanupRef = useRef(null)

  const startStream = () => {
    // Cancel any existing stream
    if (cleanupRef.current) cleanupRef.current()

    setContent('')
    setDone(false)
    setError(null)
    setIsRateLimit(false)
    setStreaming(true)

    const cleanup = streamInsights(
      sessionId,
      (chunk) => {
        setContent(prev => {
          const next = prev + chunk
          // Detect if Gemini returned a rate-limit error embedded in content
          if (next.includes('RESOURCE_EXHAUSTED') || next.includes('429')) {
            setIsRateLimit(true)
          }
          return next
        })
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        })
      },
      () => { setStreaming(false); setDone(true) },
      (err) => { setStreaming(false); setError(err) }
    )

    cleanupRef.current = cleanup
    return cleanup
  }

  useEffect(() => {
    if (!sessionId) return
    const cleanup = startStream()
    return () => { if (cleanup) cleanup() }
  }, [sessionId])

  // Strip raw error JSON from rendered content
  const cleanContent = content
    .replace(/AI analysis error:.*?\n/gs, '')
    .replace(/\{"error".*?\}/gs, '')
    .trim()

  return (
    <div className="ai-root">
      {/* Header */}
      <div className="glass-card ai-header">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div className="section-title">
            <span className="section-icon">🤖</span>
            AI Analyst
            {streaming && !isRateLimit && (
              <span className="ai-live-badge">
                <span className="ai-live-dot" />
                LIVE
              </span>
            )}
            {done && !isRateLimit && (
              <span className="badge badge-emerald">✓ Complete</span>
            )}
            {isRateLimit && (
              <span className="badge badge-yellow">⚠ Rate Limited</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(done || isRateLimit) && (
              <button
                id="ai-regenerate-btn"
                className="btn btn-gold-outline btn-sm"
                onClick={startStream}
              >
                ↻ Regenerate
              </button>
            )}
            {streaming && (
              <button
                id="ai-stop-btn"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (cleanupRef.current) cleanupRef.current()
                  setStreaming(false)
                  setDone(true)
                }}
              >
                ◼ Stop
              </button>
            )}
            <span className="badge badge-yellow">Gemini 2.0 Flash</span>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
          AI-generated analysis of your dataset — key findings, quality assessment, and ML readiness.
        </p>

        {isRateLimit && (
          <div className="ai-rate-limit-notice" style={{ marginTop: 12 }}>
            <span className="notice-icon">⏳</span>
            <span>
              Gemini API rate limit reached (free tier: 15 req/min). The <strong>rule-based analysis below is still fully accurate</strong>. Wait 60 seconds then click <strong>Regenerate</strong> for AI insights.
            </span>
          </div>
        )}
      </div>

      {/* Streaming content */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card ai-error"
          >
            <span className="ai-error-icon">⚠️</span>
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={startStream}>Try Again</button>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="glass-card ai-content-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {!content && streaming && (
              <div className="ai-thinking">
                <div className="thinking-dots">
                  <span /><span /><span />
                </div>
                <p className="ai-thinking-label">Analyzing your dataset with Gemini…</p>
              </div>
            )}

            {!content && !streaming && !error && (
              <div className="ai-thinking">
                <div className="thinking-dots">
                  <span /><span /><span />
                </div>
                <p className="ai-thinking-label">Starting analysis…</p>
              </div>
            )}

            {cleanContent && (
              <div ref={scrollRef} className="ai-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cleanContent}
                </ReactMarkdown>
                {streaming && !isRateLimit && <span className="cursor-blink">▌</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
