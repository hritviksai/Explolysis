import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

export const uploadDataset = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  return res.data
}

export const fetchOverview = async (sessionId) => {
  const res = await api.get(`/api/analysis/overview/${sessionId}`)
  return res.data
}

export const fetchDistribution = async (sessionId, column) => {
  const res = await api.get(`/api/analysis/distribution/${sessionId}`, {
    params: { column },
  })
  return res.data
}

export const fetchCorrelation = async (sessionId, method = 'pearson') => {
  const res = await api.get(`/api/analysis/correlation/${sessionId}`, {
    params: { method },
  })
  return res.data
}

export const fetchOutliers = async (sessionId, method = 'iqr') => {
  const res = await api.get(`/api/analysis/outliers/${sessionId}`, {
    params: { method },
  })
  return res.data
}

export const fetchQuality = async (sessionId) => {
  const res = await api.get(`/api/analysis/quality/${sessionId}`)
  return res.data
}

export const streamInsights = (sessionId, onChunk, onDone, onError) => {
  const url = `${API_BASE}/api/ai/insights/${sessionId}`
  const evtSource = new EventSource(url)

  evtSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.done) {
        onDone?.()
        evtSource.close()
      } else if (data.error) {
        onError?.(data.error)
        evtSource.close()
      } else if (data.text) {
        onChunk(data.text)
      }
    } catch (err) {
      console.error('SSE parse error', err)
    }
  }

  evtSource.onerror = (e) => {
    onError?.('Connection error')
    evtSource.close()
  }

  return () => evtSource.close()
}

export const fetchTableData = async (sessionId, page = 1, pageSize = 50) => {
  const res = await api.get(`/api/data/${sessionId}`, {
    params: { page, page_size: pageSize },
  })
  return res.data
}

export const updateCell = async (sessionId, rowIndex, column, value) => {
  const res = await api.patch(`/api/data/${sessionId}/cell`, {
    row_index: rowIndex,
    column,
    value,
  })
  return res.data
}

export const fetchAggregate = async (sessionId, column, operation, rowStart = null, rowEnd = null) => {
  const params = { column, operation }
  if (rowStart !== null) params.row_start = rowStart
  if (rowEnd !== null) params.row_end = rowEnd
  const res = await api.get(`/api/data/${sessionId}/aggregate`, { params })
  return res.data
}

export default api
