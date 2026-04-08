"""
Presidio AnalyzerEngine wiring.

Uses the default English pipeline when `en_core_web_lg` or `en_core_web_sm` is
installed; otherwise falls back to `spacy.blank("en")` so pattern-based
recognizers (email, phone, etc.) still run without downloading models.
"""

from __future__ import annotations

import logging

import spacy
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine.spacy_nlp_engine import SpacyNlpEngine

logger = logging.getLogger(__name__)


class BlankSpacyNlpEngine(SpacyNlpEngine):
    """spaCy blank English — no model download; NER from statistical models is absent."""

    def load(self) -> None:
        logger.info(
            "Presidio: using spaCy blank('en'). "
            "Install a model for fuller NER: python -m spacy download en_core_web_lg"
        )
        self.nlp = {"en": spacy.blank("en")}


def create_analyzer() -> AnalyzerEngine:
    if spacy.util.is_package("en_core_web_lg") or spacy.util.is_package("en_core_web_sm"):
        try:
            return AnalyzerEngine()
        except Exception as exc:
            logger.warning("Presidio default NLP load failed (%s); using blank English.", exc)

    nlp_engine = BlankSpacyNlpEngine()
    return AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
