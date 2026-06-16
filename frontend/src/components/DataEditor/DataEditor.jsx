import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchTableData, updateCell, fetchAggregate } from '../../utils/api'
import './DataEditor.css'

const OPERATIONS = ['sum', 'mean', 'min', 'max', 'median', 'std', 'count', 'unique']

export default function DataEditor({ sessionId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Cell editing
  const [editingCell, setEditingCell] = useState(null) // { rowIndex, column }
  const [editValue, setEditValue] = useState('')
  const [savingCell, setSavingCell] = useState(null)
  const [saveMsg, setSaveMsg] = useState(null)
  const inputRef = useRef(null)

  // Aggregate calculator
  const [aggColumn, setAggColumn] = useState('')
  const [aggOp, setAggOp] = useState('sum')
  const [aggRowStart, setAggRowStart] = useState('')
  const [aggRowEnd, setAggRowEnd] = useState('')
  const [aggResult, setAggResult] = useState(null)
  const [aggLoading, setAggLoading] = useState(false)

  const loadPage = useCallback(async (p) => {
    setLoading(true)
    try {
      const res = await fetchTableData(sessionId, p, pageSize)
      setData(res)
      if (!aggColumn && res.columns.length > 0) {
        setAggColumn(res.columns[0].name)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { loadPage(page) }, [page, loadPage])

  // Auto-focus the input when a cell becomes editable
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  const startEdit = (rowIndex, column, currentValue) => {
    setEditingCell({ rowIndex, column })
    setEditValue(currentValue === null || currentValue === undefined ? '' : String(currentValue))
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const commitEdit = async () => {
    if (!editingCell) return
    const { rowIndex, column } = editingCell
    setSavingCell({ rowIndex, column })
    setEditingCell(null)
    try {
      await updateCell(sessionId, rowIndex, column, editValue)
      // Update local state immediately
      setData(prev => ({
        ...prev,
        rows: prev.rows.map(r =>
          r._row_index === rowIndex ? { ...r, [column]: editValue } : r
        )
      }))
      setSaveMsg({ type: 'ok', text: `Saved ${column}[${rowIndex}]` })
    } catch (e) {
      setSaveMsg({ type: 'err', text: e.message || 'Save failed' })
    } finally {
      setSavingCell(null)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const runAggregate = async () => {
    if (!aggColumn) return
    setAggLoading(true)
    setAggResult(null)
    try {
      const rs = aggRowStart !== '' ? parseInt(aggRowStart) : null
      const re = aggRowEnd !== '' ? parseInt(aggRowEnd) : null
      const res = await fetchAggregate(sessionId, aggColumn, aggOp, rs, re)
      setAggResult(res)
    } catch (e) {
      setAggResult({ error: e.message })
    } finally {
      setAggLoading(false)
    }
  }

  const formatCell = (v) => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'number') {
      return Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(6)).toString()
    }
    return String(v)
  }

  if (loading && !data) {
    return (
      <div className="de-loading">
        <div className="de-spinner" />
        <span>Loading data…</span>
      </div>
    )
  }

  const columns = data?.columns || []
  const rows = data?.rows || []

  return (
    <div className="de-root">
      {/* Toolbar */}
      <div className="de-toolbar">
        <div className="de-toolbar-left">
          <span className="de-info">
            <strong>{data?.total_rows?.toLocaleString()}</strong> rows ·{' '}
            <strong>{columns.length}</strong> columns
          </span>
          <span className="de-info-sub">Click any cell to edit · Enter to save · Esc to cancel</span>
        </div>
        {saveMsg && (
          <div className={`de-save-msg ${saveMsg.type}`}>
            {saveMsg.type === 'ok' ? '✓' : '✕'} {saveMsg.text}
          </div>
        )}
      </div>

      {/* Aggregate Calculator */}
      <div className="de-calc-panel">
        <div className="de-calc-title">
          <span className="de-calc-icon">∑</span>
          Formula Calculator
        </div>
        <div className="de-calc-row">
          <div className="de-calc-field">
            <label>Column</label>
            <select
              value={aggColumn}
              onChange={e => setAggColumn(e.target.value)}
              className="de-select"
            >
              {columns.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="de-calc-field">
            <label>Operation</label>
            <select
              value={aggOp}
              onChange={e => setAggOp(e.target.value)}
              className="de-select"
            >
              {OPERATIONS.map(op => (
                <option key={op} value={op}>{op.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="de-calc-field">
            <label>Row From (optional)</label>
            <input
              type="number"
              placeholder="0"
              value={aggRowStart}
              onChange={e => setAggRowStart(e.target.value)}
              className="de-input"
            />
          </div>
          <div className="de-calc-field">
            <label>Row To (optional)</label>
            <input
              type="number"
              placeholder="end"
              value={aggRowEnd}
              onChange={e => setAggRowEnd(e.target.value)}
              className="de-input"
            />
          </div>
          <button
            className="de-calc-btn"
            onClick={runAggregate}
            disabled={aggLoading || !aggColumn}
          >
            {aggLoading ? '…' : '= Calculate'}
          </button>
        </div>

        {aggResult && (
          <div className="de-calc-result">
            {aggResult.error ? (
              <span className="de-result-error">Error: {aggResult.error}</span>
            ) : (
              <span className="de-result-value">
                <span className="de-result-formula">
                  {aggResult.operation.toUpperCase()}({aggResult.column}
                  {aggResult.row_range ? `, rows ${aggResult.row_range[0]}–${aggResult.row_range[1]}` : ''})
                </span>
                <span className="de-result-eq">=</span>
                <span className="de-result-num">
                  {typeof aggResult.result === 'number'
                    ? aggResult.result.toLocaleString(undefined, { maximumFractionDigits: 6 })
                    : aggResult.result}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="de-table-wrapper">
        {loading && <div className="de-table-overlay"><div className="de-spinner" /></div>}
        <table className="de-table">
          <thead>
            <tr>
              <th className="de-th de-th-idx">#</th>
              {columns.map(col => (
                <th key={col.name} className="de-th" title={`${col.name} [${col.dtype}]`}>
                  <span className="de-col-name">{col.name}</span>
                  <span className="de-col-dtype">{col.dtype}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row._row_index} className="de-tr">
                <td className="de-td de-td-idx">{row._row_index}</td>
                {columns.map(col => {
                  const isEditing = editingCell?.rowIndex === row._row_index && editingCell?.column === col.name
                  const isSaving = savingCell?.rowIndex === row._row_index && savingCell?.column === col.name
                  const rawVal = row[col.name]
                  const displayVal = formatCell(rawVal)

                  return (
                    <td
                      key={col.name}
                      className={`de-td ${isEditing ? 'editing' : ''} ${isSaving ? 'saving' : ''}`}
                      onClick={() => !isEditing && startEdit(row._row_index, col.name, rawVal)}
                      title="Click to edit"
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          className="de-cell-input"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={commitEdit}
                        />
                      ) : isSaving ? (
                        <span className="de-cell-saving">…</span>
                      ) : (
                        <span className="de-cell-text" title={displayVal}>
                          {displayVal === '' ? <span className="de-null">null</span> : displayVal}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="de-pagination">
        <button
          className="de-page-btn"
          onClick={() => setPage(1)}
          disabled={page === 1 || loading}
        >«</button>
        <button
          className="de-page-btn"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >‹ Prev</button>
        <span className="de-page-info">
          Page <strong>{page}</strong> of <strong>{data?.total_pages || 1}</strong>
        </span>
        <button
          className="de-page-btn"
          onClick={() => setPage(p => Math.min(data?.total_pages || 1, p + 1))}
          disabled={page === data?.total_pages || loading}
        >Next ›</button>
        <button
          className="de-page-btn"
          onClick={() => setPage(data?.total_pages || 1)}
          disabled={page === data?.total_pages || loading}
        >»</button>
      </div>
    </div>
  )
}
