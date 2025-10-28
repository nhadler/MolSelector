"""Tests for the FastAPI application."""

from __future__ import annotations

import csv
from pathlib import Path

from fastapi.testclient import TestClient

from molselector.app import RESULTS_FILENAME


def _create_molecule_files(base: Path) -> None:
    """Populate a temporary folder with sample molecule files."""

    (base / "alpha.xyz").write_text("alpha contents\n")
    (base / "Beta.mol2").write_text("beta contents\n")
    (base / "ignore.txt").write_text("should be ignored\n")


def test_set_folder_lists_supported_files_and_existing_decisions(
    client: TestClient,
    tmp_path: Path,
) -> None:
    _create_molecule_files(tmp_path)

    results_path = tmp_path / RESULTS_FILENAME
    results_path.write_text(
        "file,decision,timestamp\nalpha.xyz,accept,2024-01-01T00:00:00\n",
    )

    response = client.post("/api/folder", json={"folder": str(tmp_path)})

    assert response.status_code == 200
    data = response.json()

    assert data["folder"] == str(tmp_path)
    assert data["results_csv"] == str(results_path)
    assert [item["path"] for item in data["files"]] == ["alpha.xyz", "Beta.mol2"]
    assert data["files"][0]["decision"] == "accept"
    assert data["files"][1]["decision"] is None


def test_get_molecule_returns_file_contents(
    client: TestClient,
    tmp_path: Path,
) -> None:
    _create_molecule_files(tmp_path)

    client.post("/api/folder", json={"folder": str(tmp_path)})

    response = client.get("/api/molecule", params={"path": "alpha.xyz"})

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "alpha.xyz"
    assert data["format"] == "xyz"
    assert "alpha contents" in data["content"]


def test_record_decision_persists_to_csv(
    client: TestClient,
    tmp_path: Path,
) -> None:
    _create_molecule_files(tmp_path)

    client.post("/api/folder", json={"folder": str(tmp_path)})

    response = client.post(
        "/api/decision",
        json={"path": "Beta.mol2", "decision": "decline"},
    )

    assert response.status_code == 200
    assert response.json() == {"file": "Beta.mol2", "decision": "decline"}

    with (tmp_path / RESULTS_FILENAME).open() as handle:
        rows = list(csv.DictReader(handle))

    assert len(rows) == 1
    row = rows[0]
    assert row["file"] == "Beta.mol2"
    assert row["decision"] == "decline"
    assert row["timestamp"]


def test_invalid_decision_is_rejected(
    client: TestClient,
    tmp_path: Path,
) -> None:
    _create_molecule_files(tmp_path)
    client.post("/api/folder", json={"folder": str(tmp_path)})

    response = client.post(
        "/api/decision",
        json={"path": "alpha.xyz", "decision": "maybe"},
    )

    assert response.status_code == 400
    assert "Decision must be" in response.json()["detail"]
    assert not (tmp_path / RESULTS_FILENAME).exists()


def test_molecule_request_rejects_path_traversal(
    client: TestClient,
    tmp_path: Path,
) -> None:
    _create_molecule_files(tmp_path)

    outside_file = tmp_path.parent / "outside.xyz"
    outside_file.write_text("outside contents\n")

    client.post("/api/folder", json={"folder": str(tmp_path)})

    response = client.get("/api/molecule", params={"path": "../outside.xyz"})

    assert response.status_code == 403
    assert "outside the selected folder" in response.json()["detail"]
