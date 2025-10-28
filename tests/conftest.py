"""Test fixtures for MolSelector."""

from typing import Iterator

import pytest
from fastapi.testclient import TestClient

from molselector.app import DEFAULT_FOLDER_ENV_VAR, app, state


@pytest.fixture(autouse=True)
def reset_state(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Ensure application state and env vars are clean between tests."""

    state.folder = None
    state.files = []
    state.decisions = {}
    monkeypatch.delenv(DEFAULT_FOLDER_ENV_VAR, raising=False)

    yield

    state.folder = None
    state.files = []
    state.decisions = {}


@pytest.fixture
def client() -> TestClient:
    """Return a FastAPI test client bound to the app."""

    return TestClient(app)
