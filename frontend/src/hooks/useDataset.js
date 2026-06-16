import { useState, useCallback } from 'react'
import { uploadDataset } from '../utils/api'
import toast from 'react-hot-toast'

export function useDataset() {
  const [session, setSession] = useState(null)  // { session_id, filename, rows, columns, ... }
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const upload = useCallback(async (file) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const result = await uploadDataset(file, setUploadProgress)
      setSession(result)
      toast.success(`✓ ${result.filename} loaded — ${result.rows.toLocaleString()} rows`)
      return result
    } catch (err) {
      toast.error(err.message || 'Upload failed')
      throw err
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const reset = useCallback(() => {
    setSession(null)
    setUploadProgress(0)
  }, [])

  return { session, upload, uploading, uploadProgress, reset }
}
