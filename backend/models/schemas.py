from pydantic import BaseModel
from typing import Any, Optional


class UploadResponse(BaseModel):
    session_id: str
    filename: str
    rows: int
    columns: int
    size_mb: float
    file_type: str


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    category: str  # numeric, categorical, datetime, boolean, text
    null_count: int
    null_pct: float
    unique_count: int
    sample_values: list[Any]


class OverviewResponse(BaseModel):
    session_id: str
    rows: int
    columns: int
    memory_mb: float
    duplicate_rows: int
    duplicate_pct: float
    total_missing: int
    missing_pct: float
    numeric_cols: int
    categorical_cols: int
    datetime_cols: int
    columns_info: list[ColumnInfo]


class StatsSummary(BaseModel):
    column: str
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    q25: Optional[float] = None
    q75: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    mode: Optional[Any] = None
    null_count: int = 0
    unique_count: int = 0


class DistributionResponse(BaseModel):
    session_id: str
    column: str
    chart_type: str  # histogram, bar
    figure: dict
    stats: StatsSummary


class CorrelationResponse(BaseModel):
    session_id: str
    method: str
    figure: dict
    top_pairs: list[dict]


class OutlierResponse(BaseModel):
    session_id: str
    method: str
    figure: dict
    summary: list[dict]
    outlier_rows: list[dict]


class QualityResponse(BaseModel):
    session_id: str
    missing_figure: dict
    missing_by_column: list[dict]
    duplicate_rows: int
    constant_columns: list[str]
    high_cardinality_columns: list[dict]
    low_variance_columns: list[str]


class TimeSeriesResponse(BaseModel):
    session_id: str
    date_column: str
    value_column: str
    figure: dict


class ErrorResponse(BaseModel):
    error: str
    detail: str
