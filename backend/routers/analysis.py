from fastapi import APIRouter, HTTPException, Query
from services.eda_engine import compute_overview, compute_stats
from services.viz_builder import (
    build_distribution, build_correlation,
    build_outlier_chart, build_missing_chart
)
from services.data_parser import load_session_pandas
from models.schemas import (
    OverviewResponse, DistributionResponse, CorrelationResponse,
    OutlierResponse, QualityResponse
)
from services.eda_engine import compute_quality

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/overview/{session_id}", response_model=OverviewResponse)
async def get_overview(session_id: str):
    try:
        return compute_overview(session_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/distribution/{session_id}")
async def get_distribution(
    session_id: str,
    column: str = Query(..., description="Column name to analyze")
):
    try:
        df = load_session_pandas(session_id)
        if column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{column}' not found")
        figure = build_distribution(session_id, column)
        stats = compute_stats(df, column)
        return {
            "session_id": session_id,
            "column": column,
            "figure": figure,
            "stats": stats.model_dump(),
        }
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlation/{session_id}")
async def get_correlation(
    session_id: str,
    method: str = Query("pearson", enum=["pearson", "spearman", "kendall"])
):
    try:
        result = build_correlation(session_id, method)
        return {
            "session_id": session_id,
            "method": method,
            "figure": result["figure"],
            "top_pairs": result["top_pairs"],
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/outliers/{session_id}")
async def get_outliers(
    session_id: str,
    method: str = Query("iqr", enum=["iqr", "zscore"])
):
    try:
        result = build_outlier_chart(session_id, method)
        return {
            "session_id": session_id,
            "method": method,
            "figure": result["figure"],
            "summary": result["summary"],
            "outlier_rows": result["outlier_rows"],
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality/{session_id}")
async def get_quality(session_id: str):
    try:
        result = compute_quality(session_id)
        missing_figure = build_missing_chart(session_id)
        return {
            "session_id": session_id,
            "missing_figure": missing_figure,
            "missing_by_column": result["missing_by_column"],
            "duplicate_rows": result["duplicate_rows"],
            "constant_columns": result["constant_columns"],
            "high_cardinality_columns": result["high_cardinality_columns"],
            "low_variance_columns": result["low_variance_columns"],
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
