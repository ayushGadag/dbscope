# DBScope — Enterprise Database Change Impact Analysis Platform

DBScope is a static analysis and change intelligence platform designed to evaluate proposed database migrations **before** they are executed in production.

By inspecting schema alterations early in the software development lifecycle, DBScope aims to trace how a schema change ripples through every architectural tier of an enterprise application:

```text
PostgreSQL Schema Migration
            ↓
    SQLAlchemy Models
            ↓
     Pydantic Schemas
            ↓
     FastAPI Endpoints
            ↓
    Vue.js UI Components
            ↓
   User-Facing Features
```

Ultimately, DBScope will provide engineering teams with affected component lists, complete dependency chains, automated risk scoring, and actionable recommendations (`ALLOW`, `REVIEW`, or `BLOCK`).

---

> **Current implementation: basic SQL migration detection.**
> *(Day 1 / v0.1 Prototype)*

---

## Day 1 Scope

The Day 1 prototype implements the initial foundation:
- Clean, modular Python project structure
- Interactive CLI entry point (`python -m dbscope`)
- Migration parser for detecting `DROP COLUMN` DDL operations
- Structured dictionary output for downstream processing
- Graceful validation for unsupported/invalid SQL
- Automated unit test suite with `pytest`

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- `pip`

### 1. Clone or Open the Repository
```bash
cd "clganti - project"
```

### 2. (Optional) Create and Activate a Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Development Dependencies
```bash
pip install -e .
pip install pytest
```

---

## Usage

Run the DBScope interactive CLI:

```bash
python -m dbscope
```

### Example 1: Valid DROP COLUMN Migration

**Prompt & Input:**
```text
========================================
              DBSCOPE v0.1
========================================

Enter SQL migration:
> ALTER TABLE users DROP COLUMN email;
```

**Output:**
```text
----------------------------------------
MIGRATION ANALYSIS
----------------------------------------
Operation : DROP COLUMN
Table     : users
Column    : email
Status    : Change detected
```

### Example 2: Unsupported or Invalid Migration

**Prompt & Input:**
```text
========================================
              DBSCOPE v0.1
========================================

Enter SQL migration:
> SELECT * FROM users;
```

**Output:**
```text
----------------------------------------
MIGRATION ANALYSIS
----------------------------------------
Status    : Unsupported or invalid migration.
```

---

## Running Tests

Run the automated test suite with pytest:

```bash
python -m pytest -v
```

---

## Project Structure

```text
dbscope/
│
├── dbscope/
│   ├── __init__.py               # Package metadata and version definition
│   ├── __main__.py               # Module entry point for `python -m dbscope`
│   ├── cli.py                    # Interactive command line interface & formatting
│   └── migration_parser.py       # SQL parsing & DROP COLUMN detection
│
├── tests/
│   ├── __init__.py               # Tests package marker
│   └── test_migration_parser.py  # Unit test suite for migration parser
│
├── README.md                     # Project documentation
├── .gitignore                    # Git ignore file for Python and IDEs
└── pyproject.toml                # Project metadata and configuration
```

---

## Future Development Phases

1. **Phase 2 — Advanced SQL AST Parsing**: Migrate from regex matching to a resilient Abstract Syntax Tree (AST) SQL parser (`sqlglot` or `sqlparse`) supporting multi-statement migrations, `RENAME COLUMN`, `ALTER TYPE`, and Postgres-specific DDL dialects.
2. **Phase 3 — SQLAlchemy ORM Mapping**: Static AST analysis of SQLAlchemy models to map altered tables/columns to Python model classes and attributes.
3. **Phase 4 — Pydantic & FastAPI Impact Tracing**: Trace ORM model references into Pydantic request/response schemas and FastAPI route handlers.
4. **Phase 5 — Vue Frontend Analysis**: Identify affected API clients, Pinia stores, and Vue component templates consuming impacted endpoints.
5. **Phase 6 — Dependency Graph & Risk Engine**: Construct a NetworkX dependency graph to compute blast radius, assign risk levels, and generate `ALLOW` / `REVIEW` / `BLOCK` guardrails.
