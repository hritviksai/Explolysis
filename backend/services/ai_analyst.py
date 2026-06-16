import os
import asyncio
from google import genai
from services.eda_engine import compute_overview, _categorize_column
from services.data_parser import load_session_pandas
import numpy as np


def _get_client():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


def _build_data_summary(session_id: str) -> str:
    """Build a compact text summary of the dataset for the prompt."""
    df = load_session_pandas(session_id)
    overview = compute_overview(session_id)

    lines = [
        f"Dataset: {overview.rows} rows x {overview.columns} columns",
        f"Memory: {overview.memory_mb} MB",
        f"Duplicate rows: {overview.duplicate_rows} ({overview.duplicate_pct}%)",
        f"Missing values: {overview.total_missing} cells ({overview.missing_pct}%)",
        f"Column types: {overview.numeric_cols} numeric, {overview.categorical_cols} categorical, {overview.datetime_cols} datetime",
        "",
        "Column-level summary:",
    ]

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in df.columns[:30]:  # cap at 30 cols for prompt size
        col_info = next((c for c in overview.columns_info if c.name == col), None)
        if col_info is None:
            continue
        line = f"  - {col} [{col_info.dtype}]: {col_info.null_pct}% missing, {col_info.unique_count} unique values"
        if col in numeric_cols:
            s = df[col].dropna()
            if len(s) > 0:
                line += f", range [{s.min():.3g} - {s.max():.3g}], mean={s.mean():.3g}, std={s.std():.3g}"
        else:
            top_vals = df[col].value_counts().head(3).index.tolist()
            line += f", top values: {top_vals}"
        lines.append(line)

    # Correlation highlights
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].corr().abs()
        pairs = []
        cols_list = list(numeric_cols)
        for i in range(len(cols_list)):
            for j in range(i + 1, len(cols_list)):
                pairs.append((cols_list[i], cols_list[j], corr.iloc[i, j]))
        pairs.sort(key=lambda x: x[2], reverse=True)
        top3 = pairs[:3]
        if top3:
            lines.append("")
            lines.append("Top correlated pairs (Pearson |r|):")
            for a, b, r in top3:
                lines.append(f"  - {a} vs {b}: r={r:.3f}")

    return "\n".join(lines)


async def stream_insights(session_id: str):
    """Async generator that streams AI insights as SSE."""
    client = _get_client()

    data_summary = _build_data_summary(session_id)

    if client is None:
        # Fallback: rule-based insights
        async for chunk in _rule_based_insights(session_id):
            yield chunk
        return

    prompt = f"""You are an expert data scientist and analyst. Analyze the following dataset summary and provide comprehensive, actionable insights.

Dataset Summary:
{data_summary}

Provide a structured analysis with these EXACT sections (use these headers exactly):

## Executive Summary
Write 3-4 sentences describing what this dataset is likely about, its scope, and overall quality.

## Key Statistical Findings
List the 5 most important statistical observations. Be specific with numbers.

## Data Quality Assessment
Assess missing values, duplicates, outlier-prone columns. Give specific recommendations.

## Correlation & Relationship Insights
Describe the most significant relationships between variables and their potential implications.

## Feature Engineering Suggestions
Suggest 3-5 specific feature engineering ideas based on the column types and distributions observed.

## ML Readiness & Next Steps
Assess if this data could be used for ML. Identify potential target variables and recommended algorithms.

Be specific, data-driven, and use the exact numbers from the summary. Write in a professional but accessible tone."""

    try:
        # Run the synchronous Gemini streaming call in a thread to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        queue = asyncio.Queue()

        def _run_sync():
            try:
                for chunk in client.models.generate_content_stream(
                    model="gemini-2.0-flash",
                    contents=prompt,
                ):
                    if chunk.text:
                        loop.call_soon_threadsafe(queue.put_nowait, chunk.text)
            except Exception as e:
                loop.call_soon_threadsafe(queue.put_nowait, f"__ERROR__:{str(e)}")
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

        await loop.run_in_executor(None, _run_sync)

        while True:
            item = await queue.get()
            if item is None:
                break
            if item.startswith("__ERROR__:"):
                err_msg = item[len("__ERROR__:"):]
                yield f"\n\nAI analysis error: {err_msg}\n\n"
                async for chunk in _rule_based_insights(session_id):
                    yield chunk
                return
            yield item

    except Exception as e:
        yield f"\n\nAI analysis error: {str(e)}\n\n"
        async for chunk in _rule_based_insights(session_id):
            yield chunk


async def _rule_based_insights(session_id: str):
    """Fallback rule-based insights if no API key."""
    from services.eda_engine import compute_overview
    overview = compute_overview(session_id)
    df = load_session_pandas(session_id)

    lines = [
        "## Executive Summary\n",
        f"This dataset contains **{overview.rows:,} rows** and **{overview.columns} columns**. ",
        f"It has **{overview.numeric_cols} numeric**, **{overview.categorical_cols} categorical**, ",
        f"and **{overview.datetime_cols} datetime** columns. ",
        f"Overall data completeness is **{100 - overview.missing_pct:.1f}%**.\n\n",
        "## Key Statistical Findings\n",
    ]

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in list(numeric_cols)[:5]:
        s = df[col].dropna()
        if len(s) > 0:
            lines.append(f"- **{col}**: mean={s.mean():.3g}, std={s.std():.3g}, range=[{s.min():.3g}, {s.max():.3g}]\n")

    lines.append("\n## Data Quality Assessment\n")
    if overview.missing_pct > 10:
        lines.append(f"- High missingness detected ({overview.missing_pct:.1f}% of cells). Consider imputation strategies.\n")
    else:
        lines.append(f"- Low missingness ({overview.missing_pct:.1f}%). Data completeness is good.\n")
    if overview.duplicate_pct > 0:
        lines.append(f"- {overview.duplicate_rows} duplicate rows detected ({overview.duplicate_pct:.1f}%). Consider deduplication.\n")

    for chunk in lines:
        yield chunk
