# DBScope — Enterprise Database Change Impact Analysis Platform

DBScope is a static analysis and change intelligence platform designed to evaluate proposed database migrations **before** they are executed in production.

By inspecting schema alterations early in the software development lifecycle, DBScope statically traces how a schema change ripples through every architectural tier of an enterprise application:

```text
PostgreSQL Schema Migration
            ↓
    SQLAlchemy Models
            ↓
     Pydantic Schemas
            ↓
     FastAPI Endpoints
```

---

## Target Full-Stack Structure

```text
DBScope/
│
├── backend/                              # Python FastAPI Analysis Engine
│   ├── dbscope/
│   │   ├── api/                          # FastAPI REST endpoints & Pydantic schemas
│   │   ├── metadata/                     # Read-only PostgreSQL catalog inspector
│   │   ├── dependencies/                 # Python AST source-code extractor
│   │   ├── sample_app/                   # 3-tier sample application for testing
│   │   └── migration_parser.py           # Regex-based SQL migration parser
│   ├── tests/                            # Automated test suite (55 passing tests)
│   ├── pyproject.toml                    # Python package configuration
│   └── README.md                         # Backend-specific documentation
│
├── frontend/                             # React + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/                   # UI building blocks
│   │   ├── layouts/                      # DashboardLayout with 10-feature sidebar
│   │   ├── pages/                        # 10 dedicated analysis views
│   │   ├── services/                     # Decoupled async service layer
│   │   ├── mock/                         # Structured domain mock datasets
│   │   ├── types/                        # TypeScript domain interfaces
│   │   └── router/                       # React Router DOM configuration
│   ├── package.json                      # Frontend dependencies (React 19, Lucide, Tailwind)
│   └── vite.config.ts                    # Vite bundler configuration
│
└── README.md                             # Top-level full-stack documentation
```

---

## Current Prototype Technologies

The prototype focuses exclusively on a tightly scoped, robust 6-tier architecture:

1. **PostgreSQL**: Read-only schema metadata inspection (`information_schema`).
2. **FastAPI**: Backend REST API and public endpoint routing.
3. **SQLAlchemy**: ORM model extraction and table attribute mapping.
4. **Python AST**: Static in-memory code parsing without source code execution.
5. **Pydantic**: Schema dependency extraction and request/response models.
6. **FastAPI Routes**: Public API endpoint mapping and route parameter analysis.

---

## Getting Started

### 1. Backend Setup & Verification

```bash
cd backend

# (Optional) Activate Python virtual environment
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate

# Run automated tests
python -m pytest -v
```

All 55 automated tests run across:
- Migration Parser (24 tests)
- Feature 1: Migration Analysis API (10 tests)
- Feature 2: PostgreSQL Metadata Analyzer (9 tests)
- Feature 3: Dependency Extraction Prototype (12 tests)

To launch the backend API:
```bash
python -m uvicorn dbscope.api.main:app --reload --port 8000
```

### 2. Frontend Setup & Verification

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

---

## Frontend Prototype Architecture

The frontend is currently a **professional, clickable prototype** powered by realistic mock data. It is intentionally decoupled:

```text
UI Pages → Components → Services (async) → Mock Data (src/mock/)
```

When integrating with the live backend in future phases, the service layer can be switched from mock data to FastAPI HTTP requests (`fetch('/api/...')`) without altering any component or page architecture.

### Sidebar Features (10 Complete Views):
1. **Overview**: Executive dashboard, active project card, supported technology badges, and 8-phase pipeline.
2. **Projects**: Multi-project management view with [Open], [Scan], and [Settings] actions.
3. **Project Scanner**: Dual-input source scanner (ZIP upload with remove/replace, or GitHub URL) and PostgreSQL connection inspector.
4. **Analyze Change**: SQL migration editor with preset buttons (`DROP`, `ADD`, `ALTER`, `RENAME`) and instant structured parsing.
5. **Dependency Graph**: Interactive visual SVG graph tracing `PostgreSQL` → `users.email` → `User.email` → `UserResponse.email` → `GET /users/{id}` with layer filtering, node inspection, and zoom controls.
6. **Impact Analysis**: Blast radius matrix detailing affected components, files, line numbers, and impact mechanisms.
7. **Risk Assessment**: High-risk scoring card (Score: 88/100) with contributing factors, technical evidence breakdown, and recommendations.
8. **Migration Plan**: Safe 9-step preparation checklist (Non-execution guarantee; zero "Run SQL" buttons).
9. **Reports**: Audit and compliance report view with full report modal and client-side browser print dialog.
10. **Architecture**: Review of the 6 supported prototype technologies and ripple flow visualization.

---

## Safety Guarantees

DBScope operates under strict static analysis safety guidelines:
- **Never executes migrations** against any database.
- **Never modifies PostgreSQL tables** or executes DDL/DML.
- **Never modifies application source code** or commits to Git repositories.
- **Never leaks database credentials** (all connection strings are masked in logs and API responses).
