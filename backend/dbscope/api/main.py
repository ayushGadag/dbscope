"""
DBScope FastAPI Application.
Main entry point for HTTP REST services.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dbscope.api.routes.migration import router as migration_router
from dbscope.api.routes.metadata import router as metadata_router
from dbscope.api.routes.dependencies import router as dependencies_router

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


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "healthy",
        "service": "dbscope-api",
        "version": "0.3.0",
    }
