import numpy as np
import pandas as pd
import polars as pl
from scipy import stats as scipy_stats
from services.data_parser import load_session, load_session_pandas
from models.schemas import (
    OverviewResponse, ColumnInfo, StatsSummary,
    QualityResponse
)


def _categorize_column(series: pd.Series) -> str:
    """Detect the semantic type of a column."""
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    # Try datetime parse
    if series.dtype == object:
        sample = series.dropna().head(50)
        try:
            pd.to_datetime(sample)
            return "datetime"
        except Exception:
            pass
        if series.nunique() / max(len(series), 1) < 0.5:
            return "categorical"
        return "text"
    return "categorical"


def compute_overview(session_id: str) -> OverviewResponse:
    df = load_session_pandas(session_id)
    total_cells = df.shape[0] * df.shape[1]
    total_missing = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    columns_info = []
    numeric_count = 0
    cat_count = 0
    dt_count = 0

    for col in df.columns:
        series = df[col]
        cat = _categorize_column(series)
        if cat == "numeric":
            numeric_count += 1
        elif cat == "categorical" or cat == "text" or cat == "boolean":
            cat_count += 1
        elif cat == "datetime":
            dt_count += 1

        null_count = int(series.isnull().sum())
        null_pct = round(null_count / max(len(series), 1) * 100, 2)
        unique_count = int(series.nunique())
        sample_values = series.dropna().head(5).tolist()

        columns_info.append(ColumnInfo(
            name=col,
            dtype=str(series.dtype),
            category=cat,
            null_count=null_count,
            null_pct=null_pct,
            unique_count=unique_count,
            sample_values=[str(v) for v in sample_values],
        ))

    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 3)

    return OverviewResponse(
        session_id=session_id,
        rows=len(df),
        columns=len(df.columns),
        memory_mb=memory_mb,
        duplicate_rows=duplicate_rows,
        duplicate_pct=round(duplicate_rows / max(len(df), 1) * 100, 2),
        total_missing=total_missing,
        missing_pct=round(total_missing / max(total_cells, 1) * 100, 2),
        numeric_cols=numeric_count,
        categorical_cols=cat_count,
        datetime_cols=dt_count,
        columns_info=columns_info,
    )


def compute_stats(df: pd.DataFrame, column: str) -> StatsSummary:
    series = df[column].dropna()
    cat = _categorize_column(df[column])

    if cat == "numeric":
        skew = float(scipy_stats.skew(series)) if len(series) > 2 else None
        kurt = float(scipy_stats.kurtosis(series)) if len(series) > 2 else None
        try:
            mode_val = float(series.mode().iloc[0])
        except Exception:
            mode_val = None
        return StatsSummary(
            column=column,
            mean=round(float(series.mean()), 4),
            median=round(float(series.median()), 4),
            std=round(float(series.std()), 4),
            min=round(float(series.min()), 4),
            max=round(float(series.max()), 4),
            q25=round(float(series.quantile(0.25)), 4),
            q75=round(float(series.quantile(0.75)), 4),
            skewness=round(skew, 4) if skew is not None else None,
            kurtosis=round(kurt, 4) if kurt is not None else None,
            mode=mode_val,
            null_count=int(df[column].isnull().sum()),
            unique_count=int(df[column].nunique()),
        )
    else:
        try:
            mode_val = str(series.mode().iloc[0])
        except Exception:
            mode_val = None
        return StatsSummary(
            column=column,
            mode=mode_val,
            null_count=int(df[column].isnull().sum()),
            unique_count=int(df[column].nunique()),
        )


def compute_outliers(session_id: str, method: str = "iqr") -> dict:
    df = load_session_pandas(session_id)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if not numeric_cols:
        return {"summary": [], "outlier_rows": []}

    summary = []
    outlier_masks = []

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 4:
            continue

        if method == "iqr":
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            mask = (df[col] < lower) | (df[col] > upper)
        else:  # z-score
            z = np.abs(scipy_stats.zscore(series))
            z_series = pd.Series(index=series.index, data=z)
            mask = pd.Series(False, index=df.index)
            mask.loc[z_series.index] = z_series > 3

        count = int(mask.sum())
        summary.append({
            "column": col,
            "outlier_count": count,
            "outlier_pct": round(count / max(len(df), 1) * 100, 2),
        })
        outlier_masks.append(mask)

    if outlier_masks:
        combined_mask = pd.concat(outlier_masks, axis=1).any(axis=1)
        outlier_rows = df[combined_mask].head(50).reset_index(drop=True)
        outlier_rows_dict = outlier_rows.to_dict(orient="records")
    else:
        outlier_rows_dict = []

    return {"summary": summary, "outlier_rows": outlier_rows_dict, "df": df, "numeric_cols": numeric_cols}


def compute_quality(session_id: str) -> dict:
    df = load_session_pandas(session_id)
    missing_by_col = df.isnull().sum()
    missing_pct = (missing_by_col / len(df) * 100).round(2)

    missing_data = [
        {"column": col, "missing_count": int(missing_by_col[col]), "missing_pct": float(missing_pct[col])}
        for col in df.columns if missing_by_col[col] > 0
    ]
    missing_data.sort(key=lambda x: x["missing_pct"], reverse=True)

    constant_cols = [col for col in df.columns if df[col].nunique() <= 1]

    cat_cols = df.select_dtypes(include=["object", "category"]).columns
    high_card = [
        {"column": col, "unique_count": int(df[col].nunique()),
         "unique_pct": round(df[col].nunique() / len(df) * 100, 2)}
        for col in cat_cols if df[col].nunique() / max(len(df), 1) > 0.5
    ]

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    low_var = [col for col in numeric_cols if df[col].std() < 1e-6]

    return {
        "missing_by_column": missing_data,
        "duplicate_rows": int(df.duplicated().sum()),
        "constant_columns": constant_cols,
        "high_cardinality_columns": high_card,
        "low_variance_columns": low_var,
        "df": df,
    }
