import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from scipy import stats as scipy_stats
from services.eda_engine import _categorize_column, compute_outliers, compute_quality
from services.data_parser import load_session_pandas

# Dark theme — black / gold / white palette
BG_COLOR = "#0a0a0a"
PAPER_COLOR = "#111111"
GRID_COLOR = "#1e1e1e"
TEXT_COLOR = "#e2e8f0"
ACCENT1 = "#f5c518"   # gold
ACCENT2 = "#ffd95a"   # light gold
ACCENT3 = "#ffffff"   # white
ACCENT4 = "#22c55e"   # emerald
ACCENT5 = "#f43f5e"   # rose

COLOR_PALETTE = [
    "#f5c518", "#ffd95a", "#ffffff", "#06b6d4", "#a855f7",
    "#22c55e", "#f97316", "#fb7185", "#c084fc", "#34d399"
]


def _base_layout(title: str = "") -> dict:
    return dict(
        title=dict(text=title, font=dict(color=TEXT_COLOR, size=15, family="Outfit, sans-serif")),
        paper_bgcolor=PAPER_COLOR,
        plot_bgcolor=BG_COLOR,
        font=dict(color=TEXT_COLOR, family="Outfit, sans-serif"),
        margin=dict(l=50, r=30, t=60, b=50),
        xaxis=dict(gridcolor=GRID_COLOR, zerolinecolor=GRID_COLOR, linecolor=GRID_COLOR),
        yaxis=dict(gridcolor=GRID_COLOR, zerolinecolor=GRID_COLOR, linecolor=GRID_COLOR),
        hoverlabel=dict(bgcolor="#1a1a1a", font_color=TEXT_COLOR, bordercolor="#f5c518"),
        legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color=TEXT_COLOR)),
    )


def build_distribution(session_id: str, column: str) -> dict:
    df = load_session_pandas(session_id)
    series = df[column].dropna()
    cat = _categorize_column(df[column])

    if cat == "numeric":
        fig = go.Figure()
        fig.add_trace(go.Histogram(
            x=series.tolist(),
            nbinsx=40,
            name="Count",
            marker_color=ACCENT1,
            opacity=0.75,
            hovertemplate="<b>Range:</b> %{x}<br><b>Count:</b> %{y}<extra></extra>",
        ))
        # KDE overlay
        try:
            kde = scipy_stats.gaussian_kde(series)
            x_range = np.linspace(series.min(), series.max(), 200)
            kde_vals = kde(x_range)
            # Scale KDE to histogram
            bin_width = (series.max() - series.min()) / 40
            scale = len(series) * bin_width
            fig.add_trace(go.Scatter(
                x=x_range.tolist(),
                y=(kde_vals * scale).tolist(),
                mode="lines",
                name="KDE",
                line=dict(color=ACCENT2, width=2.5),
                hovertemplate="<b>Value:</b> %{x:.3f}<br><b>Density:</b> %{y:.3f}<extra></extra>",
            ))
        except Exception:
            pass
        layout = _base_layout(f"Distribution: {column}")
        layout["xaxis"]["title"] = dict(text=column, font=dict(color=TEXT_COLOR))
        layout["yaxis"]["title"] = dict(text="Count", font=dict(color=TEXT_COLOR))
        layout["barmode"] = "overlay"
        fig.update_layout(**layout)
        return fig.to_dict()

    else:  # categorical
        counts = series.value_counts().head(30)
        fig = go.Figure(go.Bar(
            x=counts.index.tolist(),
            y=counts.values.tolist(),
            marker=dict(
                color=counts.values.tolist(),
                colorscale=[[0, ACCENT1], [1, ACCENT2]],
                showscale=False,
            ),
            hovertemplate="<b>%{x}</b><br>Count: %{y}<extra></extra>",
        ))
        layout = _base_layout(f"Value Counts: {column}")
        layout["xaxis"]["title"] = dict(text=column, font=dict(color=TEXT_COLOR))
        layout["yaxis"]["title"] = dict(text="Count", font=dict(color=TEXT_COLOR))
        fig.update_layout(**layout)
        return fig.to_dict()


