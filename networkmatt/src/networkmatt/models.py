from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


MAX_OBSERVATIONS = 128
MAX_UNKNOWN_ITEMS = 128
MAX_TEXT_LENGTH = 512


@dataclass(frozen=True)
class Observation:
    field: str
    value: Any
    confidence: float
    evidence: tuple[dict[str, Any], ...]

    @classmethod
    def from_mapping(cls, item: object) -> "Observation":
        if not isinstance(item, dict):
            raise ValueError("Each observation must be a JSON object")
        field = item.get("field")
        confidence = item.get("confidence")
        evidence = item.get("evidence", [])
        if not isinstance(field, str) or not field or len(field) > MAX_TEXT_LENGTH:
            raise ValueError("Observation field must be a short non-empty string")
        if isinstance(confidence, bool) or not isinstance(confidence, (float, int)):
            raise ValueError(f"Observation {field!r} needs a numeric confidence")
        if not 0.0 <= float(confidence) <= 1.0:
            raise ValueError(f"Observation {field!r} confidence must be between 0 and 1")
        if not isinstance(evidence, list) or not evidence or len(evidence) > MAX_OBSERVATIONS:
            raise ValueError(f"Observation {field!r} needs bounded evidence references")
        if any(not isinstance(entry, dict) for entry in evidence):
            raise ValueError("Evidence references must be JSON objects")
        return cls(field, item.get("value"), float(confidence), tuple(evidence))


@dataclass(frozen=True)
class AnalysisReport:
    schema_version: str
    analysis_id: str
    protocol: str
    observations: tuple[Observation, ...]
    unknowns: tuple[str, ...]
    inferences: tuple[str, ...]

    @classmethod
    def from_mapping(cls, payload: object) -> "AnalysisReport":
        if not isinstance(payload, dict):
            raise ValueError("Analysis report must be a JSON object")
        schema_version = payload.get("schema_version")
        analysis_id = payload.get("analysis_id")
        protocol = payload.get("protocol")
        observations = payload.get("observations")
        unknowns = payload.get("unknowns", [])
        inferences = payload.get("inferences", [])
        for name, value in (("schema_version", schema_version), ("analysis_id", analysis_id), ("protocol", protocol)):
            if not isinstance(value, str) or not value or len(value) > MAX_TEXT_LENGTH:
                raise ValueError(f"{name} must be a short non-empty string")
        if schema_version != "1":
            raise ValueError("Unsupported KEV report schema_version")
        if not isinstance(observations, list) or len(observations) > MAX_OBSERVATIONS:
            raise ValueError("observations must be a bounded JSON array")
        if not isinstance(unknowns, list) or len(unknowns) > MAX_UNKNOWN_ITEMS:
            raise ValueError("unknowns must be a bounded JSON array")
        if not isinstance(inferences, list) or len(inferences) > MAX_UNKNOWN_ITEMS:
            raise ValueError("inferences must be a bounded JSON array")
        if any(not isinstance(value, str) or len(value) > MAX_TEXT_LENGTH for value in unknowns + inferences):
            raise ValueError("unknowns and inferences must contain short strings")
        return cls(
            schema_version=schema_version,
            analysis_id=analysis_id,
            protocol=protocol,
            observations=tuple(Observation.from_mapping(item) for item in observations),
            unknowns=tuple(unknowns),
            inferences=tuple(inferences),
        )

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
