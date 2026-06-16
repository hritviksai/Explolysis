import os
import uuid
import chardet
import pandas as pd
import polars as pl
from pathlib import Path
from fastapi import UploadFile

SESSION_DIR = Path("sessions")
SESSION_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def _detect_encoding(raw_bytes: bytes) -> str:
    result = chardet.detect(raw_bytes[:10000])
    return result.get("encoding", "utf-8") or "utf-8"


async def parse_and_store(file: UploadFile) -> dict:
    """Parse uploaded file, store as parquet, return session metadata."""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File exceeds 50MB limit.")

    session_id = str(uuid.uuid4())
    session_path = SESSION_DIR / session_id
    session_path.mkdir(parents=True, exist_ok=True)

    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()

    # Parse to pandas first (wider format support)
    if ext == ".csv":
        encoding = _detect_encoding(content)
        import io
        df_pd = pd.read_csv(io.BytesIO(content), encoding=encoding, low_memory=False)
    elif ext in (".xlsx", ".xls"):
        import io
        df_pd = pd.read_excel(io.BytesIO(content))
    elif ext == ".json":
        import io
        df_pd = pd.read_json(io.BytesIO(content))
    else:
        raise ValueError(f"Unsupported file type: {ext}. Use CSV, Excel, or JSON.")

    # Store as parquet for fast reads
    parquet_path = session_path / "data.parquet"
    df_pd.to_parquet(parquet_path, index=False)

    # Store metadata
    size_mb = round(len(content) / (1024 * 1024), 3)

    return {
        "session_id": session_id,
        "filename": filename,
        "rows": len(df_pd),
        "columns": len(df_pd.columns),
        "size_mb": size_mb,
        "file_type": ext.lstrip("."),
        "parquet_path": str(parquet_path),
    }


def load_session(session_id: str) -> pl.DataFrame:
    """Load a session's DataFrame using Polars."""
    parquet_path = SESSION_DIR / session_id / "data.parquet"
    if not parquet_path.exists():
        raise FileNotFoundError(f"Session {session_id} not found or expired.")
    return pl.read_parquet(parquet_path)


def load_session_pandas(session_id: str) -> pd.DataFrame:
    """Load a session's DataFrame using Pandas."""
    parquet_path = SESSION_DIR / session_id / "data.parquet"
    if not parquet_path.exists():
        raise FileNotFoundError(f"Session {session_id} not found or expired.")
    return pd.read_parquet(parquet_path)
