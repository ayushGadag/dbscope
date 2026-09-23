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

> **Current implementation: Migration operation detection (DROP COLUMN, ADD COLUMN, ALTER COLUMN, RENAME COLUMN).**
> *(Day 2 / v0.2 Prototype)*

---

## Day 2 Scope

The Day 2 prototype extends the migration analyzer:
- Modular Python project structure and CLI entry point (`python -m dbscope`)
- Migration parser supporting 4 core DDL operations:
  1. `DROP COLUMN`
  2. `ADD COLUMN`
  3. `ALTER COLUMN`
  4. `RENAME COLUMN`
- Structured dictionary output capturing tables, columns, data types, and change clauses
- Graceful validation for unsupported/invalid SQL
- Comprehensive automated unit test suite with `pytest` (24 passing tests)

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

### Example 1: DROP COLUMN Migration

**Input:**
```sql
ALTER TABLE users DROP COLUMN email;
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

### Example 2: ADD COLUMN Migration

**Input:**
```sql
ALTER TABLE users ADD COLUMN age INTEGER;
```

**Output:**
```text
----------------------------------------
MIGRATION ANALYSIS
----------------------------------------
Operation : ADD COLUMN
Table     : users
Column    : age
Data Type : INTEGER
Status    : Change detected
```

### Example 3: ALTER COLUMN Migration

**Input:**
```sql
ALTER TABLE users ALTER COLUMN age TYPE BIGINT;
```

**Output:**
```text
----------------------------------------
MIGRATION ANALYSIS
----------------------------------------
Operation : ALTER COLUMN
Table     : users
Column    : age
New Type  : BIGINT
Status    : Change detected
```

### Example 4: RENAME COLUMN Migration

**Input:**
```sql
ALTER TABLE users RENAME COLUMN email TO email_address;
```

**Output:**
```text
----------------------------------------
MIGRATION ANALYSIS
----------------------------------------
Operation : RENAME COLUMN
Table     : users
Old Column: email
New Column: email_address
Status    : Change detected
```

### Example 5: Unsupported or Invalid Migration

**Input:**
```sql
SELECT * FROM users;
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
│   ├── __init__.py               # Package metadata and version definition (v0.2.0)
│   ├── __main__.py               # Module entry point for `python -m dbscope`
│   ├── cli.py                    # Interactive command line interface & formatting
│   └── migration_parser.py       # SQL parsing for DROP, ADD, ALTER, and RENAME COLUMN
│
├── tests/
│   ├── __init__.py               # Tests package marker
│   └── test_migration_parser.py  # Unit test suite (24 tests)
│
├── README.md                     # Project documentation
├── .gitignore                    # Git ignore file for Python and IDEs
└── pyproject.toml                # Project metadata and configuration
```

---

## Future Development Phases

1. **Phase 3 — Advanced SQL AST Parsing**: Transition from regex matching to a resilient Abstract Syntax Tree (AST) parser (`sqlglot` / `sqlparse`) supporting multi-statement migrations and dialect-specific syntax.
2. **Phase 4 — SQLAlchemy ORM Mapping**: Static AST analysis of SQLAlchemy models to map altered tables/columns to Python model classes and attributes.
3. **Phase 5 — Pydantic & FastAPI Impact Tracing**: Trace ORM model references into Pydantic request/response schemas and FastAPI route handlers.
4. **Phase 6 — Vue Frontend Analysis**: Identify affected API clients, Pinia stores, and Vue component templates consuming impacted endpoints.
5. **Phase 7 — Dependency Graph & Risk Engine**: Construct a NetworkX dependency graph to compute blast radius, assign risk levels, and generate `ALLOW` / `REVIEW` / `BLOCK` guardrails.
