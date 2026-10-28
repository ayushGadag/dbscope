"""
DBScope FastAPI Application.
Main entry point for HTTP REST services.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dbscope.api.routes.migration import router as migration_router
from dbscope.api.routes.metadata import router as metadata_router
from dbscope.api.routes.dependencies import router as dependencies_router
from dbscope.api.routes.impact import router as impact_router
from dbscope.api.routes.risk import router as risk_router
from dbscope.api.routes.source import router as source_router

app = FastAPI(
    title="DBScope API",
    description="Enterprise Database Change Impact Analysis Platform — Prototype API",
    version="0.3.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(migration_router)
app.include_router(metadata_router)
app.include_router(dependencies_router)
app.include_router(impact_router)
app.include_router(risk_router)
app.include_router(source_router)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint providing service information and helpful navigation links."""
    return {
        "service": "DBScope Backend API",
        "status": "running",
        "version": "0.3.0",
        "frontend_ui": "http://localhost:5173",
        "interactive_docs": "/docs",
        "health": "/api/health",
        "message": "DBScope Backend is active. Open http://localhost:5173 in your browser to access the full DBScope Web Application, or visit /docs for interactive Swagger API testing.",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "service": "dbscope-api",
        "version": "0.3.0",
    }