def build_correlation(session_id: str, method: str = "pearson") -> dict:
    df = load_session_pandas(session_id)
    numeric_df = df.select_dtypes(include=[np.number])

    if len(numeric_df.columns) < 2:
        fig = go.Figure()
        fig.update_layout(**_base_layout("Not enough numeric columns"))
        return fig.to_dict()

    corr = numeric_df.corr(method=method).round(3)
    cols = corr.columns.tolist()

    fig = go.Figure(go.Heatmap(
        z=corr.values.tolist(),
        x=cols,
        y=cols,
        colorscale=[
            [0.0, "#f43f5e"],
            [0.5, "#1a1d2e"],
            [1.0, "#6366f1"],
        ],
        zmin=-1,
        zmax=1,
        text=corr.values.round(2).tolist(),
        texttemplate="%{text}",
        textfont=dict(size=10, color=TEXT_COLOR),
        hovertemplate="<b>%{x}</b> vs <b>%{y}</b><br>Correlation: %{z:.3f}<extra></extra>",
        colorbar=dict(
            title=dict(text="Correlation", font=dict(color=TEXT_COLOR)),
            tickfont=dict(color=TEXT_COLOR),
            bgcolor=PAPER_COLOR,
        ),
    ))
    layout = _base_layout(f"{method.title()} Correlation Matrix")
    layout["xaxis"] = dict(tickangle=-45, tickfont=dict(color=TEXT_COLOR, size=10))
    layout["yaxis"] = dict(tickfont=dict(color=TEXT_COLOR, size=10))
    fig.update_layout(**layout)

    # Top correlated pairs
    pairs = []
    cols_list = list(corr.columns)
    for i in range(len(cols_list)):
        for j in range(i + 1, len(cols_list)):
            pairs.append({
                "col1": cols_list[i],
                "col2": cols_list[j],
                "correlation": round(float(corr.iloc[i, j]), 4),
            })
    pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {"figure": fig.to_dict(), "top_pairs": pairs[:10]}


def build_outlier_chart(session_id: str, method: str = "iqr") -> dict:
    result = compute_outliers(session_id, method)
    df = result["df"]
    numeric_cols = result["numeric_cols"]

    if not numeric_cols:
        fig = go.Figure()
        fig.update_layout(**_base_layout("No numeric columns found"))
        return {"figure": fig.to_dict(), "summary": [], "outlier_rows": []}

    # Box plots for up to 10 numeric cols
    display_cols = numeric_cols[:10]
    fig = go.Figure()
    for i, col in enumerate(display_cols):
        fig.add_trace(go.Box(
            y=df[col].dropna().tolist(),
            name=col,
            marker_color=COLOR_PALETTE[i % len(COLOR_PALETTE)],
            boxpoints="outliers",
            jitter=0.3,
            whiskerwidth=0.2,
            marker=dict(size=3),
            line=dict(width=1.5),
            hovertemplate=f"<b>{col}</b><br>Value: %{{y:.3f}}<extra></extra>",
        ))
    layout = _base_layout(f"Outlier Detection — Box Plots ({method.upper()} method)")
    layout["yaxis"]["title"] = dict(text="Value", font=dict(color=TEXT_COLOR))
    fig.update_layout(**layout)

    return {
        "figure": fig.to_dict(),
        "summary": result["summary"],
        "outlier_rows": result["outlier_rows"],
    }


def build_missing_chart(session_id: str) -> dict:
    result = compute_quality(session_id)
    df = result["df"]
    missing_data = result["missing_by_column"]

    if not missing_data:
        fig = go.Figure()
        fig.add_annotation(
            text="✓ No missing values detected!",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=18, color=ACCENT4),
        )
        fig.update_layout(**_base_layout("Missing Data Analysis"))
        return fig.to_dict()

    cols = [d["column"] for d in missing_data]
    pcts = [d["missing_pct"] for d in missing_data]
    counts = [d["missing_count"] for d in missing_data]

    fig = go.Figure(go.Bar(
        x=pcts,
        y=cols,
        orientation="h",
        marker=dict(
            color=pcts,
            colorscale=[[0, ACCENT4], [0.5, ACCENT3], [1, ACCENT5]],
            showscale=True,
            colorbar=dict(
                title=dict(text="Missing %", font=dict(color=TEXT_COLOR)),
                tickfont=dict(color=TEXT_COLOR),
            ),
        ),
        text=[f"{p:.1f}% ({c} rows)" for p, c in zip(pcts, counts)],
        textposition="outside",
        textfont=dict(color=TEXT_COLOR, size=11),
        hovertemplate="<b>%{y}</b><br>Missing: %{x:.2f}%<extra></extra>",
    ))
    layout = _base_layout("Missing Data by Column")
    layout["xaxis"]["title"] = dict(text="Missing (%)", font=dict(color=TEXT_COLOR))
    layout["xaxis"]["range"] = [0, min(max(pcts) * 1.3, 100)]
    layout["height"] = max(300, len(cols) * 35 + 100)
    fig.update_layout(**layout)
    return fig.to_dict()
