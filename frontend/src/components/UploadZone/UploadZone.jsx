import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import './UploadZone.css'

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/json': ['.json'],
}

const MAX_SIZE = 50 * 1024 * 1024

export default function UploadZone({ onUpload, uploading, progress }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) onUpload(acceptedFiles[0])
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: uploading,
  })

  const rejection = fileRejections[0]?.errors[0]

  return (
    <div className="upload-container">
      <motion.div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        whileHover={{ scale: uploading ? 1 : 1.005 }}
        transition={{ duration: 0.2 }}
        id="upload-zone"
      >
        <input {...getInputProps()} id="file-input" />

        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="upload-state"
            >
              <div className="upload-spinner" />
              <p className="upload-label">Processing your dataset…</p>
              <div className="upload-progress">
                <div className="progress-bar" style={{ width: '100%' }}>
                  <motion.div
                    className="progress-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="upload-pct">{progress}%</span>
              </div>
            </motion.div>
          ) : isDragActive ? (
            <motion.div
              key="drag"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="upload-state"
            >
              <div className="upload-icon drag">📂</div>
              <p className="upload-label">Drop it to analyze!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="upload-state"
            >
              <div className="upload-icon-wrapper">
                <motion.div
                  className="upload-icon"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  ⬆️
                </motion.div>
                <div className="upload-icon-ring" />
              </div>
              <p className="upload-title">Drop your dataset here</p>
              <p className="upload-subtitle">or <span className="upload-link">click to browse</span></p>
              <div className="upload-formats">
                {['CSV', 'Excel', 'JSON'].map(f => (
                  <span key={f} className="format-badge">{f}</span>
                ))}
                <span className="upload-limit">max 50MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {rejection && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="upload-error"
        >
          ⚠ {rejection.message}
        </motion.p>
      )}
    </div>
  )
}
