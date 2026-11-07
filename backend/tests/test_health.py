import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "VoxNote AI"
    assert "Prisma v3.0" in data["stt_engine"]


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gnani" in data
    assert data["gnani"]["model"] == "prisma-v3.0"
    assert "database" in data
    assert data["database"]["status"] == "connected"


def test_languages_endpoint():
    response = client.get("/api/languages")
    assert response.status_code == 200
    data = response.json()
    assert len(data["languages"]) == 10
    codes = [l["code"] for l in data["languages"]]
    assert "hi-IN" in codes
    assert "en-IN" in codes
    assert "ta-IN" in codes
    assert "te-IN" in codes
    assert "bn-IN" in codes
    assert "mr-IN" in codes
    assert "gu-IN" in codes
    assert "pa-IN" in codes
    assert "kn-IN" in codes
    assert "ml-IN" in codes
    assert data["auto_detect_code"] == "indic-auto"
    assert "codemix" in data["output_modes"]
    assert "transliterate" in data["output_modes"]
