import pytest
from app.services.gnani_service import gnani_service, LANGUAGE_METADATA
from gnani.stt import PRISMA_V3_MODEL, INDIC_AUTO_LANGUAGE_CODE, PRISMA_V3_FORMATS


def test_gnani_constants():
    assert PRISMA_V3_MODEL == "prisma-v3.0"
    assert INDIC_AUTO_LANGUAGE_CODE == "indic-auto"
    assert "codemix" in PRISMA_V3_FORMATS
    assert "transliterate" in PRISMA_V3_FORMATS
    assert "verbatim" in PRISMA_V3_FORMATS
    assert "transcribe" in PRISMA_V3_FORMATS


def test_supported_languages_count():
    languages = gnani_service.get_supported_languages()
    assert len(languages) == 10
    assert len(LANGUAGE_METADATA) == 10


def test_output_modes():
    modes = gnani_service.get_output_modes()
    assert set(modes) == {"verbatim", "transcribe", "codemix", "transliterate"}
