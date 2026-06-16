# Explolysis — Automated EDA Platform

> **Upload any dataset. Get instant AI-powered exploratory data analysis with interactive visualizations, editable data, and formula calculations — no code required.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Plotly](https://img.shields.io/badge/Plotly.js-5.22-3F4F75?style=flat-square&logo=plotly)](https://plotly.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## What is Explolysis?

**Explolysis** is a full-stack automated EDA (Exploratory Data Analysis) tool built for data scientists and ML engineers. Drop in a CSV, Excel, or JSON file and immediately get:

- 📊 **Statistical summaries** — mean, median, std, skewness, kurtosis, quantiles
- 📈 **Interactive charts** — histograms, KDE overlays, heatmaps, box plots (all Plotly-powered)
- 🔗 **Correlation analysis** — Pearson, Spearman, Kendall with ranked top pairs
- 🎯 **Outlier detection** — IQR and Z-score methods with flagged row previews
- 🧹 **Data quality report** — missing values, duplicates, high-cardinality columns
- ✏️ **Data editor** — click any cell to edit it; formula calculator (SUM, MEAN, MIN, MAX...)
- 🤖 **AI analyst** — Gemini 2.0 Flash generates plain-English findings, ML readiness, feature engineering suggestions

---

## Screenshots

> Upload → Dashboard auto-loads all analysis tabs

| Landing | Dashboard | Data Editor |
|---------|-----------|-------------|
| Drag & drop upload zone | 7 analysis sections in sidebar | Click-to-edit table + formula bar |

---

## Tech Stack

### Backend
| Technology | Role |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | Async REST API + SSE streaming |
| [Polars](https://pola.rs/) | High-performance DataFrame reads (Parquet sessions) |
| [Pandas](https://pandas.pydata.org/) | Data parsing, statistics, cell editing |
| [Plotly](https://plotly.com/python/) | Server-side chart generation (JSON) |
| [Google Gemini API](https://ai.google.dev/) | AI insight generation via `google-genai` SDK |
| [SciPy](https://scipy.org/) | Skewness, kurtosis, z-score outlier detection |
| [Apache Parquet](https://parquet.apache.org/) | Session data storage (fast + typed) |

### Frontend
| Technology | Role |
|---|---|
| [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | Modern SPA, fast HMR |
| [react-plotly.js](https://github.com/plotly/react-plotly.js) | Interactive chart rendering |
| [Framer Motion](https://www.framer.com/motion/) | Page transitions + micro-animations |
| [TanStack Query](https://tanstack.com/query) | Data fetching, caching, background refetch |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Render AI-streamed markdown |
| Vanilla CSS | Custom design system (black/yellow/white) |

---

## Features in Detail

### 7 Analysis Modules

| Module | What it shows |
|---|---|
| **Overview** | Row/column count, memory, duplicate %, missing %, per-column type + sample values |
| **Distribution Explorer** | Per-column histogram + KDE (numeric) or bar chart (categorical) with full stats panel |
| **Correlation Matrix** | Interactive heatmap (Pearson/Spearman/Kendall), annotated top correlated pairs |
| **Outlier Detector** | IQR or Z-score method — box plots per column + table of flagged rows |
| **Data Quality** | Missing value bar chart, duplicate count, constant/high-cardinality column warnings |
| **Data Editor** | Paginated editable table (click any cell → type → Enter), aggregate formula calculator |
| **AI Insights** | Gemini-powered streaming analysis: key findings, anomalies, ML recommendations |

### Data Editor
- **Click any cell** to edit inline — `Enter` to save, `Esc` to cancel
- Changes are **persisted back to the session** (Parquet on disk)
- **Formula calculator**: select column + operation + optional row range → get result
  - Supported: `SUM`, `MEAN`, `MIN`, `MAX`, `MEDIAN`, `STD`, `COUNT`, `UNIQUE`
- Pagination — 50 rows/page, navigate with First/Prev/Next/Last

### AI Analyst
- Streams tokens in real time via **Server-Sent Events (SSE)**
- Powered by **Gemini 2.0 Flash** via the `google-genai` SDK
- Generates: dataset summary, distribution notes, correlation highlights, outlier flags, feature engineering ideas, ML readiness score
- **Graceful fallback** — if no API key or rate-limited, a rule-based statistical summary is shown automatically

---

## Quick Start

### Prerequisites
- Python **3.11+**
- Node.js **20+**
- A free [Gemini API key](https://aistudio.google.com/app/apikey) (optional but recommended)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/explolysis.git
cd explolysis
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and paste your GEMINI_API_KEY

# Run the API server
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open **http://localhost:5173** — API calls are automatically proxied to the backend.

### 4. Docker Compose (optional)

```bash
# In the project root
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY

docker-compose up --build
```

Open **http://localhost:3000**

---

## Environment Variables

Create `backend/.env` (copy from `.env.example`):

```env
GEMINI_API_KEY=your_gemini_api_key_here
MAX_FILE_SIZE_MB=50
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **No Gemini key?** The app works fully without it — AI Insights tab falls back to a rule-based statistical report.

---

## Supported File Formats

| Format | Extensions | Notes |
|---|---|---|
| CSV | `.csv` | Auto-detects encoding (chardet) |
| Excel | `.xlsx`, `.xls` | Uses first sheet |
| JSON | `.json` | Flat / record-oriented |

**Max file size:** 50 MB

---

## Deployment to Render (Free)

This project ships with a `render.yaml` for **one-click deployment**:

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render detects `render.yaml` automatically
4. In the Render backend service settings, add `GEMINI_API_KEY` as an environment variable
5. Copy the backend URL → set it as `VITE_API_URL` in the frontend static site settings
6. Update `ALLOWED_ORIGINS` in the backend to include your frontend Render URL

**Result:** Backend (FastAPI web service) + Frontend (React static site) — both free tier.

---

## Project Structure

```
explolysis/
├── backend/
│   ├── main.py                  # FastAPI app + router registration
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── routers/
│   │   ├── upload.py            # POST /api/upload
│   │   ├── analysis.py          # GET /api/analysis/* (overview, dist, corr, outliers, quality)
│   │   ├── data.py              # GET/PATCH /api/data/* (table view + cell editing + aggregates)
│   │   └── ai.py                # GET /api/ai/insights (SSE streaming)
│   ├── services/
│   │   ├── data_parser.py       # File parsing, Parquet session storage
│   │   ├── eda_engine.py        # Core statistics (overview, stats, outliers, quality)
│   │   ├── viz_builder.py       # Plotly chart builders (all analysis types)
│   │   └── ai_analyst.py        # Gemini streaming + rule-based fallback
│   └── models/
│       └── schemas.py           # Pydantic request/response models
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── index.css            # Global design system (black/yellow/white)
│       ├── App.jsx              # Router + session state
│       ├── components/
│       │   ├── UploadZone/      # Drag-and-drop file uploader
│       │   ├── Sidebar/         # Navigation sidebar
│       │   ├── DataOverview/    # Metric cards + column summary table
│       │   ├── DistributionExplorer/
│       │   ├── CorrelationMatrix/
│       │   ├── OutlierDetector/
│       │   ├── DataQuality/
│       │   ├── DataEditor/      # Editable table + formula calculator
│       │   ├── AIInsights/      # SSE streaming AI panel
│       │   └── ChartPanel/      # Plotly.js wrapper
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   └── Dashboard.jsx
│       └── utils/
│           └── api.js           # Axios + SSE helpers
│
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload file, returns `session_id` |
| `GET` | `/api/analysis/overview/{session_id}` | Dataset overview + column info |
| `GET` | `/api/analysis/distribution/{session_id}?column=X` | Per-column distribution chart + stats |
| `GET` | `/api/analysis/correlation/{session_id}?method=pearson` | Correlation heatmap |
| `GET` | `/api/analysis/outliers/{session_id}?method=iqr` | Outlier detection |
| `GET` | `/api/analysis/quality/{session_id}` | Data quality report |
| `GET` | `/api/data/{session_id}?page=1&page_size=50` | Paginated table data |
| `PATCH` | `/api/data/{session_id}/cell` | Edit a single cell |
| `GET` | `/api/data/{session_id}/aggregate?column=X&operation=sum` | Aggregate calculator |
| `GET` | `/api/ai/insights/{session_id}` | SSE stream of AI analysis |

Full interactive docs at **http://localhost:8000/docs** when running locally.

---

## Roadmap

- [ ] AI chat interface — ask follow-up questions about your data
- [ ] Dataset comparison — train vs test distribution drift
- [ ] Export analysis as a Jupyter Notebook (`.ipynb`)
- [ ] Time series analysis module (auto-detect date columns)
- [ ] Shareable report URLs
- [ ] AutoML target variable suggestion

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

*Built to demonstrate full-stack AI/ML engineering: FastAPI backend, React frontend, Gemini AI integration, and real-time data streaming.*
