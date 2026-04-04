"""Compatibility: `uvicorn app.main:app` loads the app defined in `server/main.py`."""

from main import app

__all__ = ["app"]
