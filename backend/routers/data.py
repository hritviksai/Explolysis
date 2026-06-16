import json
from fastapi import APIRouter, HTTPException, Body
from services.data_parser import load_session_pandas, SESSION_DIR
import pandas as pd
import numpy as np
from pathlib import Path

router = APIRouter(prefix="/api/data", tags=["data"])


def _safe_val(v):
    """Convert pandas/numpy value to a JSON-safe Python type."""
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if hasattr(v, 'isoformat'):   # datetime
        return v.isoformat()
    return str(v) if not isinstance(v, (int, float, bool, str)) else v


@router.get("/{session_id}")
async def get_data(session_id: str, page: int = 1, page_size: int = 50):
    """Return a paginated slice of the dataset as rows + column metadata."""
    try:
        df = load_session_pandas(session_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

    total_rows = len(df)
    total_pages = max(1, (total_rows + page_size - 1) // page_size)
    start = (page - 1) * page_size
    end = min(start + page_size, total_rows)

    slice_df = df.iloc[start:end]
    rows = []
    for i, row in slice_df.iterrows():
        rows.append({
            "_row_index": int(i),
            **{col: _safe_val(row[col]) for col in df.columns}
        })

    columns = [
        {"name": col, "dtype": str(df[col].dtype)}
        for col in df.columns
    ]

    return {
        "columns": columns,
        "rows": rows,
        "total_rows": total_rows,
        "total_pages": total_pages,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/{session_id}/cell")
async def update_cell(
    session_id: str,
    payload: dict = Body(...)
):
    """Update a single cell in the dataset. Payload: {row_index, column, value}"""
    row_index = payload.get("row_index")
    column = payload.get("column")
    value = payload.get("value")

    if row_index is None or column is None:
        raise HTTPException(status_code=400, detail="row_index and column are required")

    parquet_path = SESSION_DIR / session_id / "data.parquet"
    if not parquet_path.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        df = load_session_pandas(session_id)

        if column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{column}' not found")
        if row_index not in df.index:
            raise HTTPException(status_code=400, detail=f"Row index {row_index} not found")

        # Attempt type coercion
        original_dtype = df[column].dtype
        try:
            if pd.api.types.is_numeric_dtype(original_dtype):
                value = float(value) if '.' in str(value) else int(value)
            elif pd.api.types.is_bool_dtype(original_dtype):
                value = str(value).lower() in ('true', '1', 'yes')
        except Exception:
            pass  # keep as string

        df.at[row_index, column] = value
        df.to_parquet(parquet_path, index=False)

        return {
            "success": True,
            "row_index": row_index,
            "column": column,
            "new_value": _safe_val(df.at[row_index, column]),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/aggregate")
async def compute_aggregate(
    session_id: str,
    column: str,
    operation: str = "sum",
    row_start: int = None,
    row_end: int = None,
):
    """Compute an aggregate (sum/mean/min/max/count/median/std) for a column slice."""
    try:
        df = load_session_pandas(session_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")

    if column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{column}' not found")

    series = df[column]
    if row_start is not None and row_end is not None:
        series = series.iloc[row_start:row_end + 1]

    series_num = pd.to_numeric(series, errors='coerce').dropna()

    OPS = {
        "sum":    lambda s: float(s.sum()),
        "mean":   lambda s: float(s.mean()),
        "min":    lambda s: float(s.min()),
        "max":    lambda s: float(s.max()),
        "count":  lambda s: int(len(series)),
        "median": lambda s: float(s.median()),
        "std":    lambda s: float(s.std()),
        "unique": lambda s: int(series.nunique()),
    }

    if operation not in OPS:
        raise HTTPException(status_code=400, detail=f"Unknown operation '{operation}'")

    try:
        result = OPS[operation](series_num)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot compute {operation} on this column: {e}")

    return {
        "column": column,
        "operation": operation,
        "result": result,
        "row_range": [row_start, row_end] if row_start is not None else None,
    }
